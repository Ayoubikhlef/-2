/**
 * Offline backup utility. It never prints row contents or the encryption key.
 *
 *   npx tsx scripts/backup-tool.ts inspect  <backup.enc>
 *   npx tsx scripts/backup-tool.ts decrypt  <backup.enc> <backup.json>
 *   npx tsx scripts/backup-tool.ts restore  <backup.enc> --yes [--dry-run]
 *
 * BACKUP_ENCRYPTION_KEY must be set in the environment, or supplied through
 * --key-file. Restoring replaces every table present in the backup, so it is
 * meant for a staging database first.
 */
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { BACKUP_KEY_MIN_LENGTH, isValidBackupKey, unpackBackupJson } from '../src/services/backupCrypto';

interface BackupPayload {
  format?: string;
  version?: number;
  createdAt?: string;
  tables?: Record<string, Array<Record<string, unknown>>>;
}

function usage(): never {
  console.error(
    [
      'Usage:',
      '  npx tsx scripts/backup-tool.ts inspect <backup.enc>',
      '  npx tsx scripts/backup-tool.ts decrypt <backup.enc> <backup.json>',
      '  npx tsx scripts/backup-tool.ts restore <backup.enc> --yes [--dry-run]',
      '',
      'The key is read from BACKUP_ENCRYPTION_KEY or --key-file <path>.',
    ].join('\n')
  );
  process.exit(2);
}

function readKey(args: string[]): string {
  const index = args.indexOf('--key-file');
  if (index !== -1) {
    const file = args[index + 1];
    if (!file) usage();
    return fs.readFileSync(file, 'utf8').trim();
  }
  const fromEnv = (process.env.BACKUP_ENCRYPTION_KEY || '').trim();
  if (fromEnv) return fromEnv;
  console.error(`Set BACKUP_ENCRYPTION_KEY (${BACKUP_KEY_MIN_LENGTH}+ characters) or pass --key-file.`);
  process.exit(2);
}

function loadPayload(file: string, key: string): { payload: BackupPayload; meta: { tables: number; rows: number } } {
  if (!isValidBackupKey(key)) {
    console.error(`The key must be at least ${BACKUP_KEY_MIN_LENGTH} characters.`);
    process.exit(2);
  }
  const payload = unpackBackupJson(fs.readFileSync(file), key) as BackupPayload;
  if (payload?.format !== 'aos-tech-store-backup' || payload?.version !== 1 || !payload.tables) {
    console.error('Unsupported or corrupt backup format.');
    process.exit(2);
  }
  let rows = 0;
  for (const value of Object.values(payload.tables)) rows += Array.isArray(value) ? value.length : 0;
  return { payload, meta: { tables: Object.keys(payload.tables).length, rows } };
}

function printSummary(payload: BackupPayload): void {
  console.log(`Created: ${payload.createdAt || 'unknown'}`);
  for (const [table, rows] of Object.entries(payload.tables || {})) {
    console.log(`  ${table}: ${Array.isArray(rows) ? rows.length : 0} rows`);
  }
}

function orderTables(tables: string[], edges: Array<{ child: string; parent: string }>): string[] {
  const present = new Set(tables);
  const dependencies = new Map<string, Set<string>>();
  for (const table of tables) dependencies.set(table, new Set());
  for (const { child, parent } of edges) {
    if (child !== parent && present.has(child) && present.has(parent)) {
      dependencies.get(child)!.add(parent);
    }
  }

  const result: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  let cycle = false;
  const visit = (table: string) => {
    if (visited.has(table) || cycle) return;
    if (visiting.has(table)) {
      cycle = true;
      return;
    }
    visiting.add(table);
    for (const parent of dependencies.get(table) || []) visit(parent);
    visiting.delete(table);
    visited.add(table);
    result.push(table);
  };
  for (const table of tables) visit(table);
  return cycle ? [] : result;
}

async function restore(file: string, key: string, dryRun: boolean): Promise<void> {
  const { payload, meta } = loadPayload(file, key);
  const tables = Object.keys(payload.tables || {});
  if (tables.length === 0) throw new Error('The backup contains no tables.');
  if (tables.some((table) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(table))) {
    throw new Error('The backup contains an invalid table name.');
  }

  const connectionString = (process.env.DATABASE_URL || '').trim();
  if (!connectionString) throw new Error('DATABASE_URL is not set.');

  const client = new Client({
    connectionString,
    ssl: /sslmode=(require|verify-ca|verify-full)/i.test(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
  });
  await client.connect();
  try {
    const fkRows = await client.query<{ child: string; parent: string }>(`
      SELECT tc.table_name AS child, ccu.table_name AS parent
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.constraint_schema = tc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    `);
    const ordered = orderTables(tables, fkRows.rows);
    const insertOrder = ordered.length > 0 ? ordered : [...tables].sort();

    console.log(`Backup: ${tables.length} tables, ${meta.rows} rows`);
    console.log(`Insert order: ${insertOrder.join(', ')}`);

    if (dryRun) {
      for (const table of insertOrder) {
        console.log(`  ${table}: ${(payload.tables?.[table] || []).length} rows`);
      }
      return;
    }

    await client.query('BEGIN');
    let replicaMode = false;
    await client.query('SAVEPOINT before_replica');
    try {
      await client.query("SET LOCAL session_replication_role = 'replica'");
      replicaMode = true;
    } catch {
      // Managed databases often reserve this GUC for superusers. The
      // dependency order above still makes a normal restore safe.
      await client.query('ROLLBACK TO SAVEPOINT before_replica');
    }
    if (!replicaMode && ordered.length === 0 && tables.length > 1) {
      throw new Error(
        'Foreign-key cycles need session_replication_role=replica, which this database user cannot set.'
      );
    }

    const quoted = insertOrder.map((table) => `"${table}"`).join(', ');
    await client.query(`TRUNCATE TABLE ${quoted} CASCADE`);
    console.log('Existing rows removed from the affected tables.');

    for (const table of insertOrder) {
      const rows = payload.tables?.[table] || [];
      for (const row of rows) {
        await client.query(
          `INSERT INTO "${table}" SELECT * FROM jsonb_populate_record(NULL::"${table}", $1::jsonb)`,
          [row]
        );
      }
      console.log(`  ${table}: ${rows.length} rows restored`);
    }

    const sequences = await client.query<{ table_name: string; column_name: string; seq: string | null }>(
      `SELECT table_name, column_name, pg_get_serial_sequence(quote_ident(table_name), column_name) AS seq
       FROM information_schema.columns
       WHERE table_schema = 'public' AND column_default LIKE 'nextval(%'`
    );
    for (const sequence of sequences.rows) {
      if (!sequence.seq) continue;
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(sequence.table_name)) continue;
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(sequence.column_name)) continue;
      await client.query(
        `SELECT setval($1::regclass, COALESCE((SELECT MAX("${sequence.column_name}") FROM "${sequence.table_name}"), 1), ` +
          `(SELECT COUNT(*) > 0 FROM "${sequence.table_name}"))`,
        [sequence.seq]
      );
    }

    await client.query('COMMIT');
    console.log('Restore completed.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const file = args[1];
  if (!command || !file) usage();

  if (command === 'restore') {
    if (!args.includes('--yes')) {
      console.error('Restore is destructive. Re-run with --yes after testing on a staging database.');
      process.exit(2);
    }
    const key = readKey(args);
    await restore(file, key, args.includes('--dry-run'));
    return;
  }

  const key = readKey(args);

  if (command === 'inspect') {
    const { payload } = loadPayload(file, key);
    console.log('Backup file is valid.');
    printSummary(payload);
    return;
  }

  if (command === 'decrypt') {
    const output = args[2];
    if (!output || output.startsWith('--')) usage();
    const { payload } = loadPayload(file, key);
    const target = path.resolve(output);
    fs.writeFileSync(target, JSON.stringify(payload, null, 2), { mode: 0o600 });
    console.log(`Decrypted plaintext written to ${target}`);
    console.log('This file contains customer data and password hashes. Delete it after the restore.');
    return;
  }

  usage();
}

main().catch((err) => {
  console.error('Backup tool failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});

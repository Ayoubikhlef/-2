import { Router, Response } from 'express';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { logAction } from '../services/audit';
import { clientIp } from '../services/security';
import {
  createEncryptedBackup,
  getBackupStatus,
  isBackupEncryptionConfigured,
  runBackup,
} from '../services/backup';

export const backupRouter = Router();

// A backup contains every customer record and password hash, so only the
// owner-level role may read or create one.
backupRouter.use(requireAuth, requireRole('SUPER_ADMIN'));

backupRouter.get('/status', async (_req, res: Response) => {
  try {
    res.json(await getBackupStatus());
  } catch (err) {
    console.error('[Backup] Status error:', err);
    res.status(500).json({ error: 'Could not read the backup status' });
  }
});

backupRouter.post('/download', async (req: AuthRequest, res: Response) => {
  if (!isBackupEncryptionConfigured()) {
    res.status(503).json({
      error:
        'Backup encryption is not configured. Set BACKUP_ENCRYPTION_KEY (32+ characters) on the API server.',
    });
    return;
  }
  try {
    const { buffer, meta } = await createEncryptedBackup();
    await logAction(
      req.userId,
      'BACKUP_DOWNLOADED',
      'Backup',
      { filename: meta.filename, size: meta.size, sha256: meta.sha256, tables: meta.tables, rows: meta.rows },
      clientIp(req)
    );
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${meta.filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(buffer);
  } catch (err) {
    console.error('[Backup] Download error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Could not create the backup',
    });
  }
});

backupRouter.post('/run', async (req: AuthRequest, res: Response) => {
  if (!isBackupEncryptionConfigured()) {
    res.status(503).json({
      error:
        'Backup encryption is not configured. Set BACKUP_ENCRYPTION_KEY (32+ characters) on the API server.',
    });
    return;
  }
  try {
    const result = await runBackup();
    await logAction(
      req.userId,
      'BACKUP_STORED',
      'Backup',
      {
        filename: result.filename,
        size: result.size,
        sha256: result.sha256,
        destination: result.destination,
      },
      clientIp(req)
    );
    res.json(result);
  } catch (err) {
    console.error('[Backup] Run error:', err);
    res.status(502).json({
      error: err instanceof Error ? err.message : 'Could not store the backup',
    });
  }
});

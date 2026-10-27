import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendTelegramMessage, sendDiscordWebhook } from './telegram';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export type SecurityEventType =
  | 'sqli'
  | 'xss'
  | 'path_traversal'
  | 'command_injection'
  | 'scanner'
  | 'sensitive_path'
  | 'rate_limit'
  | 'failed_login'
  | 'admin_gate'
  | 'manual_block';

export interface SecurityIncident {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  ip: string;
  method: string;
  path: string;
  userAgent: string;
  details?: string;
  createdAt: string;
}

export interface BlockedIp {
  ip: string;
  reason: string;
  until: string;
  createdAt: string;
}

interface ThreatRule {
  type: SecurityEventType;
  severity: SecuritySeverity;
  label: string;
  test: (text: string) => boolean;
}

interface AlertState {
  lastSent: number;
  count: number;
  firstAt: number;
}

const MAX_INCIDENTS = 500;
const ALERT_COOLDOWN_MS = 10 * 60 * 1000;
const MAX_ALERTS_PER_HOUR = 30;
const AUTO_BLOCK_MINUTES = 30;
const MAX_BODY_SCAN_CHARS = 20_000;

const incidents: SecurityIncident[] = [];
const blockedIps = new Map<string, { reason: string; until: number; createdAt: number }>();
const alertStates = new Map<string, AlertState>();
const persistStates = new Map<string, number>();
let alertTimestamps: number[] = [];

const SEVERITY_RANK: Record<SecuritySeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const THREAT_RULES: ThreatRule[] = [
  {
    type: 'sqli',
    severity: 'critical',
    label: 'SQL injection pattern',
    test: (text) =>
      /(\bunion\b[\s\S]{0,60}\bselect\b|\bselect\b[\s\S]{0,80}\bfrom\b|\bor\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+|information_schema|\bsleep\s*\(|\bbenchmark\s*\(|waitfor\s+delay|xp_cmdshell|load_file\s*\(|into\s+outfile|;\s*(drop|truncate|alter)\b)/i.test(
        text
      ),
  },
  {
    type: 'xss',
    severity: 'high',
    label: 'Cross-site scripting pattern',
    test: (text) =>
      /(<script\b|javascript\s*:|on(error|load|click|mouseover|focus)\s*=|document\.(cookie|location)|<iframe\b|srcdoc\s*=|eval\s*\()/i.test(
        text
      ),
  },
  {
    type: 'path_traversal',
    severity: 'high',
    label: 'Path traversal pattern',
    test: (text) =>
      /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c|\/etc\/passwd|\/proc\/self\/environ|boot\.ini|win\.ini)/i.test(text),
  },
  {
    type: 'command_injection',
    severity: 'critical',
    label: 'Command injection pattern',
    test: (text) =>
      /([;&|`]\s*(cat|ls|curl|wget|bash|sh|nc|python|perl|powershell|cmd)\b|\$\(|\bexec\s*\()/i.test(text),
  },
];

const SENSITIVE_PATH_RULE =
  /(^|\/)(\.env|\.git|\.svn|\.aws|wp-admin|wp-login\.php|phpmyadmin|xmlrpc\.php|server-status|actuator|config\.json|backup|dump\.sql|composer\.json)(\/|$|\?)/i;

const SCANNER_UA_RULE =
  /sqlmap|nikto|nmap|masscan|acunetix|nessus|dirbuster|gobuster|wpscan|zgrab|nuclei|hydra|metasploit|w3af|appscan|netsparker|openvas|qualys|burp\s*suite/i;

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  const ip = String(raw || req.ip || req.socket?.remoteAddress || 'unknown').trim();
  return ip.replace(/^::ffff:/, '');
}

function isBlockableIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  if (ip === '::1' || ip === 'localhost') return false;
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) return false;
  if (/^(fc|fd|fe80)/i.test(ip)) return false;
  return true;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function collectStrings(value: unknown, out: string[], depth = 0): void {
  if (depth > 4 || out.join(' ').length > MAX_BODY_SCAN_CHARS) return;
  if (typeof value === 'string') {
    out.push(value.slice(0, 2000));
    return;
  }
  if (Array.isArray(value)) {
    value.slice(0, 30).forEach((item) => collectStrings(item, out, depth + 1));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>)
      .slice(0, 40)
      .forEach(([key, item]) => {
        out.push(key);
        collectStrings(item, out, depth + 1);
      });
  }
}

export function detectThreats(req: Request): ThreatRule[] {
  const url = safeDecode(String(req.originalUrl || req.url || ''));
  const userAgent = String(req.headers['user-agent'] || '');
  const parts = [url, userAgent];
  if (req.body && typeof req.body === 'object') {
    const bodyStrings: string[] = [];
    collectStrings(req.body, bodyStrings);
    parts.push(...bodyStrings);
  }
  const text = parts.join('\n').slice(0, MAX_BODY_SCAN_CHARS);

  const threats = THREAT_RULES.filter((rule) => rule.test(text));
  if (SCANNER_UA_RULE.test(userAgent)) {
    threats.push({
      type: 'scanner',
      severity: 'high',
      label: 'Known attack scanner user-agent',
      test: () => true,
    });
  }
  if (SENSITIVE_PATH_RULE.test(url)) {
    threats.push({
      type: 'sensitive_path',
      severity: 'high',
      label: 'Attempt to access a sensitive path',
      test: () => true,
    });
  }
  return threats;
}

function addIncident(incident: SecurityIncident): void {
  incidents.unshift(incident);
  if (incidents.length > MAX_INCIDENTS) incidents.length = MAX_INCIDENTS;
}

function persistIncident(incident: SecurityIncident): void {
  const key = `${incident.ip}:${incident.type}`;
  const lastPersisted = persistStates.get(key) || 0;
  const now = Date.now();
  if (now - lastPersisted < 60_000) return;
  persistStates.set(key, now);
  if (persistStates.size > 2000) {
    for (const [stateKey, timestamp] of persistStates) {
      if (now - timestamp > 24 * 60 * 60 * 1000) persistStates.delete(stateKey);
    }
  }

  void prisma.auditLog
    .create({
      data: {
        action: `SECURITY_${incident.type.toUpperCase()}`,
        resource: incident.path.slice(0, 250),
        details: {
          severity: incident.severity,
          method: incident.method,
          path: incident.path,
          userAgent: incident.userAgent,
          details: incident.details,
          ip: incident.ip,
        },
        ipAddress: incident.ip,
      },
    })
    .catch(() => {
      /* audit table may not exist yet */
    });
}

function alertsConfigured(): boolean {
  return Boolean(
    (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) || process.env.DISCORD_WEBHOOK_URL
  );
}

async function dispatchAlert(incident: SecurityIncident, repeatCount: number): Promise<boolean> {
  const emoji = incident.severity === 'critical' ? '🚨' : incident.severity === 'high' ? '⚠️' : '🛡️';
  const repeat = repeatCount > 1 ? `\nRepeat count: ${repeatCount} (alerts grouped for 10 min)` : '';
  const text =
    `${emoji} <b>SECURITY ALERT</b>\n` +
    `Type: <b>${incident.type}</b> (${incident.severity})\n` +
    `IP: <code>${incident.ip}</code>\n` +
    `Request: ${incident.method} ${incident.path}\n` +
    `Details: ${incident.details || '-'}\n` +
    `User-Agent: ${incident.userAgent}\n` +
    `Time: ${incident.createdAt}${repeat}`;

  const plain = text.replace(/<[^>]+>/g, '');
  const results = await Promise.allSettled([sendTelegramMessage(text), sendDiscordWebhook(plain)]);
  return results.some((result) => result.status === 'fulfilled' && result.value === true);
}

function maybeSendAlert(incident: SecurityIncident): void {
  if (!alertsConfigured()) return;

  const now = Date.now();
  alertTimestamps = alertTimestamps.filter((timestamp) => now - timestamp < 60 * 60 * 1000);
  if (alertTimestamps.length >= MAX_ALERTS_PER_HOUR) return;

  if (alertStates.size > 1000) {
    for (const [stateKey, state] of alertStates) {
      if (now - state.lastSent > 24 * 60 * 60 * 1000) alertStates.delete(stateKey);
    }
  }

  const key = `${incident.ip}:${incident.type}`;
  const state = alertStates.get(key);
  if (state && now - state.lastSent < ALERT_COOLDOWN_MS) {
    state.count += 1;
    return;
  }

  const repeatCount = state ? state.count + 1 : 1;
  alertStates.set(key, { lastSent: now, count: repeatCount, firstAt: state?.firstAt || now });
  alertTimestamps.push(now);
  void dispatchAlert(incident, repeatCount);
}

export interface ReportSecurityEventOptions {
  type: SecurityEventType;
  severity: SecuritySeverity;
  req: Request;
  details?: string;
  autoBlock?: boolean;
}

export function reportSecurityEvent(options: ReportSecurityEventOptions): SecurityIncident {
  const { type, severity, req, details, autoBlock = true } = options;
  const ip = clientIp(req);
  const incident: SecurityIncident = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    severity,
    ip,
    method: String(req.method || 'GET').slice(0, 12),
    path: safeDecode(String(req.originalUrl || req.url || '/')).slice(0, 300),
    userAgent: String(req.headers['user-agent'] || 'unknown').slice(0, 160),
    details: details?.slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  addIncident(incident);
  console.warn(
    `[Security] ${severity.toUpperCase()} ${type} from ${ip} ${incident.method} ${incident.path}`
  );
  persistIncident(incident);
  maybeSendAlert(incident);

  if (autoBlock && isBlockableIp(ip) && (severity === 'critical' || severity === 'high')) {
    blockIp(ip, AUTO_BLOCK_MINUTES, `${type}: ${details || incident.path}`);
  }

  return incident;
}

export function blockIp(ip: string, minutes: number, reason: string): BlockedIp | null {
  const normalized = ip.replace(/^::ffff:/, '').trim();
  if (!isBlockableIp(normalized)) return null;
  const duration = Math.min(Math.max(Math.floor(minutes), 1), 24 * 60);
  const entry = {
    reason: reason.slice(0, 250),
    until: Date.now() + duration * 60 * 1000,
    createdAt: Date.now(),
  };
  blockedIps.set(normalized, entry);
  return {
    ip: normalized,
    reason: entry.reason,
    until: new Date(entry.until).toISOString(),
    createdAt: new Date(entry.createdAt).toISOString(),
  };
}

export function unblockIp(ip: string): boolean {
  return blockedIps.delete(ip.replace(/^::ffff:/, '').trim());
}

export function getBlockedIps(): BlockedIp[] {
  const now = Date.now();
  const result: BlockedIp[] = [];
  for (const [ip, entry] of blockedIps) {
    if (entry.until <= now) {
      blockedIps.delete(ip);
      continue;
    }
    result.push({
      ip,
      reason: entry.reason,
      until: new Date(entry.until).toISOString(),
      createdAt: new Date(entry.createdAt).toISOString(),
    });
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRecentIncidents(limit = 100): SecurityIncident[] {
  return incidents.slice(0, Math.min(Math.max(limit, 1), MAX_INCIDENTS));
}

export function getSecurityStatus() {
  return {
    alertsConfigured: alertsConfigured(),
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    discordConfigured: Boolean(process.env.DISCORD_WEBHOOK_URL),
    autoBlockEnabled: process.env.SECURITY_AUTO_BLOCK !== 'false',
    incidentsInMemory: incidents.length,
    blockedIps: getBlockedIps().length,
  };
}

export async function sendTestSecurityAlert(): Promise<boolean> {
  const text =
    `🛡️ <b>Security alert test</b>\n` +
    `If you can read this, AOS security alerts are working.\n` +
    `Time: ${new Date().toISOString()}`;
  const results = await Promise.allSettled([sendTelegramMessage(text), sendDiscordWebhook(text.replace(/<[^>]+>/g, ''))]);
  return results.some((result) => result.status === 'fulfilled' && result.value === true);
}

export function securityMonitor(req: Request, res: Response, next: NextFunction): void {
  const ip = clientIp(req);
  const entry = blockedIps.get(ip);
  if (entry) {
    if (entry.until > Date.now()) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    blockedIps.delete(ip);
  }

  const threats = detectThreats(req);
  if (threats.length === 0) {
    next();
    return;
  }

  const worst = threats.reduce((current, threat) =>
    SEVERITY_RANK[threat.severity] > SEVERITY_RANK[current.severity] ? threat : current
  );
  reportSecurityEvent({
    type: worst.type,
    severity: worst.severity,
    req,
    details: threats.map((threat) => threat.label).join('; '),
  });

  next();
}

export function securityRateLimitHandler(label: string) {
  return (req: Request, res: Response): void => {
    reportSecurityEvent({
      type: 'rate_limit',
      severity: 'medium',
      req,
      details: `Rate limit exceeded: ${label}`,
      autoBlock: false,
    });
    res.status(429).json({ error: 'Too many requests' });
  };
}

/**
 * Local Sentry Dashboard API - يعرض سجل الأخطاء المحلي
 */

import { getErrorLogs } from '@/lib/sentry.local';
import { readFile } from 'fs/promises';

export async function GET() {
  try {
    const errorLogs = await getErrorLogs();

    // قراءة ملف المؤشرات للأداء
    let metrics: any[] = [];
    try {
      const metricsContent = await readFile('./logs/sentry-metrics.jsonl', 'utf-8');
      metrics = JSON.parse(`[${metricsContent}]`);
    } catch {}

    // حساب إحصائيات
    const totalErrors = errorLogs.length;
    const lastError = errorLogs[errorLogs.length - 1];

    return Response.json({
      status: 'local-mode',
      message: 'Sentry يعمل بنمط محاكي محلي (بدون إرسال للخارج)',
      timestamp: new Date().toISOString(),
      statistics: {
        totalErrors,
        lastError: lastError?.content || null,
      },
      metricsCount: metrics.length,
      logs: errorLogs.map((log) => ({
        id: log.id,
        message: log.content.match(/\[ERROR\] (.+)/)?.[1]?.replace(/"/g, '') || '',
        fullLog: log.content.substring(0, 200), // عرض أول 200 أحرف فقط
      })),
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to get error logs', details: String(error) },
      { status: 500 }
    );
  }
}

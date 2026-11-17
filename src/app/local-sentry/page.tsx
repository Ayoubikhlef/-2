/**
 * لوحة تحكم Sentry المحلية (بدون حساب مجاني)
 * تعرض جميع الأخطاء المسجلة محلياً في ملفات
 */

'use client';

import { useEffect, useState } from 'react';

export default function LocalSentryDashboard() {
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsCount, setMetricsCount] = useState(0);

  // جلب الأخطاء من الـ API المحلي
  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/local-sentry-error-log');
        if (res.ok) {
          const data = await res.json();
          setErrorLogs(data.logs || []);
          setMetricsCount(data.metricsCount || 0);
        }
      } catch (error) {
        console.error('[LocalSentry] فشل جلب السجلات:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();

    // تحديث تلقائي كل 5 ثواني
    const interval = setInterval(fetchLogs, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <p>جاري تحميل سجل الأخطاء...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8">
      {/* رأس الصفحة */}
      <header className="bg-black/30 backdrop-blur-lg rounded-xl p-6 mb-8 border border-blue-500/30">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          🛡️ لوحة Sentry المحلية
        </h1>
        <p className="text-gray-300 mt-2">
          نظام مراقبة الأخطاء يعمل محلياً - جميع البيانات تبقى على جهازك
        </p>

        {/* إحصائيات */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-black/20 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">إجمالي الأخطاء</p>
            <p className="text-2xl font-bold text-red-400">{errorLogs.length}</p>
          </div>
          <div className="bg-black/20 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">مؤشرات الأداء</p>
            <p className="text-2xl font-bold text-green-400">{metricsCount}</p>
          </div>
          <div className="bg-black/20 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">وضع التشغيل</p>
            <p className="text-2xl font-bold text-blue-400">محلي</p>
          </div>
        </div>
      </header>

      {/* محتوى السجل */}
      {errorLogs.length === 0 ? (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-12 border border-green-500/30 text-center">
          <p className="text-6xl mb-4">✅</p>
          <h2 className="text-2xl font-bold text-green-400 mb-4">لا توجد أخطاء مسجلة!</h2>
          <p className="text-gray-300 max-w-xl mx-auto">
            يعمل نظام Sentry بنجاح. عند وقوع خطأ في التطبيق، سيتم تسجيله هنا تلقائياً.<br/>
            يمكنك اختبار النظام بتسجيل الخروج/الدخول أو إحداث خطأ مقصود.
          </p>
        </div>
      ) : (
        /* قائمة الأخطاء */
        <div className="space-y-4 max-w-4xl mx-auto">
          {errorLogs.map((log) => (
            <div
              key={log.id}
              className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-400">
                  {new Date(log.content.match(/\[(.*?)\]/)?.[1]).toLocaleString('ar-EG')}
                </span>
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">
                  خطأ
                </span>
              </div>

              <pre className="text-sm text-gray-300 overflow-x-auto p-4 bg-black/40 rounded-lg">
                {log.content}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* تذييل الصفحة */}
      <footer className="text-center text-gray-400 mt-12 p-4 bg-black/20 rounded-xl">
        <p>🔒 جميع البيانات محمية - لا يتم إرسال أي شيء للخارج</p>
        <p className="text-sm mt-2">ملف السجل: logs/sentry-errors.log</p>
      </footer>
    </div>
  );
}

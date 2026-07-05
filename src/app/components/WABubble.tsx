import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteSettings } from '../utils/siteSettingsStorage';

const settings = getSiteSettings();
const PHONE = settings.contact.phoneInternational;

export function WABubble() {
  const { t } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 12000);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-end gap-3" dir="ltr">
      <a
        href={`https://wa.me/${PHONE}?text=${encodeURIComponent(t({ ar: 'مرحباً، أريد الاستفسار عن خدماتكم', fr: 'Bonjour, je voudrais me renseigner sur vos services', en: 'Hello, I would like to inquire about your services' }))}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 hover:scale-110 transition-all duration-300 animate-bounce-subtle">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
      </a>
      {showTooltip && (
        <div className="relative px-4 py-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl text-sm font-medium border border-gray-200 dark:border-slate-700 max-w-[200px] animate-fade-in">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-400 dark:bg-slate-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
          {t({ ar: 'تواصل معنا عبر واتساب', fr: 'Contactez-nous sur WhatsApp', en: 'Chat with us on WhatsApp' })}
          <div className="absolute left-0 bottom-3 -translate-x-1.5 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-r-white dark:border-r-slate-800 border-b-[8px] border-b-transparent" />
        </div>
      )}
    </div>
  );
}
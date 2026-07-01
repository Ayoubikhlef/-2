import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (translations: { ar: string; fr: string; en: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function applyLanguage(lang: Language) {
  if (typeof window !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('language', lang);
  }
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'ar';
  }

  const savedLanguage = window.localStorage.getItem('language');
  if (savedLanguage === 'ar' || savedLanguage === 'fr' || savedLanguage === 'en') {
    applyLanguage(savedLanguage);
    return savedLanguage;
  }

  applyLanguage('ar');
  return 'ar';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  const t = (translations: { ar: string; fr: string; en: string }) => {
    return translations[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={language === 'ar' ? 'font-arabic' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

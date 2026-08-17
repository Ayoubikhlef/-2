import { ChevronDown, Check, Globe } from 'lucide-react';
import type { ReactElement } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';

function UKFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
      <path fill="#012169" d="M0 0h640v480H0z" />
      <path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" />
      <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zm440-217L521 0h39l-80 64zM0 64L119 0h39L0 94V64zm263 217L6 480h58l199-199zm263 0L320 197v-38l221 184v-62zM263 197L263 197L0 0h63l200 197z" />
    </svg>
  );
}

function AlgeriaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
      <path fill="#fff" d="M320 0h320v480H320z" />
      <path fill="#006233" d="M0 0h320v480H0z" />
      <path fill="#d21034" d="M424 130a110 110 0 1 0 0 220 90 90 0 1 1 0-220m4 40l-24 28-37-7 23 29-17 33 36-15 36 15-17-33 23-29-37 7z" />
    </svg>
  );
}

function FranceFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden="true">
      <path fill="#fff" d="M0 0h640v480H0z" />
      <path fill="#000091" d="M0 0h213.3v480H0z" />
      <path fill="#e1000f" d="M426.7 0H640v480H426.7z" />
    </svg>
  );
}

const FLAGS: Record<string, (props: { className?: string }) => ReactElement> = {
  en: UKFlag,
  ar: AlgeriaFlag,
  fr: FranceFlag,
};

const languages = [
  { code: 'en' as const, label: 'English' },
  { code: 'ar' as const, label: 'العربية' },
  { code: 'fr' as const, label: 'Français' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const current = languages.find((l) => l.code === language)!;
  const CurrentFlag = FLAGS[current.code];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer outline-none select-none">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold tracking-wide">{current.code.toUpperCase()}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[170px] rounded-xl border-border/60 bg-card/95 backdrop-blur-xl p-1.5 shadow-xl shadow-black/5 dark:shadow-black/20"
      >
        {languages.map((lang) => {
          const Flag = FLAGS[lang.code];
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                language === lang.code
                  ? 'bg-primary/10 text-primary dark:bg-primary/15'
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="inline-flex w-5 h-4 overflow-hidden rounded-sm shrink-0">
                <Flag className="w-5 h-4" />
              </span>
              <span className="flex-1">{lang.label}</span>
              {language === lang.code && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 dark:bg-primary/20">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
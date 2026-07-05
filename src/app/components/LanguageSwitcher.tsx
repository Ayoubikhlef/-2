import { ChevronDown, Check, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';

const languages = [
  { code: 'en' as const, label: 'English', flag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/250px-Flag_of_the_United_States.svg.png' },
  { code: 'ar' as const, label: 'العربية', flag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_Algeria.svg/250px-Flag_of_Algeria.svg.png' },
  { code: 'fr' as const, label: 'Français', flag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/250px-Flag_of_France.svg.png' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const current = languages.find((l) => l.code === language)!;

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
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
              language === lang.code
                ? 'bg-primary/10 text-primary dark:bg-primary/15'
                : 'text-foreground/80 hover:bg-muted hover:text-foreground'
            }`}
          >
            <img src={lang.flag} alt="" className="w-5 h-4 object-cover rounded-sm" />
            <span className="flex-1">{lang.label}</span>
            {language === lang.code && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 dark:bg-primary/20">
                <Check className="w-3.5 h-3.5 text-primary" />
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

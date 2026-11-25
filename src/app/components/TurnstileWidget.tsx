import { useEffect, useRef, useState } from 'react';

/**
 * Cloudflare Turnstile widget for the customer sign-in form.
 *
 * The widget is optional at build time: when VITE_TURNSTILE_SITE_KEY is not
 * set the component renders nothing and the API skips verification, so local
 * development and preview builds keep working. The matching secret lives only
 * in the server environment.
 */

type TurnstileLanguage = 'ar' | 'fr' | 'en';

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SITE_KEY = String(
  (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY || ''
).trim();

export const TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY);

const SCRIPT_ID = 'aos-turnstile-script';
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('NO_WINDOW'));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('TURNSTILE_LOAD_FAILED')), {
        once: true,
      });
      // The tag can already be loaded when this module is evaluated late.
      if (window.turnstile) resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('TURNSTILE_LOAD_FAILED'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

const LOAD_ERROR: Record<TurnstileLanguage, string> = {
  ar: 'تعذّر تحميل التحقق الأمني. أعد تحميل الصفحة ثم حاول مرة أخرى.',
  fr: 'Impossible de charger la vérification de sécurité. Rechargez la page puis réessayez.',
  en: 'The security check could not load. Reload the page and try again.',
};

export function TurnstileWidget({
  language,
  onToken,
  action = 'customer-login',
  resetKey = 0,
  className = '',
}: {
  language: TurnstileLanguage;
  onToken: (token: string) => void;
  action?: string;
  resetKey?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const tokenHandler = useRef(onToken);
  tokenHandler.current = onToken;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    setFailed(false);

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        if (widgetRef.current) {
          try {
            window.turnstile.remove(widgetRef.current);
          } catch {
            /* the widget was already removed */
          }
        }
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          language,
          action,
          callback: (token: string) => tokenHandler.current(token),
          'expired-callback': () => tokenHandler.current(''),
          'timeout-callback': () => tokenHandler.current(''),
          'error-callback': () => {
            tokenHandler.current('');
            return true;
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetRef.current);
        } catch {
          /* the widget was already removed */
        }
      }
      widgetRef.current = null;
    };
  }, [action, language, resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;

  return (
    <div className={`flex min-h-[65px] flex-col items-center justify-center gap-1 ${className}`}>
      <div ref={containerRef} />
      {failed && (
        <p role="alert" className="text-center text-[11px] font-medium leading-relaxed text-rose-300">
          {LOAD_ERROR[language]}
        </p>
      )}
    </div>
  );
}

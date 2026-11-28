import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Monitor, Smartphone, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { templateDescription, templateName, type FactoryTemplate } from './factoryUtils';
import { CATEGORY_LABELS, CATEGORY_TINT, displayCategory } from './templateCategories';

/**
 * Template preview dialog. The iframe is created only while the dialog is
 * mounted, so no preview is fetched until the visitor actually opens it.
 * A native <dialog> gives us Esc-to-close, focus trapping and focus restore.
 */
export function TemplatePreviewDialog({
  templates,
  index,
  onNavigate,
  onClose,
  onUse,
}: {
  templates: FactoryTemplate[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
  onUse: (template: FactoryTemplate) => void;
}) {
  const { t, language } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mobile, setMobile] = useState(false);
  const template = templates[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog?.open) dialog.close();
    };
  }, []);

  useEffect(() => setMobile(false), [template.slug]);

  if (!template) return null;
  const demoUrl = `/templates/${template.slug}/`;
  const bucket = displayCategory(template.category, template.slug);
  const go = (delta: number) => {
    const next = index + delta;
    if (next >= 0 && next < templates.length) onNavigate(next);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={t({ ar: 'معاينة القالب', fr: 'Aperçu du modèle', en: 'Template preview' })}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          go(language === 'ar' ? -1 : 1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          go(language === 'ar' ? 1 : -1);
        }
      }}
      className="m-auto w-[min(920px,calc(100vw-16px))] max-h-[calc(100dvh-16px)] overflow-y-auto rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-slate-950/70"
    >
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-3">
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold sm:text-base">{templateName(template, language)}</h3>
        <div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5" role="group" aria-label={t({ ar: 'حجم المعاينة', fr: 'Taille de l’aperçu', en: 'Preview size' })}>
          <button
            type="button"
            onClick={() => setMobile(false)}
            aria-pressed={!mobile}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${!mobile ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            <Monitor className="h-4 w-4" aria-hidden="true" />
            {t({ ar: 'حاسوب', fr: 'Ordinateur', en: 'Desktop' })}
          </button>
          <button
            type="button"
            onClick={() => setMobile(true)}
            aria-pressed={mobile}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${mobile ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            {t({ ar: 'جوال', fr: 'Mobile', en: 'Mobile' })}
          </button>
        </div>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label={t({ ar: 'إغلاق المعاينة', fr: 'Fermer l’aperçu', en: 'Close preview' })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-muted/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className={`flex justify-center px-4 py-5 ${CATEGORY_TINT[bucket]}`}>
        <div className={`w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-900/10 ${mobile ? 'max-w-[390px]' : ''}`}>
          <iframe
            key={template.slug}
            src={demoUrl}
            title={t({ ar: `معاينة ${templateName(template, language)}`, fr: `Aperçu de ${templateName(template, language)}`, en: `${templateName(template, language)} preview` })}
            className="h-[min(58vh,520px)] min-h-[300px] w-full border-0"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {templateDescription(template, language)}
          <span className="mt-1 block text-[11px] font-semibold">
            {CATEGORY_LABELS[bucket][language]} · AR / FR / EN
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index <= 0}
            aria-label={t({ ar: 'القالب السابق', fr: 'Modèle précédent', en: 'Previous template' })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition hover:border-primary disabled:opacity-40"
          >
            <ArrowRight className={`h-4 w-4 ${language === 'ar' ? '' : 'rotate-180'}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index >= templates.length - 1}
            aria-label={t({ ar: 'القالب التالي', fr: 'Modèle suivant', en: 'Next template' })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition hover:border-primary disabled:opacity-40"
          >
            <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? '' : 'rotate-180'}`} aria-hidden="true" />
          </button>
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold transition hover:border-primary"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t({ ar: 'تبويب جديد', fr: 'Nouvel onglet', en: 'New tab' })}</span>
          </a>
          <button
            type="button"
            onClick={() => onUse(template)}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:brightness-110 sm:flex-none sm:text-sm"
          >
            {t({ ar: 'استخدم هذا القالب', fr: 'Utiliser ce modèle', en: 'Use this template' })}
          </button>
        </div>
      </div>
    </dialog>
  );
}

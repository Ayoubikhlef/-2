import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeDollarSign,
  Bug,
  Check,
  CheckCircle2,
  Circle,
  Cookie,
  Copy,
  Crosshair,
  Database,
  Download,
  Fingerprint,
  FolderLock,
  GitBranch,
  Globe2,
  HardDrive,
  KeyRound,
  Link2,
  Network,
  Package,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  Siren,
  Terminal,
  Timer,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import {
  SECURITY_CHECKLIST,
  type ChecklistLanguage,
} from '../data/securityChecklist';

const STORAGE_KEY = 'aos_security_checklist_v1';

const ITEM_ICONS: Record<string, LucideIcon> = {
  'admin-2fa': ShieldCheck,
  'api-keys': KeyRound,
  database: Database,
  https: Globe2,
  'password-hashing': Fingerprint,
  'server-validation': ServerCog,
  'xss-sqli-csrf': Bug,
  'login-limits': Timer,
  'cors-headers': Network,
  cookies: Cookie,
  'password-reset': Link2,
  uploads: Upload,
  'pricing-payment': BadgeDollarSign,
  debug: Terminal,
  dependencies: Package,
  'exposed-files': FolderLock,
  'git-secrets': GitBranch,
  'backup-waf': HardDrive,
  alerts: Siren,
  pentest: Crosshair,
};

const REPORT_COMMAND: Record<ChecklistLanguage, string> = {
  ar: 'اكتب لي تقريرًا أمنيًّا نهائيًّا عن هذا المشروع في ملف SECURITY-REPORT.md: ما فحصناه، وما أصلحناه مع الملفات، وما بقي ناقصًا ودرجته، وما يجب أن أفعله بيدي، وقائمة قصيرة أعيد فحصها كل شهر. بكلمات بسيطة، ودون أي قيمة مفتاح أو كلمة مرور.',
  fr: "Rédigez un rapport de sécurité final pour ce projet dans SECURITY-REPORT.md : ce qui a été vérifié, ce qui a été corrigé avec les fichiers, ce qui reste et sa gravité, ce que je dois faire moi-même, et une courte liste à revérifier chaque mois. En mots simples, sans aucune valeur de clé ou de mot de passe.",
  en: 'Write a final security report for this project in SECURITY-REPORT.md: what was checked, what was fixed and in which files, what remains and its severity, what I must do myself, and a short list to recheck every month. In plain words, with no key or password values.',
};

function readProgress(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const valid = new Set(SECURITY_CHECKLIST.map((item) => item.id));
    return new Set(
      parsed.filter((id): id is string => typeof id === 'string' && valid.has(id)),
    );
  } catch {
    return new Set();
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand('copy');
      area.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

function formatDate(language: ChecklistLanguage): string {
  const locale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function SecurityChecklistPage() {
  const { language, t } = useLanguage();
  const lang = language as ChecklistLanguage;
  const [done, setDone] = useState<Set<string>>(readProgress);
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<number | null>(null);

  const total = SECURITY_CHECKLIST.length;
  const percent = Math.round((done.size / total) * 100);

  const steps = useMemo(
    () => [
      t({
        ar: 'افتح Claude Code داخل مجلد المشروع.',
        fr: 'Ouvrez Claude Code dans le dossier du projet.',
        en: 'Open Claude Code inside the project folder.',
      }),
      t({
        ar: 'انسخ الأمر، واقرأ الاقتراح قبل الموافقة على أي تعديل.',
        fr: 'Copiez la commande et lisez la proposition avant d’accepter.',
        en: 'Copy the prompt and read the proposal before approving anything.',
      }),
      t({
        ar: 'خذ نسخة احتياطية، طبّق، اختبر، ثم علّم البطاقة كمنجزة.',
        fr: 'Sauvegardez, appliquez, testez, puis marquez la carte comme faite.',
        en: 'Back up, apply, test, then mark the card as done.',
      }),
    ],
    [t],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
    } catch {
      // Private browsing can reject storage; progress simply stays in memory.
    }
  }, [done]);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const markCopied = (id: string) => {
    setCopied(id);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const copy = async (id: string, text: string, successMessage?: string) => {
    const ok = await copyText(text);
    if (ok) {
      markCopied(id);
      toast.success(
        successMessage ||
          t({ ar: 'تم نسخ الأمر', fr: 'Commande copiée', en: 'Prompt copied' }),
      );
    } else {
      toast.error(
        t({
          ar: 'تعذّر النسخ. حدّد النص وانسخه يدويًا.',
          fr: 'Copie impossible. Sélectionnez le texte et copiez-le.',
          en: 'Copy failed. Select the text and copy it manually.',
        }),
      );
    }
  };

  const copyAll = () => {
    const heading = t({
      ar: 'قائمة VIBE CODING — كل الأوامر',
      fr: 'Liste VIBE CODING — toutes les commandes',
      en: 'VIBE CODING checklist — all prompts',
    });
    const lines = [`${heading} — AOS Tech Store`, ''];

    SECURITY_CHECKLIST.forEach((item, index) => {
      lines.push(`${String(index + 1).padStart(2, '0')}. ${item.title[lang]}`);
      lines.push(item.command[lang]);
      lines.push('');
    });
    lines.push('---');
    lines.push(t({ ar: 'التقرير النهائي', fr: 'Rapport final', en: 'Final report' }));
    lines.push(REPORT_COMMAND[lang]);

    return copy(
      'all',
      lines.join('\n'),
      t({
        ar: 'تم نسخ كل الأوامر',
        fr: 'Toutes les commandes copiées',
        en: 'All prompts copied',
      }),
    );
  };

  const toggle = (id: string) => {
    setDone((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    const ok = window.confirm(
      t({
        ar: 'هل تريد إعادة التقدّم إلى الصفر؟',
        fr: 'Réinitialiser toute la progression ?',
        en: 'Reset all progress?',
      }),
    );
    if (ok) setDone(new Set());
  };

  const download = () => {
    const title = t({
      ar: 'قائمة VIBE CODING — الحماية',
      fr: 'Liste VIBE CODING — Sécurité',
      en: 'VIBE CODING checklist — Security',
    });
    const lines: string[] = [
      `# ${title}`,
      '',
      `AOS Tech Store — ${formatDate(lang)}`,
      '',
      `${done.size} / ${total} (${percent}%)`,
      '',
    ];

    SECURITY_CHECKLIST.forEach((item, index) => {
      lines.push(`## ${String(index + 1).padStart(2, '0')}. ${item.title[lang]}`);
      lines.push('');
      lines.push(item.summary[lang]);
      lines.push('');
      lines.push(
        done.has(item.id)
          ? t({ ar: '- [x] منجز', fr: '- [x] Fait', en: '- [x] Done' })
          : t({ ar: '- [ ] غير منجز', fr: '- [ ] À faire', en: '- [ ] To do' }),
      );
      lines.push('');
      lines.push('```text');
      lines.push(item.command[lang]);
      lines.push('```');
      lines.push('');
    });

    lines.push('---');
    lines.push('');
    lines.push(`## ${t({ ar: 'التقرير النهائي', fr: 'Rapport final', en: 'Final report' })}`);
    lines.push('');
    lines.push(REPORT_COMMAND[lang]);
    lines.push('');

    const blob = new Blob([lines.join('\n')], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `aos-security-checklist-${lang}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    toast.success(
      t({
        ar: 'تم تحميل القائمة',
        fr: 'Liste téléchargée',
        en: 'Checklist downloaded',
      }),
    );
  };

  return (
    <div className="bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            {t({
              ar: 'العودة إلى المتجر',
              fr: 'Retour à la boutique',
              en: 'Back to the store',
            })}
          </a>

          <div className="mt-7 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                VIBE CODING
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {t({
                  ar: 'قائمة الحماية لمتجرك',
                  fr: 'La liste de protection de votre boutique',
                  en: 'Your store security checklist',
                })}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {t({
                  ar: 'عشرون حماية أساسية لكل موقع، واحدة واحدة، مع أمر جاهز لكل خطوة. علّم ما أنجزته، وحمّل القائمة لتعود إليها لاحقًا.',
                  fr: 'Vingt protections essentielles pour tout site, une par une, avec une commande prête à chaque étape. Marquez ce qui est fait et téléchargez la liste pour y revenir plus tard.',
                  en: 'Twenty essential protections for any site, one at a time, with a ready prompt for each step. Mark what is done and download the list to come back to it later.',
                })}
              </p>
            </div>

            <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold">
                  {t({ ar: 'تقدّمك', fr: 'Votre progression', en: 'Your progress' })}
                </span>
                <span className="text-2xl font-extrabold text-primary" dir="ltr">
                  {done.size}/{total}
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done.size}
                aria-label={t({
                  ar: 'تقدّم قائمة الحماية',
                  fr: 'Progression de la liste de protection',
                  en: 'Security checklist progress',
                })}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t({
                  ar: 'يُحفظ التقدّم في هذا المتصفح فقط.',
                  fr: 'La progression est enregistrée dans ce navigateur uniquement.',
                  en: 'Progress is saved in this browser only.',
                })}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {t({ ar: 'تحميل القائمة', fr: 'Télécharger', en: 'Download' })}
                </button>
                <button
                  type="button"
                  onClick={copyAll}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-background px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
                >
                  {copied === 'all' ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  {copied === 'all'
                    ? t({ ar: 'تم النسخ', fr: 'Copié', en: 'Copied' })
                    : t({ ar: 'نسخ الكل', fr: 'Tout copier', en: 'Copy all' })}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t({ ar: 'إعادة التقدّم', fr: 'Réinitialiser', en: 'Reset' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="text-lg font-extrabold">
          {t({ ar: 'طريقة الاستعمال', fr: 'Mode d’emploi', en: 'How to use it' })}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">
                {index + 1}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">
            {t({
              ar: 'الحمايات العشرون',
              fr: 'Les vingt protections',
              en: 'The twenty protections',
            })}
          </h2>
          <span
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted-foreground"
            dir="ltr"
          >
            {done.size} / {total}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {SECURITY_CHECKLIST.map((item, index) => {
            const isDone = done.has(item.id);
            const Icon = ITEM_ICONS[item.id] || ShieldCheck;
            return (
              <article
                key={item.id}
                className={`flex h-full flex-col rounded-2xl border bg-card p-5 transition-colors ${
                  isDone ? 'border-emerald-500/50' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      isDone
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold leading-snug">
                        <span className="text-muted-foreground" dir="ltr">
                          {String(index + 1).padStart(2, '0')}.
                        </span>{' '}
                        {item.title[lang]}
                      </h3>
                      {isDone && (
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                          {t({ ar: 'منجز', fr: 'Fait', en: 'Done' })}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.summary[lang]}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                      {t({ ar: 'الأمر', fr: 'Commande', en: 'Prompt' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(item.id, item.command[lang])}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/10"
                      aria-label={t({
                        ar: 'نسخ الأمر',
                        fr: 'Copier la commande',
                        en: 'Copy the prompt',
                      })}
                    >
                      {copied === item.id ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {copied === item.id
                        ? t({ ar: 'تم النسخ', fr: 'Copié', en: 'Copied' })
                        : t({ ar: 'نسخ', fr: 'Copier', en: 'Copy' })}
                    </button>
                  </div>
                  <pre
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    className={`max-h-36 overflow-y-auto whitespace-pre-wrap break-words text-start text-[13px] leading-relaxed text-foreground ${
                      lang === 'ar' ? 'font-sans' : 'font-mono'
                    }`}
                  >
                    {item.command[lang]}
                  </pre>
                </div>

                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={isDone}
                  className={`mt-3 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isDone
                    ? t({ ar: 'تم — إلغاء', fr: 'Fait — annuler', en: 'Done — undo' })
                    : t({ ar: 'طبّقتُه', fr: 'Je l’ai fait', en: 'I did this' })}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-extrabold">
                {t({ ar: 'التقرير النهائي', fr: 'Le rapport final', en: 'The final report' })}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t({
                  ar: 'بعد إنجاز البنود، اطلب تقريرًا واحدًا يجمع ما أُصلح وما بقي، لتعود إليه كل شهر. لا تضع فيه أي مفتاح أو كلمة مرور.',
                  fr: 'Une fois les points terminés, demandez un rapport unique qui résume les corrections et ce qui reste, à revoir chaque mois. N’y mettez aucune clé ni mot de passe.',
                  en: 'When the items are done, ask for one report that sums up what was fixed and what remains, to revisit every month. Never include keys or passwords.',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copy('report', REPORT_COMMAND[lang])}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
            >
              {copied === 'report' ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied === 'report'
                ? t({ ar: 'تم النسخ', fr: 'Copié', en: 'Copied' })
                : t({ ar: 'نسخ أمر التقرير', fr: 'Copier la commande', en: 'Copy the prompt' })}
            </button>
          </div>
          <pre
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className={`mt-4 whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/40 p-4 text-start text-[13px] leading-relaxed text-foreground ${
              lang === 'ar' ? 'font-sans' : 'font-mono'
            }`}
          >
            {REPORT_COMMAND[lang]}
          </pre>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {t({
            ar: 'هذه القائمة تعليمية وليست ضمانًا أمنيًا. اختبر أي تعديل على نسخة تجريبية، ولا تنفّذ أوامر الهجوم على الموقع الحي.',
            fr: 'Cette liste est pédagogique et ne garantit pas la sécurité. Testez toute modification sur une copie de test et ne lancez jamais les commandes d’attaque sur la production.',
            en: 'This checklist is educational and is not a security guarantee. Test any change on a staging copy, and never run the attack prompts against production.',
          })}
        </p>
      </section>
    </div>
  );
}

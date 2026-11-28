import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { FactoryTemplate } from './factoryUtils';
import { TemplateCard } from './FactoryShared';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import {
  CATEGORY_LABELS,
  DISPLAY_CATEGORIES,
  displayCategory,
  type DisplayCategory,
} from './templateCategories';

const PAGE_SIZE = 24;

function countText(count: number, language: 'ar' | 'fr' | 'en') {
  if (language === 'ar') {
    if (count === 0) return '';
    if (count === 1) return 'قالب واحد';
    if (count === 2) return 'قالبان';
    if (count <= 10) return `${count} قوالب`;
    return `${count} قالباً`;
  }
  if (language === 'fr') return count === 1 ? '1 modèle' : `${count} modèles`;
  return count === 1 ? '1 template' : `${count} templates`;
}

export function TemplateGallery({
  templates,
  activeSlug,
  onSelect,
}: {
  templates: FactoryTemplate[];
  activeSlug: string;
  onSelect: (template: FactoryTemplate) => void;
}) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | DisplayCategory>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return templates.filter((template) => {
      const bucket = displayCategory(template.category, template.slug);
      if (category !== 'all' && bucket !== category) return false;
      if (!needle) return true;
      const haystack = [
        template.nameAr,
        template.nameFr,
        template.nameEn,
        template.descAr,
        template.descFr,
        template.descEn,
        template.category,
        ...Object.values(CATEGORY_LABELS[bucket]),
      ]
        .join(' ')
        .toLocaleLowerCase();
      return haystack.includes(needle);
    });
  }, [templates, query, category]);

  const shown = filtered.slice(0, limit);
  const chips: Array<{ key: 'all' | DisplayCategory; label: string; count: number }> = [
    {
      key: 'all',
      label: t({ ar: 'الكل', fr: 'Tous', en: 'All' }),
      count: templates.length,
    },
    ...DISPLAY_CATEGORIES.map((key) => ({
      key,
      label: CATEGORY_LABELS[key][language],
      count: templates.filter((template) => displayCategory(template.category, template.slug) === key).length,
    })),
  ];

  function updateQuery(value: string) {
    setQuery(value);
    setLimit(PAGE_SIZE);
    setPreviewIndex(null);
  }

  function updateCategory(key: 'all' | DisplayCategory) {
    setCategory(key);
    setLimit(PAGE_SIZE);
    setPreviewIndex(null);
  }

  return (
    <div>
      <label className="relative mb-3 block">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder={t({
            ar: 'ابحث عن قالب: متجر، مطعم، معرض...',
            fr: 'Rechercher un modèle : boutique, restaurant, portfolio...',
            en: 'Search templates: store, restaurant, portfolio...',
          })}
          aria-label={t({ ar: 'ابحث في القوالب', fr: 'Rechercher dans les modèles', en: 'Search templates' })}
          className="w-full rounded-xl border border-border bg-card py-3 pe-3 ps-10 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={t({ ar: 'تصنيفات القوالب', fr: 'Catégories de modèles', en: 'Template categories' })}>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            aria-pressed={category === chip.key}
            onClick={() => updateCategory(chip.key)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              category === chip.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            <span>{chip.label}</span>
            <span className={`tabular-nums ${category === chip.key ? 'opacity-80' : 'opacity-60'}`}>{chip.count}</span>
          </button>
        ))}
        <span className="ms-auto text-xs text-muted-foreground">{countText(filtered.length, language)}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t({
            ar: 'لا توجد قوالب مطابقة. جرّب كلمة أخرى أو اختر «الكل».',
            fr: 'Aucun modèle ne correspond. Essayez un autre mot ou choisissez « Tous ».',
            en: 'No matching templates. Try another word or choose “All”.',
          })}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                active={activeSlug === template.slug}
                onSelect={() => onSelect(template)}
                onPreview={() => setPreviewIndex(filtered.indexOf(template))}
              />
            ))}
          </div>
          {filtered.length > limit && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setLimit((current) => current + PAGE_SIZE)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t({ ar: 'عرض المزيد', fr: 'Afficher plus', en: 'Show more' })} ({filtered.length - limit})
              </button>
            </div>
          )}
        </>
      )}

      {previewIndex !== null && filtered[previewIndex] && (
        <TemplatePreviewDialog
          templates={filtered}
          index={previewIndex}
          onNavigate={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
          onUse={(template) => {
            onSelect(template);
            setPreviewIndex(null);
          }}
        />
      )}
    </div>
  );
}

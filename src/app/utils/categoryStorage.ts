export interface CustomCategory {
  key: string;
  label: { ar: string; fr: string; en: string };
}

const STORAGE_KEY = 'aos_categories';

const builtInCategories: CustomCategory[] = [
  { key: 'mice', label: { ar: 'فأرة', fr: 'Souris', en: 'Mouse' } },
  { key: 'monitors', label: { ar: 'شاشات', fr: 'Moniteurs', en: 'Monitors' } },
  { key: 'storage', label: { ar: 'تخزين', fr: 'Stockage', en: 'Storage' } },
  { key: 'printers', label: { ar: 'طابعات', fr: 'Imprimantes', en: 'Printers' } },
  { key: 'accessories', label: { ar: 'إكسسوارات', fr: 'Accessoires', en: 'Accessories' } },
];

export function getBuiltInCategories(): CustomCategory[] {
  return builtInCategories;
}

export function getAllCategories(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return [...builtInCategories, ...parsed];
      }
    }
  } catch {}
  return builtInCategories;
}

export function getCustomCategories(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function addCustomCategory(category: CustomCategory): void {
  const custom = getCustomCategories();
  if (custom.some((c) => c.key === category.key)) return;
  custom.push(category);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

export function removeCustomCategory(key: string): void {
  const custom = getCustomCategories().filter((c) => c.key !== key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

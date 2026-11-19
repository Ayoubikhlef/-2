import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Lock,
  Save,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { api } from '../utils/api';

type Lang = { ar: string; fr: string; en: string };
type Unit = 'money' | 'percent' | 'count';
type Tone = 'good' | 'bad' | 'muted';

type Row = { label: Lang; value: number; unit: Unit; tone?: Tone };
type CalcResult = {
  primary: { label: Lang; value: number; unit: Unit };
  rows: Row[];
  warning?: Lang;
};
type FieldDef = { key: string; label: Lang; suffix: string; fallback: string };
type CalcDef = {
  id: string;
  label: Lang;
  blurb: Lang;
  icon: typeof Calculator;
  fields: FieldDef[];
  compute: (v: Record<string, number>) => CalcResult;
};

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function toNumber(value: string): number {
  const cleaned = String(value ?? '').replace(/[\s,]/g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatValue(value: number, unit: Unit, language: string): string {
  if (!Number.isFinite(value)) return '—';
  if (unit === 'money') {
    const suffix = language === 'ar' ? 'دج' : 'DA';
    return `${money.format(Math.round(value))} ${suffix}`;
  }
  if (unit === 'percent') return `${decimal.format(value)}%`;
  return decimal.format(value);
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

/* ------------------------------------------------------------------ */
/* Calculator definitions                                             */
/* ------------------------------------------------------------------ */

const D = (
  key: string,
  ar: string,
  fr: string,
  en: string,
  suffix: string,
  fallback: string,
): FieldDef => ({ key, label: { ar, fr, en }, suffix, fallback });

const CALCULATORS: CalcDef[] = [
  {
    id: 'full',
    label: { ar: 'احسب منتجاتك أنت', fr: 'Calculez votre produit', en: 'Calculate your product' },
    blurb: {
      ar: 'كل التكاليف في مكان واحد: الشراء، الإعلان، التأكيد، التغليف والمرتجعات.',
      fr: 'Tous les coûts au même endroit : achat, publicité, confirmation, emballage et retours.',
      en: 'Every cost in one place: purchase, ads, confirmation, packaging and returns.',
    },
    icon: Calculator,
    fields: [
      D('purchase', 'سعر الشراء', 'Prix d’achat', 'Purchase price', 'دج', '1600'),
      D('sell', 'سعر البيع', 'Prix de vente', 'Selling price', 'دج', '4900'),
      D('adBudget', 'ميزانية الإعلان', 'Budget publicitaire', 'Ad budget', 'دج', '30000'),
      D('orders', 'عدد الطلبات المستلمة', 'Commandes reçues', 'Orders received', 'طلبية', '100'),
      D('confirm', 'نسبة التأكيد', 'Taux de confirmation', 'Confirmation rate', '%', '70'),
      D('delivery', 'نسبة التسليم', 'Taux de livraison', 'Delivery rate', '%', '65'),
      D('confirmCost', 'تكلفة تأكيد الطلبية', 'Coût de confirmation', 'Confirmation cost', 'دج', '150'),
      D('packaging', 'التغليف ومصاريف أخرى', 'Emballage et autres frais', 'Packaging and other costs', 'دج', '80'),
      D('returnCost', 'تكلفة المرتجع', 'Coût d’un retour', 'Cost of a return', 'دج', '200'),
    ],
    compute: (v) => {
      const confirmed = v.orders * (v.confirm / 100);
      const delivered = confirmed * (v.delivery / 100);
      const returns = Math.max(0, confirmed - delivered);

      const revenue = delivered * v.sell;
      const productCost = delivered * v.purchase;
      const confirmTotal = delivered * v.confirmCost;
      const packTotal = delivered * v.packaging;
      const returnsTotal = returns * v.returnCost;
      const totalCost = productCost + v.adBudget + confirmTotal + packTotal + returnsTotal;
      const netTotal = revenue - totalCost;
      const netPerDelivered = safeDiv(netTotal, delivered);
      const margin = v.sell > 0 ? (netPerDelivered / v.sell) * 100 : 0;
      const breakEven = safeDiv(totalCost, delivered);
      const suggested = breakEven / 0.7;
      const adPerDelivered = safeDiv(v.adBudget, delivered);
      const returnsPerDelivered = safeDiv(returnsTotal, delivered);
      const maxAd = v.sell * 0.7 - (v.purchase + v.confirmCost + v.packaging + returnsPerDelivered);

      return {
        primary: {
          label: {
            ar: 'الربح الصافي للطلبية المسلمة',
            fr: 'Bénéfice net par commande livrée',
            en: 'Net profit per delivered order',
          },
          value: netPerDelivered,
          unit: 'money',
        },
        rows: [
          {
            label: { ar: 'هامش الربح', fr: 'Marge bénéficiaire', en: 'Profit margin' },
            value: margin,
            unit: 'percent',
            tone: margin >= 30 ? 'good' : margin >= 0 ? 'muted' : 'bad',
          },
          {
            label: { ar: 'تكلفة الطلبية المسلمة', fr: 'Coût par commande livrée', en: 'Cost per delivered order' },
            value: breakEven,
            unit: 'money',
          },
          {
            label: { ar: 'السعر المقترح لهامش 30%', fr: 'Prix conseillé pour 30 % de marge', en: 'Suggested price for a 30% margin' },
            value: suggested,
            unit: 'money',
          },
          {
            label: { ar: 'الإعلان للطلبية المسلمة', fr: 'Publicité par commande livrée', en: 'Ad cost per delivered order' },
            value: adPerDelivered,
            unit: 'money',
          },
          {
            label: { ar: 'أقصى تكلفة إعلان لهامش 30%', fr: 'Coût publicitaire max pour 30 % de marge', en: 'Max ad cost for a 30% margin' },
            value: maxAd,
            unit: 'money',
            tone: maxAd >= 0 ? 'good' : 'bad',
          },
          {
            label: { ar: 'الطلبيات المسلمة', fr: 'Commandes livrées', en: 'Delivered orders' },
            value: delivered,
            unit: 'count',
          },
          {
            label: { ar: 'الربح الإجمالي المتوقع', fr: 'Bénéfice total prévu', en: 'Expected total profit' },
            value: netTotal,
            unit: 'money',
            tone: netTotal >= 0 ? 'good' : 'bad',
          },
          {
            label: { ar: 'الإيراد المتوقع', fr: 'Chiffre d’affaires prévu', en: 'Expected revenue' },
            value: revenue,
            unit: 'money',
          },
        ],
        warning:
          delivered <= 0
            ? {
                ar: 'أدخل نسبة تأكيد ونسبة تسليم أكبر من صفر لحساب النتيجة.',
                fr: 'Saisissez un taux de confirmation et de livraison supérieurs à zéro.',
                en: 'Enter confirmation and delivery rates above zero to calculate.',
              }
            : undefined,
      };
    },
  },
  {
    id: 'pricing',
    label: { ar: 'حاسبة تسعير المنتجات', fr: 'Calculateur de prix', en: 'Product pricing' },
    blurb: {
      ar: 'اعرف السعر الذي يغطي كل تكاليفك ويترك لك الهامش الذي تريده.',
      fr: 'Trouvez le prix qui couvre tous vos coûts et laisse la marge voulue.',
      en: 'Find the price that covers every cost and leaves the margin you want.',
    },
    icon: Wallet,
    fields: [
      D('purchase', 'سعر الشراء', 'Prix d’achat', 'Purchase price', 'دج', '1600'),
      D('packaging', 'التغليف', 'Emballage', 'Packaging', 'دج', '80'),
      D('confirmCost', 'تكلفة التأكيد', 'Coût de confirmation', 'Confirmation cost', 'دج', '150'),
      D('adPerOrder', 'الإعلان لكل طلبية', 'Publicité par commande', 'Ad per order', 'دج', '650'),
      D('returns', 'نسبة المرتجعات', 'Taux de retours', 'Return rate', '%', '10'),
      D('margin', 'الهامش المستهدف', 'Marge visée', 'Target margin', '%', '30'),
    ],
    compute: (v) => {
      const base = v.purchase + v.packaging + v.confirmCost + v.adPerOrder;
      const returnsCost = base * (v.returns / 100);
      const totalCost = base + returnsCost;
      const marginRate = Math.min(95, Math.max(0, v.margin)) / 100;
      const price = totalCost / (1 - marginRate);
      const profit = price - totalCost;
      return {
        primary: {
          label: { ar: 'السعر المقترح للبيع', fr: 'Prix de vente conseillé', en: 'Suggested selling price' },
          value: price,
          unit: 'money',
        },
        rows: [
          { label: { ar: 'الربح لكل طلبية', fr: 'Bénéfice par commande', en: 'Profit per order' }, value: profit, unit: 'money', tone: 'good' },
          { label: { ar: 'التكلفة الكاملة', fr: 'Coût complet', en: 'Full cost' }, value: totalCost, unit: 'money' },
          { label: { ar: 'تكلفة المرتجعات', fr: 'Coût des retours', en: 'Returns cost' }, value: returnsCost, unit: 'money' },
          {
            label: { ar: 'الهامش الفعلي', fr: 'Marge réelle', en: 'Actual margin' },
            value: price > 0 ? (profit / price) * 100 : 0,
            unit: 'percent',
            tone: 'good',
          },
        ],
      };
    },
  },
  {
    id: 'orderCost',
    label: { ar: 'حاسبة تكلفة الطلبية', fr: 'Coût par commande', en: 'Order cost' },
    blurb: {
      ar: 'كم تكلّفك الطلبية فعلياً بعد التأكيد والتسليم؟',
      fr: 'Combien vous coûte réellement une commande après confirmation et livraison ?',
      en: 'What does an order really cost after confirmation and delivery?',
    },
    icon: TrendingDown,
    fields: [
      D('adBudget', 'ميزانية الإعلان', 'Budget publicitaire', 'Ad budget', 'دج', '30000'),
      D('received', 'الطلبات المستلمة', 'Commandes reçues', 'Orders received', 'طلبية', '100'),
      D('confirm', 'نسبة التأكيد', 'Taux de confirmation', 'Confirmation rate', '%', '70'),
      D('delivery', 'نسبة التسليم', 'Taux de livraison', 'Delivery rate', '%', '65'),
    ],
    compute: (v) => {
      const confirmed = v.received * (v.confirm / 100);
      const delivered = confirmed * (v.delivery / 100);
      return {
        primary: {
          label: { ar: 'تكلفة الإعلان للطلبية المسلمة', fr: 'Coût publicitaire par commande livrée', en: 'Ad cost per delivered order' },
          value: safeDiv(v.adBudget, delivered),
          unit: 'money',
        },
        rows: [
          {
            label: { ar: 'تكلفة الطلبية المستلمة', fr: 'Coût par commande reçue', en: 'Cost per received order' },
            value: safeDiv(v.adBudget, v.received),
            unit: 'money',
          },
          {
            label: { ar: 'تكلفة الطلبية المؤكدة', fr: 'Coût par commande confirmée', en: 'Cost per confirmed order' },
            value: safeDiv(v.adBudget, confirmed),
            unit: 'money',
          },
          { label: { ar: 'الطلبيات المؤكدة', fr: 'Commandes confirmées', en: 'Confirmed orders' }, value: confirmed, unit: 'count' },
          { label: { ar: 'الطلبيات المسلمة', fr: 'Commandes livrées', en: 'Delivered orders' }, value: delivered, unit: 'count' },
        ],
        warning:
          delivered <= 0
            ? {
                ar: 'أدخل نسباً أكبر من صفر لمعرفة التكلفة الحقيقية.',
                fr: 'Saisissez des taux supérieurs à zéro pour connaître le coût réel.',
                en: 'Enter rates above zero to see the real cost.',
              }
            : undefined,
      };
    },
  },
  {
    id: 'adCeiling',
    label: { ar: 'حاسبة سقف الإعلان', fr: 'Plafond publicitaire', en: 'Ad ceiling' },
    blurb: {
      ar: 'أقصى مبلغ يمكنك دفعه للإعلان قبل أن تختفي أرباحك.',
      fr: 'Le montant maximal à payer en publicité avant de perdre votre marge.',
      en: 'The maximum you can pay for ads before your profit disappears.',
    },
    icon: TrendingUp,
    fields: [
      D('sell', 'سعر البيع', 'Prix de vente', 'Selling price', 'دج', '4900'),
      D('purchase', 'سعر الشراء', 'Prix d’achat', 'Purchase price', 'دج', '1600'),
      D('packaging', 'التغليف', 'Emballage', 'Packaging', 'دج', '80'),
      D('confirmCost', 'تكلفة التأكيد', 'Coût de confirmation', 'Confirmation cost', 'دج', '150'),
      D('returns', 'نسبة المرتجعات', 'Taux de retours', 'Return rate', '%', '10'),
      D('margin', 'الهامش المستهدف', 'Marge visée', 'Target margin', '%', '30'),
      D('confirm', 'نسبة التأكيد', 'Taux de confirmation', 'Confirmation rate', '%', '70'),
      D('delivery', 'نسبة التسليم', 'Taux de livraison', 'Delivery rate', '%', '65'),
    ],
    compute: (v) => {
      const costs = v.purchase + v.packaging + v.confirmCost;
      const returnsCost = costs * (v.returns / 100);
      const marginRate = Math.min(95, Math.max(0, v.margin)) / 100;
      const targetProfit = v.sell * marginRate;
      const maxAdPerDelivered = v.sell - costs - returnsCost - targetProfit;
      const deliveredRatio = (v.confirm / 100) * (v.delivery / 100);
      const breakEvenAd = v.sell - costs - returnsCost;
      return {
        primary: {
          label: { ar: 'أقصى تكلفة إعلان للطلبية المسلمة', fr: 'Coût publicitaire max par commande livrée', en: 'Max ad cost per delivered order' },
          value: maxAdPerDelivered,
          unit: 'money',
        },
        rows: [
          {
            label: { ar: 'أقصى تكلفة إعلان للطلبية المستلمة', fr: 'Coût publicitaire max par commande reçue', en: 'Max ad cost per received order' },
            value: maxAdPerDelivered * deliveredRatio,
            unit: 'money',
          },
          {
            label: { ar: 'سقف التعادل (بدون ربح)', fr: 'Seuil de rentabilité (sans bénéfice)', en: 'Break-even ceiling (no profit)' },
            value: breakEvenAd,
            unit: 'money',
            tone: 'muted',
          },
          {
            label: { ar: 'الربح المستهدف للطلبية', fr: 'Bénéfice visé par commande', en: 'Target profit per order' },
            value: targetProfit,
            unit: 'money',
            tone: 'good',
          },
          {
            label: { ar: 'هامش الربح بدون إعلان', fr: 'Marge sans publicité', en: 'Margin with no ads' },
            value: v.sell > 0 ? (breakEvenAd / v.sell) * 100 : 0,
            unit: 'percent',
          },
        ],
        warning:
          maxAdPerDelivered < 0
            ? {
                ar: 'سعر البيع لا يغطي التكاليف والهامش المطلوب: ارفع السعر أو خفّض التكاليف.',
                fr: 'Le prix de vente ne couvre pas les coûts et la marge visée : augmentez le prix ou réduisez les coûts.',
                en: 'The selling price does not cover costs plus the target margin: raise the price or cut costs.',
              }
            : undefined,
      };
    },
  },
  {
    id: 'goal',
    label: { ar: 'هدف الشهر وتكلفة الاسترداد', fr: 'Objectif du mois', en: 'Monthly goal' },
    blurb: {
      ar: 'من هدف الإيراد إلى عدد الطلبات والميزانية الإعلانية المطلوبة.',
      fr: 'De l’objectif de chiffre d’affaires au nombre de commandes et au budget pub.',
      en: 'From a revenue goal to the orders and ad budget you need.',
    },
    icon: TrendingUp,
    fields: [
      D('goalRevenue', 'هدف الإيراد الشهري', 'Objectif de CA mensuel', 'Monthly revenue goal', 'دج', '300000'),
      D('avgOrder', 'متوسط سعر الطلبية', 'Panier moyen', 'Average order value', 'دج', '4900'),
      D('confirm', 'نسبة التأكيد', 'Taux de confirmation', 'Confirmation rate', '%', '70'),
      D('delivery', 'نسبة التسليم', 'Taux de livraison', 'Delivery rate', '%', '65'),
      D('cpa', 'تكلفة الإعلان للطلبية', 'Coût pub par commande', 'Ad cost per order', 'دج', '800'),
    ],
    compute: (v) => {
      const delivered = Math.ceil(safeDiv(v.goalRevenue, v.avgOrder));
      const confirmed = Math.ceil(safeDiv(delivered, v.delivery / 100));
      const received = Math.ceil(safeDiv(confirmed, v.confirm / 100));
      const adBudget = delivered * v.cpa;
      return {
        primary: {
          label: { ar: 'طلبيات مسلمة مطلوبة شهرياً', fr: 'Commandes livrées nécessaires par mois', en: 'Delivered orders needed per month' },
          value: delivered,
          unit: 'count',
        },
        rows: [
          { label: { ar: 'طلبيات مؤكدة مطلوبة', fr: 'Commandes confirmées nécessaires', en: 'Confirmed orders needed' }, value: confirmed, unit: 'count' },
          { label: { ar: 'طلبات مستلمة (ليدز) مطلوبة', fr: 'Demandes reçues (leads) nécessaires', en: 'Received orders (leads) needed' }, value: received, unit: 'count' },
          { label: { ar: 'الميزانية الإعلانية المطلوبة', fr: 'Budget publicitaire nécessaire', en: 'Required ad budget' }, value: adBudget, unit: 'money' },
          { label: { ar: 'الإيراد المستهدف', fr: 'Chiffre d’affaires visé', en: 'Target revenue' }, value: v.goalRevenue, unit: 'money' },
          {
            label: { ar: 'تكلفة الاسترداد لكل طلبية', fr: 'Coût d’acquisition par commande', en: 'Acquisition cost per order' },
            value: v.cpa,
            unit: 'money',
          },
        ],
      };
    },
  },
];

/* ------------------------------------------------------------------ */
/* Saved results                                                       */
/* ------------------------------------------------------------------ */

type SavedCalc = { id: string; at: number; calc: string; values: Record<string, string> };

const savedKey = (userId: string) => `aos_calc_saved_v1_${userId}`;
const MAX_SAVED = 20;

function readSaved(userId: string): SavedCalc[] {
  try {
    const raw = window.localStorage.getItem(savedKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string' && item.values);
  } catch {
    return [];
  }
}

function persistSaved(userId: string, list: SavedCalc[]): void {
  try {
    window.localStorage.setItem(savedKey(userId), JSON.stringify(list.slice(0, MAX_SAVED)));
  } catch {
    // Private mode or full storage: saving is best effort.
  }
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function NumberField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t, language } = useLanguage();
  const id = `calc-${field.key}`;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold sm:text-sm">
        <span>{t(field.label)}</span>
        <span className="text-[11px] font-medium text-muted-foreground">{t(field.suffix === 'دج' ? { ar: 'دج', fr: 'DA', en: 'DZD' } : field.suffix === 'طلبية' ? { ar: 'طلبية', fr: 'cmd', en: 'orders' } : { ar: '%', fr: '%', en: '%' })}</span>
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.,\s-]/g, ''))}
        className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm font-semibold tabular-nums outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        dir="ltr"
        aria-label={t(field.label)}
        placeholder={language === 'ar' ? '0' : '0'}
      />
    </label>
  );
}

function ResultTile({ row }: { row: Row }) {
  const { t, language } = useLanguage();
  const toneClass =
    row.tone === 'good'
      ? 'text-emerald-700 dark:text-emerald-300'
      : row.tone === 'bad'
        ? 'text-rose-700 dark:text-rose-300'
        : 'text-foreground';
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs leading-snug text-muted-foreground sm:text-sm">{t(row.label)}</span>
      <span className={`shrink-0 text-sm font-bold tabular-nums ${toneClass}`}>
        {formatValue(row.value, row.unit, language)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function ProfitCalculatorPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [activeId, setActiveId] = useState(CALCULATORS[0].id);
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    for (const calc of CALCULATORS) {
      initial[calc.id] = Object.fromEntries(calc.fields.map((field) => [field.key, field.fallback]));
    }
    return initial;
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [saved, setSaved] = useState<SavedCalc[]>(() => (user ? readSaved(user.id) : []));
  const [saving, setSaving] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);

  // Saved results live on the server for signed-in customers. The local copy
  // stays as an instant/offline fallback and is migrated once per account.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setSaved([]);
      return;
    }
    const local = readSaved(user.id);
    setSaved(local);
    setSavedLoading(true);
    (async () => {
      try {
        const data = await api.calculator.list();
        let rows: SavedCalc[] = data.results.map((row) => ({
          id: row.id,
          at: Date.parse(row.createdAt),
          calc: row.calc,
          values: row.values,
        }));
        const migrationKey = `aos_calc_migrated_v1_${user.id}`;
        const alreadyMigrated = window.localStorage.getItem(migrationKey) === '1';
        if (!alreadyMigrated && local.length > 0) {
          for (const item of local.slice(0, Math.max(0, MAX_SAVED - rows.length))) {
            try {
              const created = await api.calculator.save({ calc: item.calc, values: item.values });
              rows = [
                {
                  id: created.result.id,
                  at: Date.parse(created.result.createdAt),
                  calc: created.result.calc,
                  values: created.result.values,
                },
                ...rows,
              ];
            } catch {
              // Keep going: one failed row must not block the rest.
            }
          }
          window.localStorage.setItem(migrationKey, '1');
          if (rows.length > 0) window.localStorage.removeItem(savedKey(user.id));
        }
        persistSaved(user.id, rows);
        if (!cancelled) setSaved(rows.slice(0, MAX_SAVED));
      } catch {
        // Offline or API unavailable: keep the local copy.
      } finally {
        if (!cancelled) setSavedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const active = CALCULATORS.find((calc) => calc.id === activeId) ?? CALCULATORS[0];

  const parsed = useMemo(() => {
    const current = values[active.id] ?? {};
    return Object.fromEntries(active.fields.map((field) => [field.key, toNumber(current[field.key])]));
  }, [active, values]);

  const result = useMemo(() => active.compute(parsed), [active, parsed]);
  const negative = result.primary.value < 0;

  const updateValue = (key: string, next: string) => {
    setValues((previous) => ({
      ...previous,
      [active.id]: { ...previous[active.id], [key]: next },
    }));
  };

  const resetValues = () => {
    setValues((previous) => ({
      ...previous,
      [active.id]: Object.fromEntries(active.fields.map((field) => [field.key, field.fallback])),
    }));
  };

  const saveResult = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (saving) return;
    setSaving(true);
    const snapshotValues = { ...values[active.id] };
    try {
      const created = await api.calculator.save({
        calc: active.id,
        values: snapshotValues,
        label: t(active.label),
      });
      const snapshot: SavedCalc = {
        id: created.result.id,
        at: Date.parse(created.result.createdAt),
        calc: created.result.calc,
        values: created.result.values,
      };
      const next = [snapshot, ...saved].slice(0, MAX_SAVED);
      setSaved(next);
      persistSaved(user.id, next);
      toast.success(
        t({
          ar: 'تم حفظ النتيجة في حسابك',
          fr: 'Résultat enregistré dans votre compte',
          en: 'Result saved to your account',
        }),
      );
    } catch {
      // Offline fallback: keep the calculation on this device and say so.
      const snapshot: SavedCalc = {
        id: `local_${Date.now()}`,
        at: Date.now(),
        calc: active.id,
        values: snapshotValues,
      };
      const next = [snapshot, ...saved].slice(0, MAX_SAVED);
      setSaved(next);
      persistSaved(user.id, next);
      toast.warning(
        t({
          ar: 'تم الحفظ في هذا المتصفح فقط. سيُزامن مع حسابك عند عودة الاتصال.',
          fr: 'Enregistré sur ce navigateur uniquement. La synchronisation se fera au retour de la connexion.',
          en: 'Saved in this browser only. It will sync with your account when the connection returns.',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const restoreSaved = (item: SavedCalc) => {
    setActiveId(item.calc);
    setValues((previous) => ({
      ...previous,
      [item.calc]: { ...previous[item.calc], ...item.values },
    }));
    toast.success(
      t({ ar: 'تمت استعادة الحساب', fr: 'Calcul restauré', en: 'Calculation restored' }),
    );
  };

  const deleteSaved = (id: string) => {
    if (!user) return;
    const next = saved.filter((item) => item.id !== id);
    setSaved(next);
    persistSaved(user.id, next);
    if (!id.startsWith('local_')) {
      void api.calculator.remove(id).catch(() => {
        toast.error(
          t({
            ar: 'تعذر حذف النتيجة من الخادم. أعد المحاولة.',
            fr: 'Suppression serveur impossible. Réessayez.',
            en: 'Could not delete the result on the server. Try again.',
          }),
        );
      });
    }
  };

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-emerald-500/10 via-background to-background px-4 pb-12 pt-14">
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <Calculator className="h-3.5 w-3.5" />
            {t({ ar: 'حاسبات المتجر', fr: 'Calculateurs boutique', en: 'Store calculators' })}
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl md:text-5xl">
            {t({ ar: 'احسب أرباحك قبل أن تبيع', fr: 'Calculez vos bénéfices avant de vendre', en: 'Calculate your profit before you sell' })}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t({
              ar: 'أدخل أرقامك الحقيقية واعرف ربحك الصافي، هامشك، وسقف الإعلان الذي لا يجب تجاوزه. الحساب فوري ومجاني وبدون تسجيل.',
              fr: 'Saisissez vos vrais chiffres et découvrez votre bénéfice net, votre marge et le plafond publicitaire à ne pas dépasser. Calcul immédiat, gratuit et sans inscription.',
              en: 'Enter your real numbers to see your net profit, margin and the ad ceiling you should not cross. Instant, free and no sign-up.',
            })}
          </p>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-6xl px-4">
        {/* Calculator tabs */}
        <div className="flex snap-x gap-2 overflow-x-auto pb-2" role="tablist" aria-label={t({ ar: 'الحاسبات', fr: 'Calculateurs', en: 'Calculators' })}>
          {CALCULATORS.map((calc) => {
            const Icon = calc.icon;
            const selected = calc.id === active.id;
            return (
              <button
                key={calc.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(calc.id)}
                className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-bold transition sm:text-sm ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(calc.label)}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{t(active.blurb)}</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          {/* Inputs */}
          <form
            className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              saveResult();
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold sm:text-lg">{t(active.label)}</h2>
              <button
                type="button"
                onClick={resetValues}
                className="text-xs font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t({ ar: 'القيم الافتراضية', fr: 'Valeurs par défaut', en: 'Reset values' })}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {active.fields.map((field) => (
                <NumberField
                  key={field.key}
                  field={field}
                  value={values[active.id]?.[field.key] ?? ''}
                  onChange={(next) => updateValue(field.key, next)}
                />
              ))}
            </div>

            <p className="mt-5 rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              {t({
                ar: 'كل المبالغ بالدينار الجزائري. عدّل أي رقم وستتحدث النتيجة مباشرة.',
                fr: 'Tous les montants sont en dinar algérien. Modifiez un chiffre, le résultat se met à jour aussitôt.',
                en: 'All amounts are in Algerian dinar. Change any number and the result updates instantly.',
              })}
            </p>
          </form>

          {/* Results */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div
                className={`px-5 py-6 text-center ${
                  negative
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                }`}
                aria-live="polite"
              >
                <p className="text-xs font-bold uppercase tracking-wide opacity-80">{t(result.primary.label)}</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums sm:text-4xl">
                  {formatValue(result.primary.value, result.primary.unit, language)}
                </p>
                {result.primary.unit === 'money' && (
                  <p className="mt-1 text-xs opacity-80">
                    {negative
                      ? t({ ar: 'خسارة — راجع التكاليف', fr: 'Perte — revoyez les coûts', en: 'Loss — review your costs' })
                      : t({ ar: 'ربح متوقع لكل طلبية مسلمة', fr: 'Bénéfice prévu par commande livrée', en: 'Expected profit per delivered order' })}
                  </p>
                )}
              </div>

              <div className="px-5 py-2">
                {result.rows.map((row) => (
                  <ResultTile key={`${row.label.en}-${row.unit}`} row={row} />
                ))}
              </div>
            </div>

            {result.warning && (
              <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                {t(result.warning)}
              </p>
            )}

            {/* Save / account */}
            <div className="mt-4 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {t({ ar: 'محفوظ في مساحتك', fr: 'Enregistré dans votre espace', en: 'Saved to your space' })}
                  </div>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {t({ ar: `مسجّل الدخول: ${user.name || user.email}`, fr: `Connecté : ${user.name || user.email}`, en: `Signed in: ${user.name || user.email}` })}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {t({
                      ar: 'النتائج تُحفظ في حسابك على الخادم وتظهر على أي جهاز بعد تسجيل الدخول.',
                      fr: 'Les résultats sont enregistrés sur votre compte et apparaissent sur tout appareil après connexion.',
                      en: 'Results are saved to your account and appear on any device after signing in.',
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => void saveResult()}
                    disabled={saving}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saving
                      ? t({ ar: 'جارٍ الحفظ…', fr: 'Enregistrement…', en: 'Saving…' })
                      : t({ ar: 'احفظ هذه النتيجة في مساحتي', fr: 'Enregistrer ce résultat', en: 'Save this result' })}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Lock className="h-4 w-4 text-primary" />
                    {t({ ar: 'سجّل مجاناً لحفظ نتائجك', fr: 'Inscrivez-vous gratuitement pour garder vos résultats', en: 'Sign up free to keep your results' })}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t({
                      ar: 'الحساب يحفظ حساباتك في مساحتك على الخادم، فتستعيدها من أي جهاز. الحساب مجاني.',
                      fr: 'Le compte garde vos calculs dans votre espace sur le serveur et les retrouve sur tout appareil. Gratuit.',
                      en: 'An account keeps your calculations in your space on the server and restores them on any device. Free.',
                    })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthOpen(true)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                    >
                      {t({ ar: 'إنشاء حساب مجاني', fr: 'Créer un compte gratuit', en: 'Create a free account' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthOpen(true)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-bold transition hover:bg-muted"
                    >
                      {t({ ar: 'لدي حساب', fr: 'J’ai déjà un compte', en: 'I have an account' })}
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>

        {/* Saved calculations */}
        {user && saved.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold sm:text-xl">
              {t({ ar: 'نتائجي المحفوظة', fr: 'Mes résultats enregistrés', en: 'My saved results' })}
            </h2>
            {savedLoading && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t({ ar: 'جارٍ مزامنة نتائجك مع حسابك…', fr: 'Synchronisation avec votre compte…', en: 'Syncing with your account…' })}
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((item) => {
                const def = CALCULATORS.find((calc) => calc.id === item.calc);
                return (
                  <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm font-bold">{def ? t(def.label) : item.calc}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB')}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => restoreSaved(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-primary/20 dark:text-sky-300"
                      >
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        {t({ ar: 'استعادة', fr: 'Restaurer', en: 'Restore' })}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSaved(item.id)}
                        aria-label={t({ ar: 'حذف', fr: 'Supprimer', en: 'Delete' })}
                        className="inline-flex items-center justify-center rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Link to the AI tools + closing note */}
        <section className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold sm:text-lg">
                  {t({ ar: 'جاهز تكتب إعلانك وصفحة منتجك؟', fr: 'Prêt à écrire votre publicité et votre page produit ?', en: 'Ready to write your ad and product page?' })}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t({
                    ar: '13 أداة ذكاء اصطناعي جاهزة: فاحص المنتج، صانع العروض، تحليل المنافس، الإعلانات، صفحات المنتج وصفحات الهبوط.',
                    fr: '13 outils IA prêts : analyse produit, offres, concurrents, publicités, pages produit et pages de vente.',
                    en: '13 ready AI tools: product checks, offers, competitor analysis, ads, product pages and landing pages.',
                  })}
                </p>
              </div>
            </div>
            <a
              href="/ai-tools"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              {t({ ar: 'افتح أدوات AI', fr: 'Ouvrir les outils IA', en: 'Open AI tools' })}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </a>
          </div>
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
          {t({
            ar: 'النتائج تقديرية وتعتمد على أرقامك. راجعها مع محاسبك قبل اتخاذ قرارات كبيرة. لا نشارك مدخلاتك مع أي طرف.',
            fr: 'Les résultats sont estimatifs et dépendent de vos chiffres. Faites-les vérifier avant une décision importante. Vos saisies ne sont partagées avec aucun tiers.',
            en: 'Results are estimates based on your numbers. Review them before a major decision. Your input is not shared with any third party.',
          })}
        </p>
      </div>

      {authOpen && (
        <LoginPage onClose={() => setAuthOpen(false)} onAuthenticated={() => setAuthOpen(false)} />
      )}
    </div>
  );
}

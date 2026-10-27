/**
 * Server-side delivery pricing.
 *
 * Keep this file in sync with `src/app/data/deliveryTariff.ts`. The base
 * tariffs are the official Yalidine Express June 2025 table (DZD), covering
 * a parcel of up to 5 kg. Locality ids 59..69 inherit their parent wilaya.
 */

export type DeliveryMethod = 'home' | 'desk';

export interface DeliveryTariff {
  id: number;
  wilayaId: number;
  home: number;
  desk: number;
}

export interface DeliveryRules {
  includedWeightKg: number;
  extraKgFee: number;
  extraKgFeeRemote: number;
  volumetricDivisor: number;
  maxWeightKg: number;
  oversizeFee: number;
  largeSideThresholdCm: number;
  girthThresholdCm: number;
  remoteLocalityIds: number[];
}

export interface PricedItemInput {
  quantity: number;
  weight?: string | number | null;
  dimensions?: string | null;
}

export interface DeliveryQuoteInput {
  localityId: number;
  method: DeliveryMethod;
  subtotal: number;
  items: PricedItemInput[];
  freeThreshold?: number;
  homeFees?: Record<string, number>;
  deskFees?: Record<string, number>;
  rules?: Partial<DeliveryRules>;
}

export interface DeliveryQuote {
  localityId: number;
  wilayaId: number;
  method: DeliveryMethod;
  remote: boolean;
  baseFee: number;
  parcels: number;
  billedWeightKg: number;
  excessWeightKg: number;
  weightFee: number;
  oversizeCount: number;
  oversizeSurcharge: number;
  shippingFee: number;
  freeShipping: boolean;
  freeThreshold: number;
  deliveryFee: number;
}

type RawTariff = readonly [id: number, home: number, desk: number];

const BASE_TARIFFS: readonly RawTariff[] = [
  [1, 1500, 1200],
  [2, 900, 650],
  [3, 1050, 800],
  [4, 900, 650],
  [5, 900, 650],
  [6, 900, 650],
  [7, 1050, 800],
  [8, 1500, 1200],
  [9, 700, 500],
  [10, 900, 650],
  [11, 1700, 1300],
  [12, 1050, 800],
  [13, 900, 650],
  [14, 900, 650],
  [15, 900, 650],
  [16, 600, 500],
  [17, 1050, 800],
  [18, 900, 650],
  [19, 900, 650],
  [20, 900, 650],
  [21, 900, 650],
  [22, 900, 650],
  [23, 900, 650],
  [24, 900, 650],
  [25, 900, 650],
  [26, 900, 650],
  [27, 900, 650],
  [28, 900, 650],
  [29, 900, 650],
  [30, 1050, 800],
  [31, 900, 650],
  [32, 1700, 1300],
  [33, 1700, 1300],
  [34, 900, 650],
  [35, 700, 500],
  [36, 900, 650],
  [37, 1700, 1300],
  [38, 900, 650],
  [39, 1050, 800],
  [40, 900, 650],
  [41, 900, 650],
  [42, 700, 500],
  [43, 900, 650],
  [44, 900, 650],
  [45, 1700, 1300],
  [46, 900, 650],
  [47, 1050, 800],
  [48, 1050, 800],
  [49, 1700, 1300],
  [50, 1700, 1300],
  [51, 1050, 800],
  [52, 1700, 1300],
  [53, 1700, 1300],
  [54, 1700, 1300],
  [55, 1500, 1200],
  [56, 1700, 1300],
  [57, 1500, 1200],
  [58, 1500, 1200],
];

const EXTRA_LOCALITIES: ReadonlyArray<readonly [id: number, parentId: number]> = [
  [59, 3],
  [60, 5],
  [61, 7],
  [62, 12],
  [63, 13],
  [64, 14],
  [65, 17],
  [66, 47],
  [67, 26],
  [68, 28],
  [69, 32],
];

const BASE_BY_ID = new Map<number, DeliveryTariff>(
  BASE_TARIFFS.map(([id, home, desk]) => [id, { id, wilayaId: id, home, desk }])
);

export const DELIVERY_TARIFFS: DeliveryTariff[] = [
  ...BASE_TARIFFS.map(([id, home, desk]) => ({ id, wilayaId: id, home, desk })),
  ...EXTRA_LOCALITIES.map(([id, parentId]) => {
    const parent = BASE_BY_ID.get(parentId);
    return {
      id,
      wilayaId: parentId,
      home: parent ? parent.home : 900,
      desk: parent ? parent.desk : 650,
    };
  }),
];

const TARIFF_BY_ID = new Map<number, DeliveryTariff>(
  DELIVERY_TARIFFS.map((tariff) => [tariff.id, tariff])
);

const REMOTE_BASE_IDS = new Set<number>([
  1, 8, 11, 32, 33, 37, 39, 45, 47, 49, 50, 52, 53, 54, 55, 56, 57, 58,
]);

export const DEFAULT_REMOTE_LOCALITY_IDS: number[] = [
  ...DELIVERY_TARIFFS
    .filter((tariff) => REMOTE_BASE_IDS.has(tariff.wilayaId))
    .map((tariff) => tariff.id),
];

export const DEFAULT_DELIVERY_RULES: DeliveryRules = {
  includedWeightKg: 5,
  extraKgFee: 50,
  extraKgFeeRemote: 100,
  volumetricDivisor: 5000,
  maxWeightKg: 30,
  oversizeFee: 500,
  largeSideThresholdCm: 100,
  girthThresholdCm: 300,
  remoteLocalityIds: [...DEFAULT_REMOTE_LOCALITY_IDS],
};

export function getDeliveryTariff(localityId: number): DeliveryTariff {
  return TARIFF_BY_ID.get(localityId) ?? {
    id: localityId,
    wilayaId: localityId,
    home: 900,
    desk: 650,
  };
}

export function buildDefaultFeeMap(field: 'home' | 'desk'): Record<string, number> {
  return Object.fromEntries(DELIVERY_TARIFFS.map((tariff) => [String(tariff.id), tariff[field]]));
}

export function parseWeightKg(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, value) : 0;
  if (value === null || value === undefined) return 0;
  const text = String(value).toLowerCase().replace(/,/g, '.').replace(/\u00a0/g, ' ');
  const kg = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|kilos|كغ|كج|كيلوغرام|كيلو)/);
  if (kg) return Math.max(0, Number(kg[1]));
  const grams = text.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|grs|gram|grams|غ|غرام)/);
  if (grams) return Math.max(0, Number(grams[1]) / 1000);
  const plain = text.match(/(\d+(?:\.\d+)?)/);
  return plain ? Math.max(0, Number(plain[1])) : 0;
}

export function parseDimensionsCm(value: string | null | undefined): [number, number, number] | null {
  if (!value) return null;
  const matches = String(value).toLowerCase().replace(/,/g, '.').match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 3) return null;
  let dims = matches.slice(0, 3).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (dims.length < 3) return null;
  if (Math.max(...dims) > 500) dims = dims.map((n) => n / 10);
  if (dims.some((n) => n <= 0)) return null;
  return [dims[0], dims[1], dims[2]];
}

export function calculateDeliveryQuote(input: DeliveryQuoteInput): DeliveryQuote {
  const rules: DeliveryRules = { ...DEFAULT_DELIVERY_RULES, ...(input.rules || {}) };
  const tariff = getDeliveryTariff(input.localityId);
  const remote = rules.remoteLocalityIds.includes(tariff.id)
    || rules.remoteLocalityIds.includes(tariff.wilayaId);

  let actualKg = 0;
  let volumetricKg = 0;
  let oversizeCount = 0;

  for (const item of input.items || []) {
    const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (quantity === 0) continue;

    const weight = parseWeightKg(item.weight);
    const dims = parseDimensionsCm(item.dimensions);

    let volume = 0;
    if (dims) {
      const divisor = rules.volumetricDivisor > 0 ? rules.volumetricDivisor : 5000;
      volume = (dims[0] * dims[1] * dims[2]) / divisor;
      const longest = Math.max(...dims);
      const girth = longest + 2 * (dims[0] + dims[1] + dims[2] - longest);
      if (longest > rules.largeSideThresholdCm || girth > rules.girthThresholdCm) {
        oversizeCount += quantity;
      }
    }

    actualKg += weight * quantity;
    volumetricKg += volume * quantity;
  }

  const billedWeightKg = Math.round(Math.max(actualKg, volumetricKg) * 100) / 100;
  const maxWeight = rules.maxWeightKg > 0 ? rules.maxWeightKg : 30;
  const parcels = billedWeightKg > 0 ? Math.max(1, Math.ceil(billedWeightKg / maxWeight - 1e-9)) : 1;
  const includedWeight = Math.max(0, rules.includedWeightKg) * parcels;
  const excessWeightKg = Math.max(0, Math.round((billedWeightKg - includedWeight) * 100) / 100);
  const perKg = remote ? rules.extraKgFeeRemote : rules.extraKgFee;
  const weightFee = Math.max(0, Math.round(excessWeightKg * perKg));
  const storedHome = Number(input.homeFees?.[String(tariff.id)]);
  const storedDesk = Number(input.deskFees?.[String(tariff.id)]);
  const homeFee = Number.isFinite(storedHome) && storedHome >= 0 ? storedHome : tariff.home;
  const deskFee = Number.isFinite(storedDesk) && storedDesk >= 0 ? storedDesk : tariff.desk;
  const baseFee = (input.method === 'desk' ? deskFee : homeFee) * parcels;
  const oversizeSurcharge = Math.max(0, Math.round(oversizeCount * rules.oversizeFee));
  const shippingFee = baseFee + weightFee;

  const threshold = Number(input.freeThreshold ?? 0);
  const freeShipping = Number.isFinite(threshold) && threshold > 0 && input.subtotal >= threshold;
  // Free delivery waives the base tariff; weight/oversize supplements apply.
  const deliveryFee = freeShipping
    ? weightFee + oversizeSurcharge
    : baseFee + weightFee + oversizeSurcharge;

  return {
    localityId: tariff.id,
    wilayaId: tariff.wilayaId,
    method: input.method,
    remote,
    baseFee,
    parcels,
    billedWeightKg,
    excessWeightKg,
    weightFee,
    oversizeCount,
    oversizeSurcharge,
    shippingFee,
    freeShipping,
    freeThreshold: Number.isFinite(threshold) ? threshold : 0,
    deliveryFee,
  };
}

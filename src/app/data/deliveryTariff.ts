/**
 * Delivery pricing shared by the storefront and the checkout funnel.
 *
 * Base tariffs come from the official Yalidine Express "Tarifs et délais de
 * livraison" table (June 2025, Algeria). Prices are in DZD and cover a parcel
 * of up to 5 kg. Every locality used by the store is listed: the 58 wilayas
 * plus the 11 additional delivery points (Aflou, Barika, ...), which inherit
 * the tariff of their parent wilaya.
 *
 * The same rules are mirrored in `server/src/data/deliveryTariff.ts`. Keep
 * both files in sync when changing the tariff table.
 */

export type DeliveryMethod = 'home' | 'desk';

export interface DeliveryTariff {
  /** Locality id used by the store (1..69). */
  id: number;
  /** Parent wilaya id (1..58). */
  wilayaId: number;
  /** Home delivery base fee in DZD (up to 5 kg). */
  home: number;
  /** Stop-desk base fee in DZD (up to 5 kg). */
  desk: number;
}

export interface DeliveryRules {
  /** Weight included in the base fee, per parcel. */
  includedWeightKg: number;
  /** DZD per extra kg for standard destinations. */
  extraKgFee: number;
  /** DZD per extra kg for remote/southern destinations. */
  extraKgFeeRemote: number;
  /** Volumetric divisor: L x W x H (cm) / divisor = kg. */
  volumetricDivisor: number;
  /** Maximum billable weight per parcel; heavier orders are split. */
  maxWeightKg: number;
  /** Flat surcharge per oversized unit. */
  oversizeFee: number;
  /** An item is oversized when one side exceeds this length (cm). */
  largeSideThresholdCm: number;
  /** ...or when longest side + 2 x (other sides) exceeds this (cm). */
  girthThresholdCm: number;
  /** Locality ids that use the remote per-kg rate. */
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
  /** Admin overrides keyed by locality id. */
  homeFees?: Record<string, number>;
  deskFees?: Record<string, number>;
  rules?: Partial<DeliveryRules>;
}

export interface DeliveryQuote {
  localityId: number;
  wilayaId: number;
  method: DeliveryMethod;
  remote: boolean;
  /** Base fee for all parcels, before weight/oversize extras. */
  baseFee: number;
  parcels: number;
  billedWeightKg: number;
  excessWeightKg: number;
  weightFee: number;
  oversizeCount: number;
  oversizeSurcharge: number;
  /** Base + weight surcharge, before the free-shipping threshold. */
  shippingFee: number;
  freeShipping: boolean;
  freeThreshold: number;
  /** Final amount charged to the customer (oversize always applies). */
  deliveryFee: number;
}

type RawTariff = readonly [id: number, home: number, desk: number];

/**
 * Official Yalidine Express table, June 2025 (home / stop-desk, DZD).
 * Rows follow wilaya ids 1..58.
 */
const BASE_TARIFFS: readonly RawTariff[] = [
  [1, 1500, 1200],  // Adrar
  [2, 900, 650],    // Chlef
  [3, 1050, 800],   // Laghouat
  [4, 900, 650],    // Oum El Bouaghi
  [5, 900, 650],    // Batna
  [6, 900, 650],    // Béjaïa
  [7, 1050, 800],   // Biskra
  [8, 1500, 1200],  // Béchar
  [9, 700, 500],    // Blida
  [10, 900, 650],   // Bouira
  [11, 1700, 1300], // Tamanrasset
  [12, 1050, 800],  // Tébessa
  [13, 900, 650],   // Tlemcen
  [14, 900, 650],   // Tiaret
  [15, 900, 650],   // Tizi Ouzou
  [16, 600, 500],   // Alger
  [17, 1050, 800],  // Djelfa
  [18, 900, 650],   // Jijel
  [19, 900, 650],   // Sétif
  [20, 900, 650],   // Saïda
  [21, 900, 650],   // Skikda
  [22, 900, 650],   // Sidi Bel Abbès
  [23, 900, 650],   // Annaba
  [24, 900, 650],   // Guelma
  [25, 900, 650],   // Constantine
  [26, 900, 650],   // Médéa
  [27, 900, 650],   // Mostaganem
  [28, 900, 650],   // M'Sila
  [29, 900, 650],   // Mascara
  [30, 1050, 800],  // Ouargla
  [31, 900, 650],   // Oran
  [32, 1700, 1300], // El Bayadh
  [33, 1700, 1300], // Illizi
  [34, 900, 650],   // Bordj Bou Arreridj
  [35, 700, 500],   // Boumerdès
  [36, 900, 650],   // El Tarf
  [37, 1700, 1300], // Tindouf
  [38, 900, 650],   // Tissemsilt
  [39, 1050, 800],  // El Oued
  [40, 900, 650],   // Khenchela
  [41, 900, 650],   // Souk Ahras
  [42, 700, 500],   // Tipaza
  [43, 900, 650],   // Mila
  [44, 900, 650],   // Aïn Defla
  [45, 1700, 1300], // Naâma
  [46, 900, 650],   // Aïn Témouchent
  [47, 1050, 800],  // Ghardaïa
  [48, 1050, 800],  // Relizane
  [49, 1700, 1300], // Timimoun
  [50, 1700, 1300], // Bordj Badji Mokhtar
  [51, 1050, 800],  // Ouled Djellal
  [52, 1700, 1300], // Béni Abbès
  [53, 1700, 1300], // In Salah
  [54, 1700, 1300], // In Guezzam
  [55, 1500, 1200], // Touggourt
  [56, 1700, 1300], // Djanet
  [57, 1500, 1200], // El M'Ghair
  [58, 1500, 1200], // El Meniaa
];

/** Additional delivery points and their parent wilaya. */
const EXTRA_LOCALITIES: ReadonlyArray<readonly [id: number, parentId: number]> = [
  [59, 3],  // Aflou -> Laghouat
  [60, 5],  // Barika -> Batna
  [61, 7],  // El Kantara -> Biskra
  [62, 12], // Bir El Ater -> Tébessa
  [63, 13], // El Aricha -> Tlemcen
  [64, 14], // Ksar El Chellala -> Tiaret
  [65, 17], // Ain Ouessara -> Djelfa
  [66, 47], // Metlili -> Ghardaïa
  [67, 26], // Ksar El Boukhari -> Médéa
  [68, 28], // Bou Saada -> M'Sila
  [69, 32], // El Abiodh Sidi Cheikh -> El Bayadh
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

/** Southern/far-south wilayas billed at the higher per-kg rate. */
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

/** Parse strings such as "1.2 kg", "800 g", "كغ 2" or plain "3". */
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

/** Parse "40 x 30 x 20 cm", "40*30*20", "40cm×30cm×20cm", ... into cm. */
export function parseDimensionsCm(value: string | null | undefined): [number, number, number] | null {
  if (!value) return null;
  const matches = String(value).toLowerCase().replace(/,/g, '.').match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 3) return null;
  let dims = matches.slice(0, 3).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (dims.length < 3) return null;
  // A single value above 500 cm is almost certainly millimetres.
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
  // Free delivery waives the base tariff. Weight and oversize supplements
  // always apply because they represent real courier costs.
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

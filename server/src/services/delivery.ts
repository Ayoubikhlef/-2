import { prisma } from '../utils/prisma';
import {
  buildDefaultFeeMap,
  calculateDeliveryQuote,
  DEFAULT_DELIVERY_RULES,
  type DeliveryMethod,
  type DeliveryQuote,
  type DeliveryRules,
  type PricedItemInput,
} from '../data/deliveryTariff';

export interface DeliverySettings {
  freeThreshold: number;
  homeFees: Record<string, number>;
  deskFees: Record<string, number>;
  rules: DeliveryRules;
}

const MAX_FEE = 1_000_000;

function toNumber(value: unknown, fallback: number, min = 0, max = MAX_FEE): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function mergeFees(stored: unknown, defaults: Record<string, number>): Record<string, number> {
  const merged = { ...defaults };
  if (!stored || typeof stored !== 'object') return merged;
  for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
    const id = Number(key);
    const fee = Number(value);
    if (Number.isInteger(id) && id >= 1 && id <= 69 && Number.isFinite(fee)) {
      merged[String(id)] = Math.round(Math.min(MAX_FEE, Math.max(0, fee)));
    }
  }
  return merged;
}

function mergeRules(stored: unknown): DeliveryRules {
  const source = (stored && typeof stored === 'object' ? stored : {}) as Partial<DeliveryRules>;
  const remoteIds = Array.isArray(source.remoteLocalityIds)
    ? source.remoteLocalityIds
        .map(Number)
        .filter((id) => Number.isInteger(id) && id >= 1 && id <= 69)
    : DEFAULT_DELIVERY_RULES.remoteLocalityIds;

  return {
    includedWeightKg: toNumber(source.includedWeightKg, DEFAULT_DELIVERY_RULES.includedWeightKg, 0, 100),
    extraKgFee: toNumber(source.extraKgFee, DEFAULT_DELIVERY_RULES.extraKgFee, 0, 100_000),
    extraKgFeeRemote: toNumber(source.extraKgFeeRemote, DEFAULT_DELIVERY_RULES.extraKgFeeRemote, 0, 100_000),
    volumetricDivisor: toNumber(source.volumetricDivisor, DEFAULT_DELIVERY_RULES.volumetricDivisor, 1, 100_000),
    maxWeightKg: toNumber(source.maxWeightKg, DEFAULT_DELIVERY_RULES.maxWeightKg, 1, 1000),
    oversizeFee: toNumber(source.oversizeFee, DEFAULT_DELIVERY_RULES.oversizeFee, 0, 100_000),
    largeSideThresholdCm: toNumber(source.largeSideThresholdCm, DEFAULT_DELIVERY_RULES.largeSideThresholdCm, 1, 1000),
    girthThresholdCm: toNumber(source.girthThresholdCm, DEFAULT_DELIVERY_RULES.girthThresholdCm, 1, 5000),
    remoteLocalityIds: [...new Set(remoteIds)],
  };
}

export function defaultDeliverySettings(): DeliverySettings {
  return {
    freeThreshold: 5000,
    homeFees: buildDefaultFeeMap('home'),
    deskFees: buildDefaultFeeMap('desk'),
    rules: {
      ...DEFAULT_DELIVERY_RULES,
      remoteLocalityIds: [...DEFAULT_DELIVERY_RULES.remoteLocalityIds],
    },
  };
}

/**
 * Reads the delivery configuration saved by the admin UI. Falls back to the
 * official Yalidine tariff whenever the setting is missing or malformed.
 */
export async function loadDeliverySettings(): Promise<DeliverySettings> {
  const defaults = defaultDeliverySettings();
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'aos_site_settings' } });
    if (!setting) return defaults;

    const parsed = JSON.parse(setting.value) as { delivery?: Record<string, unknown> };
    const delivery = parsed?.delivery;
    if (!delivery || typeof delivery !== 'object') return defaults;

    return {
      freeThreshold: Math.round(toNumber(delivery.freeThreshold, defaults.freeThreshold, 0, 10_000_000)),
      homeFees: mergeFees(delivery.homeFees, defaults.homeFees),
      deskFees: mergeFees(delivery.deskFees, defaults.deskFees),
      rules: mergeRules(delivery.rules),
    };
  } catch (err) {
    console.warn('[Delivery] Failed to read settings, using defaults:', err);
    return defaults;
  }
}

export interface OrderDeliveryInput {
  localityId: number;
  method: DeliveryMethod;
  subtotal: number;
  items: PricedItemInput[];
}

export async function quoteOrderDelivery(input: OrderDeliveryInput): Promise<DeliveryQuote> {
  const settings = await loadDeliverySettings();
  return calculateDeliveryQuote({
    ...input,
    freeThreshold: settings.freeThreshold,
    homeFees: settings.homeFees,
    deskFees: settings.deskFees,
    rules: settings.rules,
  });
}

/** Legacy orders only store a label like "18 جيجل"; recover the id. */
export function parseLocalityIdFromLabel(value: string | undefined | null): number | null {
  if (!value) return null;
  const match = String(value).match(/^\s*(\d{1,2})/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id >= 1 && id <= 69 ? id : null;
}

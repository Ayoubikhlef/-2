import {
  calculateDeliveryQuote,
  type DeliveryMethod,
  type DeliveryQuote,
  type DeliveryQuoteInput,
} from '../data/deliveryTariff';
import {
  getDeliveryConfig,
  getDeliveryFee as storageGetDeliveryFee,
  isFreeDelivery as storageIsFreeDelivery,
} from '../utils/siteSettingsStorage';

export {
  DELIVERY_TARIFFS,
  DEFAULT_DELIVERY_RULES,
  calculateDeliveryQuote,
  getDeliveryTariff,
  parseDimensionsCm,
  parseWeightKg,
} from '../data/deliveryTariff';
export type {
  DeliveryMethod,
  DeliveryQuote,
  DeliveryTariff,
  PricedItemInput,
} from '../data/deliveryTariff';
export { FREE_DELIVERY_THRESHOLD } from '../utils/siteSettingsStorage';

export type DeliveryQuoteRequest = Omit<DeliveryQuoteInput, 'freeThreshold' | 'rules'>;

export function getDeliveryFee(localityId: number, method: DeliveryMethod = 'home'): number {
  return storageGetDeliveryFee(localityId, method);
}

export function isFreeDelivery(subtotal: number): boolean {
  return storageIsFreeDelivery(subtotal);
}

/**
 * Quote using the store's saved delivery settings (admin editable).
 * This is the only entry point the UI needs.
 */
export function getDeliveryQuote(request: DeliveryQuoteRequest): DeliveryQuote {
  const config = getDeliveryConfig();
  return calculateDeliveryQuote({
    ...request,
    freeThreshold: config.freeThreshold,
    homeFees: config.homeFees,
    deskFees: config.deskFees,
    rules: config.rules,
  });
}

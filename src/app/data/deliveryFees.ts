import { getDeliveryFee as storageGetDeliveryFee, isFreeDelivery as storageIsFreeDelivery } from '../utils/siteSettingsStorage';

export { FREE_DELIVERY_THRESHOLD } from '../utils/siteSettingsStorage';

export function getDeliveryFee(wilayaId: number): number {
  return storageGetDeliveryFee(wilayaId);
}

export function isFreeDelivery(subtotal: number): boolean {
  return storageIsFreeDelivery(subtotal);
}

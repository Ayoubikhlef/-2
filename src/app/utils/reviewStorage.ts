import { api } from './api';
import { getStoredProducts } from './productStorage';

export type Review = {
  id: string;
  productId: number;
  name: string;
  rating: number;
  comment: string;
  /** ISO date. Kept as `date` so the existing UI components stay unchanged. */
  date: string;
  approved?: boolean;
};

function normalizeReview(raw: any): Review {
  return {
    id: String(raw?.id || ''),
    productId: Number(raw?.productId) || 0,
    name: String(raw?.name || ''),
    rating: Number(raw?.rating) || 0,
    comment: String(raw?.comment || ''),
    date: String(raw?.createdAt || raw?.date || new Date().toISOString()),
    approved: typeof raw?.approved === 'boolean' ? raw.approved : undefined,
  };
}

/** Public, approved reviews for one catalog product. */
export async function fetchReviews(productId: number): Promise<Review[]> {
  const rows = await api.reviews.list(productId);
  return Array.isArray(rows) ? rows.map(normalizeReview) : [];
}

/**
 * Guest review submission. The server stores it as pending; it only becomes
 * public (and eligible for Product structured data) after admin approval.
 */
export async function submitReview(
  productId: number,
  name: string,
  rating: number,
  comment: string,
  website = '',
): Promise<{ pending: boolean }> {
  const result = await api.reviews.create({ productId, name, rating, comment, website });
  return { pending: result?.pending !== false };
}

export async function fetchAllReviewsAdmin(): Promise<Review[]> {
  const rows = await api.reviews.adminList();
  return Array.isArray(rows) ? rows.map(normalizeReview) : [];
}

export async function setReviewApproved(id: string, approved: boolean): Promise<void> {
  await api.reviews.setApproved(id, approved);
}

export async function deleteReview(id: string): Promise<void> {
  await api.reviews.remove(id);
}

export function getReviewProductMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const product of getStoredProducts([])) {
    map[String(product.id)] = product.nameAr || product.nameEn || product.nameFr || `Product ${product.id}`;
  }
  return map;
}

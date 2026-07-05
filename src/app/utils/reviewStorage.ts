const STORAGE_KEY = 'aos_reviews';

export type Review = {
  id: string;
  productId: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
};

function getAllReviews(): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAllReviews(reviews: Review[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function getReviews(productId: number): Review[] {
  return getAllReviews().filter(r => r.productId === productId);
}

export function addReview(productId: number, name: string, rating: number, comment: string): Review {
  const review: Review = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    productId,
    name,
    rating,
    comment,
    date: new Date().toISOString(),
  };
  const reviews = getAllReviews();
  reviews.push(review);
  saveAllReviews(reviews);
  return review;
}

export function getAverageRating(productId: number): number {
  const reviews = getReviews(productId);
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function getRatingDistribution(productId: number): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of getReviews(productId)) {
    dist[r.rating] = (dist[r.rating] || 0) + 1;
  }
  return dist;
}

export function getAllReviewsAdmin(): Review[] {
  return getAllReviews();
}

export function deleteReview(id: string): void {
  const reviews = getAllReviews().filter(r => r.id !== id);
  saveAllReviews(reviews);
}

export function getReviewProductMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem('aos_products');
    if (!raw) return {};
    const products = JSON.parse(raw);
    const map: Record<string, string> = {};
    if (Array.isArray(products)) {
      for (const p of products) {
        map[p.id] = p.nameAr || p.nameEn || p.nameFr || `Product ${p.id}`;
      }
    }
    return map;
  } catch { return {}; }
}

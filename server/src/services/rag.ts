export interface ProductRecord {
  id: number;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  descAr: string;
  descFr: string;
  descEn: string;
  price: number;
  image: string;
  brand?: string;
  category: string;
  hidden?: boolean;
}

interface VectorRecord {
  id: number;
  text: string;
  embedding: number[];
  product: ProductRecord;
}

let extractor: any = null;
let vectors: VectorRecord[] = [];
let ready = false;

export function isReady() { return ready; }

export async function initRAG() {
  try {
    const { pipeline } = await import('@xenova/transformers');
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    ready = true;
    console.log('[RAG] Model loaded');
  } catch (err) {
    console.error('[RAG] Failed to load model:', err);
  }
}

function productToText(p: ProductRecord): string {
  return `${p.nameAr} ${p.nameFr} ${p.nameEn} ${p.descAr} ${p.descFr} ${p.descEn} ${p.brand || ''} ${p.category}`;
}

export async function syncProducts(products: ProductRecord[]) {
  if (!ready) {
    console.warn('[RAG] Not ready, skipping sync');
    return;
  }
  const existing = new Set(vectors.map(v => v.id));
  const toAdd = products.filter(p => !p.hidden && !existing.has(p.id));
  for (const p of toAdd) {
    const text = productToText(p);
    const result = await extractor(text, { pooling: 'mean', normalize: true });
    vectors.push({ id: p.id, text, embedding: Array.from(result.data) as number[], product: p });
  }
  vectors = vectors.filter(v => !products.some(p => p.id === v.id && p.hidden));
  console.log(`[RAG] ${vectors.length} products indexed`);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function semanticSearch(query: string, topK: number = 5) {
  if (!ready || vectors.length === 0) return [];
  const result = await extractor(query, { pooling: 'mean', normalize: true });
  const queryEmb = Array.from(result.data) as number[];
  const scored = vectors
    .map(v => ({ product: v.product, score: cosineSimilarity(queryEmb, v.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return scored;
}

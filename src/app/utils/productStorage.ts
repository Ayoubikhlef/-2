import { type Product } from '../data/products';
import { syncToServer } from './serverSync';
import { api } from './api';

const STORAGE_KEY_LOCAL = 'aos_products';
const INIT_KEY = 'aos_products_initialized';
const SERVER_KEY = 'aos_products';

function dispatchChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

export function getStoredProducts(defaults: Product[]): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return defaults;
}

export function initializeProducts(defaults: Product[]): void {
  if (!localStorage.getItem(INIT_KEY)) {
    localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(defaults));
    localStorage.setItem(INIT_KEY, 'true');
  }
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(products));
  dispatchChange();
  syncToServer(SERVER_KEY, products);
}

export function addProduct(product: Omit<Product, 'id'>): Product {
  const products = getStoredProducts([]);
  const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
  const newProduct: Product = { ...product, id: maxId + 1 };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: number, updates: Partial<Product>): boolean {
  const products = getStoredProducts([]);
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products[idx] = { ...products[idx], ...updates };
  saveProducts(products);
  return true;
}

export function deleteProduct(id: number): boolean {
  const products = getStoredProducts([]);
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  saveProducts(filtered);
  return true;
}

export function copyProduct(id: number): Product | null {
  const products = getStoredProducts([]);
  const source = products.find((p) => p.id === id);
  if (!source) return null;
  const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
  const { id: _, ...rest } = source;
  const newProduct: Product = { ...rest, id: maxId + 1 };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function toggleProductVisibility(id: number): boolean {
  const products = getStoredProducts([]);
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products[idx] = { ...products[idx], hidden: !products[idx].hidden };
  saveProducts(products);
  return true;
}

export function getProductBySku(sku: string): Product | undefined {
  const products = getStoredProducts([]);
  return products.find((p) => p.sku === sku);
}

export function getProductsOnSale(products: Product[]): Product[] {
  const now = Date.now();
  return products.filter(
    (p) => p.salePrice != null && p.saleEnd != null && new Date(p.saleEnd).getTime() > now
  );
}

export async function loadProductsFromServer(defaults: Product[]): Promise<Product[]> {
  try {
    const result = await api.fetchProducts();
    if (result.products && result.products.length > 0) {
      localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(result.products));
      localStorage.setItem(INIT_KEY, 'true');
      return result.products as Product[];
    }
  } catch {
    // server unavailable, use local
  }
  return getStoredProducts(defaults);
}

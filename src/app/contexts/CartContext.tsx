import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { getDeliveryQuote, type DeliveryMethod, type DeliveryQuote } from '../data/deliveryFees';
import { getStoredProducts } from '../utils/productStorage';

export interface CartItem {
  productId: number;
  quantity: number;
  price: number;
  name: string;
  stock?: number;
  weight?: string;
  dimensions?: string;
}

const MAX_QUANTITY = 10000;

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  total: number;
  deliveryWilaya: number;
  setDeliveryWilaya: (id: number) => void;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  deliveryQuote: DeliveryQuote;
  deliveryFee: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_KEY = 'aos_cart';
const DELIVERY_WILAYA_KEY = 'aos_delivery_wilaya';
const DELIVERY_METHOD_KEY = 'aos_delivery_method';

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch { /* quota exceeded */ }
}

function loadDeliveryWilaya(): number {
  try {
    const id = Number(localStorage.getItem(DELIVERY_WILAYA_KEY));
    return Number.isInteger(id) && id >= 1 && id <= 69 ? id : 18;
  } catch {
    return 18;
  }
}

function loadDeliveryMethod(): DeliveryMethod {
  try {
    return localStorage.getItem(DELIVERY_METHOD_KEY) === 'desk' ? 'desk' : 'home';
  } catch {
    return 'home';
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [deliveryWilaya, setDeliveryWilaya] = useState(loadDeliveryWilaya);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(loadDeliveryMethod);

  useEffect(() => { saveCart(items); }, [items]);
  useEffect(() => {
    try { localStorage.setItem(DELIVERY_WILAYA_KEY, String(deliveryWilaya)); } catch { /* ignore */ }
  }, [deliveryWilaya]);
  useEffect(() => {
    try { localStorage.setItem(DELIVERY_METHOD_KEY, deliveryMethod); } catch { /* ignore */ }
  }, [deliveryMethod]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === newItem.productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === newItem.productId
            ? {
                ...item,
                ...newItem,
                quantity: Math.min(item.quantity + newItem.quantity, newItem.stock ?? MAX_QUANTITY),
              }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: Math.min(newItem.quantity, newItem.stock ?? MAX_QUANTITY) }];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(Math.floor(quantity), item.stock ?? MAX_QUANTITY) }
          : item
      )
    );
  };

  const clear = () => setItems([]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  // Carts saved before weight/dimensions existed fall back to the live catalog.
  const pricedItems = useMemo(() => {
    const needsLookup = items.some(
      (item) => item.weight === undefined || item.dimensions === undefined
    );
    if (!needsLookup) return items;
    const catalog = getStoredProducts([]);
    return items.map((item) => {
      if (item.weight !== undefined || item.dimensions !== undefined) return item;
      const product = catalog.find((p) => p.id === item.productId);
      return product
        ? { ...item, weight: product.weight, dimensions: product.dimensions }
        : item;
    });
  }, [items]);

  const deliveryQuote = useMemo(
    () => getDeliveryQuote({
      localityId: deliveryWilaya,
      method: deliveryMethod,
      subtotal: total,
      items: pricedItems.map((item) => ({
        quantity: item.quantity,
        weight: item.weight,
        dimensions: item.dimensions,
      })),
    }),
    [deliveryWilaya, deliveryMethod, total, pricedItems]
  );

  const deliveryFee = items.length > 0 ? deliveryQuote.deliveryFee : 0;
  const grandTotal = total + deliveryFee;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      total,
      deliveryWilaya,
      setDeliveryWilaya,
      deliveryMethod,
      setDeliveryMethod,
      deliveryQuote,
      deliveryFee,
      grandTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

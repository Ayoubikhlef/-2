import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getDeliveryFee, isFreeDelivery, FREE_DELIVERY_THRESHOLD } from '../data/deliveryFees';

export interface CartItem {
  productId: number;
  quantity: number;
  price: number;
  name: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  total: number;
  deliveryWilaya: number;
  setDeliveryWilaya: (id: number) => void;
  deliveryFee: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_KEY = 'aos_cart';

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [deliveryWilaya, setDeliveryWilaya] = useState(18);

  useEffect(() => { saveCart(items); }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === newItem.productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clear = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = isFreeDelivery(total) ? 0 : getDeliveryFee(deliveryWilaya);
  const grandTotal = total + deliveryFee;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, total, deliveryWilaya, setDeliveryWilaya, deliveryFee, grandTotal }}>
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

// context/CartContext.tsx
'use client';

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

export interface CartLine {
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  maxStock: number;
}

interface CartContextValue {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  updateQuantity: (productId: string, variantName: string, quantity: number) => void;
  removeLine: (productId: string, variantName: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addLine: CartContextValue['addLine'] = (line, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === line.productId && l.variantName === line.variantName);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, existing.maxStock);
        return prev.map((l) =>
          l.productId === line.productId && l.variantName === line.variantName ? { ...l, quantity: newQty } : l
        );
      }
      return [...prev, { ...line, quantity: Math.min(quantity, line.maxStock) }];
    });
  };

  const updateQuantity: CartContextValue['updateQuantity'] = (productId, variantName, quantity) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.productId === productId && l.variantName === variantName
            ? { ...l, quantity: Math.max(0, Math.min(quantity, l.maxStock)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine: CartContextValue['removeLine'] = (productId, variantName) => {
    setLines((prev) => prev.filter((l) => !(l.productId === productId && l.variantName === variantName)));
  };

  const clearCart = () => setLines([]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines]);
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, addLine, updateQuantity, removeLine, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

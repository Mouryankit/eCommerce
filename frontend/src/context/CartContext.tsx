import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CartItem, Product } from '../types';
import { useToast } from './ToastContext';

interface CartContextValue {
  cart: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  freeShippingThreshold: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aura_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(cart));
  }, [cart]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (product.quantity > 0 && nextQty > product.quantity) {
          showToast(`Only ${product.quantity} units available in stock`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      } else {
        if (product.quantity <= 0) {
          showToast(`This item is currently out of stock`, 'warning');
          return prev;
        }
        return [...prev, { product, quantity: Math.min(quantity, product.quantity || 99) }];
      }
    });

    showToast(`Added "${product.name}" to your bag`, 'success');
  }, [showToast]);

  const updateQuantity = useCallback((productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          if (item.product.quantity > 0 && newQty > item.product.quantity) {
            showToast(`Max stock reached (${item.product.quantity} items)`, 'warning');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  }, [showToast]);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => {
      const target = prev.find((i) => i.product.id === productId);
      if (target) {
        showToast(`Removed "${target.product.name}" from bag`, 'info');
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  }, [showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 150;

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        freeShippingThreshold,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

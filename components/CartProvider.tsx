"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export interface CartItem {
  productId: string;
  bundleId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  slug?: string;
  selectedColor?: string;
  selectedBundleItems?: { productId: string; name: string }[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedColor?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cartship_cart");
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        localStorage.removeItem("cartship_cart");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cartship_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && (i.selectedColor || "") === (item.selectedColor || "")
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId && (i.selectedColor || "") === (item.selectedColor || "")
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });

    const label = item.selectedColor ? `${item.name} (${item.selectedColor})` : item.name;
    toast.success(`${label} added to cart!`);
  };

  const removeItem = (productId: string, selectedColor?: string) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i.productId === productId &&
            (selectedColor !== undefined ? (i.selectedColor || "") === (selectedColor || "") : true)
          )
      )
    );
    toast.success("Item removed from cart");
  };

  const updateQuantity = (productId: string, quantity: number, selectedColor?: string) => {
    if (quantity < 1) {
      removeItem(productId, selectedColor);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId &&
        (selectedColor !== undefined ? (i.selectedColor || "") === (selectedColor || "") : true)
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cartship_cart");
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

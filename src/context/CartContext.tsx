"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useProducts } from "./ProductContext";

export type CartItem = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: number) => void;
  increaseQuantity: (id: number) => void;
  decreaseQuantity: (id: number) => void;
  setItemQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { getProductById, products } = useProducts();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Ошибка чтения корзины:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!products.length) return;

    setCartItems((prev) => {
      const normalized = prev
        .map((item) => {
          const product = getProductById(item.id);

          if (!product) return null;
          if (product.stock <= 0) return null;

          return {
            ...item,
            quantity: Math.min(item.quantity, product.stock),
            price: product.price,
            name: product.name,
            image: product.image,
            slug: product.slug,
          };
        })
        .filter(Boolean) as CartItem[];

      return normalized;
    });
  }, [products, getProductById]);

  const addToCart = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    const product = getProductById(item.id);
    if (!product || product.stock <= 0) return;

    setCartItems((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: Math.min(cartItem.quantity + quantity, product.stock),
              }
            : cartItem
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantity: Math.min(quantity, product.stock),
        },
      ];
    });
  };

  const removeFromCart = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const increaseQuantity = (id: number) => {
    const product = getProductById(id);
    if (!product) return;

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(item.quantity + 1, product.stock),
            }
          : item
      )
    );
  };

  const decreaseQuantity = (id: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const setItemQuantity = (id: number, quantity: number) => {
    const product = getProductById(id);
    if (!product) return;

    const safeQuantity = Math.max(1, Math.min(quantity, product.stock));

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: safeQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      setItemQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
    }),
    [cartItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
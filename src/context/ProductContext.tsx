"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  category: string;
  liquidBrand?: "Chaser" | "ElfLiq" | "Lucky";
  stock: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ProductContextType = {
  products: Product[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
  getProductBySlug: (slug: string) => Product | undefined;
  getProductById: (id: number) => Product | undefined;
  updateProductInState: (updatedProduct: Product) => void;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProducts = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Не удалось загрузить товары");
      }

      const data: Product[] = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Ошибка загрузки товаров:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const getProductBySlug = useCallback(
    (slug: string) => products.find((product) => product.slug === slug),
    [products]
  );

  const getProductById = useCallback(
    (id: number) => products.find((product) => product.id === id),
    [products]
  );

  const updateProductInState = useCallback((updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      products,
      loading,
      refreshProducts,
      getProductBySlug,
      getProductById,
      updateProductInState,
    }),
    [
      products,
      loading,
      refreshProducts,
      getProductBySlug,
      getProductById,
      updateProductInState,
    ]
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error("useProducts must be used within ProductProvider");
  }

  return context;
}
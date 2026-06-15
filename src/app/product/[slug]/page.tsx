"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug);

  const { products, loading } = useProducts();
  const { addToCart } = useCart();

  const product = useMemo(
    () => products.find((item) => item.slug === slug),
    [products, slug]
  );

  const [quantity, setQuantity] = useState(1);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-10">
        <p>Загрузка товара...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="mb-4 text-3xl font-bold">Товар не найден</h1>
        <button
          onClick={() => router.push("/catalog")}
          className="rounded-xl bg-black px-5 py-3 text-white"
        >
          Вернуться в каталог
        </button>
      </main>
    );
  }

  const maxQuantity = Math.max(product.stock, 1);

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error("Товара нет в наличии");
      return;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image,
      },
      quantity
    );

    toast.success("Товар добавлен в корзину");
  };

  return (
    <main className="container mx-auto px-4 py-10">
      
      {/* BREADCRUMBS */}
      <div className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          Главная
        </Link>
        <span className="mx-2">/</span>
        <Link href="/catalog" className="hover:underline">
          Каталог
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </div>

      <div className="grid gap-10 md:grid-cols-2 items-start">
        
        {/* IMAGE */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 w-fit">
            <img
              src={product.image}
              alt={product.name}
              className="h-[500px] w-[550px] object-contain"
            />
          </div>
        </div>

        {/* INFO */}
        <div>
          <h1 className="mb-4 text-4xl font-bold">{product.name}</h1>

          <p className="mb-6 text-gray-600">{product.description}</p>

          <p className="mb-2 text-3xl font-semibold">{product.price} грн</p>

          <p
            className={`mb-6 text-sm font-medium ${
              product.stock > 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {product.stock > 0
              ? `В наличии: ${product.stock} шт.`
              : "Нет в наличии"}
          </p>

          {/* QUANTITY */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="rounded-xl border border-gray-300 px-4 py-2"
              disabled={product.stock <= 0}
            >
              -
            </button>

            <span className="min-w-[40px] text-center text-lg font-medium">
              {quantity}
            </span>

            <button
              onClick={() =>
                setQuantity((prev) => Math.min(maxQuantity, prev + 1))
              }
              className="rounded-xl border border-gray-300 px-4 py-2"
              disabled={product.stock <= 0}
            >
              +
            </button>
          </div>

          {/* ADD TO CART */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {product.stock > 0 ? "Добавить в корзину" : "Нет в наличии"}
          </button>
        </div>
      </div>
    </main>
  );
}
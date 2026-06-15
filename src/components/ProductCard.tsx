"use client";

import Link from "next/link";
import { Product } from "@prisma/client";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error("Товар закончился");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    });

    toast.success("Добавлено в корзину");
  };

  return (
    <div className="border rounded-xl p-4 flex flex-col hover:shadow-md transition">
      <Link href={`/product/${product.slug}`} className="flex-1">
        <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <h3 className="font-medium text-sm mb-1 line-clamp-2">
          {product.name}
        </h3>

        <p className="text-lg font-semibold">{product.price} ₴</p>

        {product.stock <= 0 && (
          <p className="text-sm text-red-500 mt-1">Нет в наличии</p>
        )}
      </Link>

      <button
        onClick={handleAddToCart}
        disabled={product.stock <= 0}
        className="mt-3 bg-black text-white py-2 rounded-lg text-sm hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Добавить в корзину
      </button>
    </div>
  );
}
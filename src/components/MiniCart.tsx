"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function MiniCart() {
  const { cartItems, removeFromCart, getCartTotal } = useCart();
  const [open, setOpen] = useState(false);

  const total = Number(getCartTotal() ?? 0);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Кнопка корзины */}
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer text-lg"
      >
        🛒
      </button>

      {open && (
        <div
          className="
          absolute right-0 mt-3
          w-[300px]
          max-w-[90vw]
          rounded-2xl border border-gray-200
          bg-white p-5 shadow-xl z-50
        "
        >
          <h3 className="mb-4 text-lg font-semibold">Корзина</h3>

          {cartItems.length === 0 ? (
            <p className="text-sm text-gray-500">Корзина пуста</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    className="h-14 w-14 rounded-lg object-cover"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {item.name}
                    </p>

                    <p className="text-sm text-gray-600">
                      {item.quantity} × {item.price} грн
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {cartItems.length > 0 && (
            <>
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-sm text-gray-600">Итого:</span>
                <span className="font-semibold">
                  {total.toLocaleString("ru-RU")} грн
                </span>
              </div>

              <Link
                href="/cart"
                className="mt-4 block w-full rounded-xl bg-black py-2 text-center text-sm font-medium text-white hover:opacity-90"
              >
                Перейти в корзину
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
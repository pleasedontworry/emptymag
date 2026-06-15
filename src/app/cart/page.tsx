"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    getCartTotal,
  } = useCart();

  const { getProductById } = useProducts();
  const { status } = useSession();
  
  const [discount, setDiscount] = useState(0);

  // Получаем профиль пользователя, чтобы узнать его скидку
useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            // Теперь мы просто берем персональную скидку из базы!
            setDiscount(data.user.personalDiscount || 0);
          }
        })
        .catch((err) => console.error("Ошибка при получении профиля:", err));
    }
  }, [status]);

  const total = Number(getCartTotal() ?? 0);
  const discountAmount = Math.floor((total * discount) / 100);
  const finalTotal = total - discountAmount;

  if (cartItems.length === 0) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Корзина</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-zinc-600">Корзина пуста.</p>

          <Link
            href="/catalog"
            className="mt-4 inline-block rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90"
          >
            Перейти в каталог
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Корзина</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {cartItems.map((item) => {
            const product = getProductById(item.id);
            const price = Number(item.price ?? 0);
            const quantity = Number(item.quantity ?? 0);
            const subtotal = price * quantity;
            const stock = Number(product?.stock ?? 0);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name || "Товар"}
                    className="h-28 w-28 rounded-xl object-cover"
                  />

                  <div className="flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {item.name || "Без названия"}
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                          Цена: {price.toLocaleString("ru-RU")} грн
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          Остаток: {stock}
                        </p>

                        <p className="mt-1 text-sm font-medium text-black">
                          Сумма: {subtotal.toLocaleString("ru-RU")} грн
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="rounded-xl border border-zinc-300 px-4 py-2 transition hover:bg-zinc-100"
                      >
                        -
                      </button>

                      <span className="min-w-[40px] text-center text-base font-medium">
                        {quantity}
                      </span>

                      <button
                        onClick={() => increaseQuantity(item.id)}
                        disabled={stock > 0 ? quantity >= stock : true}
                        className="rounded-xl border border-zinc-300 px-4 py-2 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Итого</h2>

          <div className="mb-4 flex flex-col gap-2 border-b border-zinc-200 pb-4">
            <div className="flex items-center justify-between text-zinc-600">
              <span>Сумма товаров:</span>
              <span>{total.toLocaleString("ru-RU")} грн</span>
            </div>
            
            {status === "authenticated" && discount > 0 && (
              <div className="flex items-center justify-between text-green-600 font-medium mt-1">
                <span>Ваша скидка ({discount}%):</span>
                <span>- {discountAmount.toLocaleString("ru-RU")} грн</span>
              </div>
            )}
          </div>

          <div className="mb-6 flex items-center justify-between text-xl">
            <span>К оплате:</span>
            <span className="font-bold">{finalTotal.toLocaleString("ru-RU")} грн</span>
          </div>

          {status === "unauthenticated" && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-center">
              <Link href="/login" className="text-black font-bold hover:underline">Войдите</Link> или <Link href="/register" className="text-black font-bold hover:underline">зарегистрируйтесь</Link> для получения скидки!
            </div>
          )}

          <Link
            href="/checkout"
            className="block rounded-xl bg-black px-5 py-3 text-center text-white transition hover:opacity-90"
          >
            Перейти к оформлению
          </Link>
        </aside>
      </div>
    </main>
  );
}
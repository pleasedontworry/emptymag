"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";

type CheckoutForm = {
  customerName: string;
  phone: string;
  telegram: string;
  comment: string;
};

function formatPrice(value: number) {
  return value.toLocaleString("ru-RU");
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart, getCartCount, getCartTotal } = useCart();

  const [form, setForm] = useState<CheckoutForm>({
    customerName: "",
    phone: "",
    telegram: "",
    comment: "",
  });

  const [loading, setLoading] = useState(false);

  const totalItems = useMemo(() => getCartCount(), [cartItems]);
  const totalPrice = useMemo(() => getCartTotal(), [cartItems]);

  const handleChange = (field: keyof CheckoutForm, value: string) => {
    if (field === "phone") {
      value = value.replace(/\D/g, "");
    }

    if (field === "customerName") {
      value = value.replace(/[^a-zA-Zа-яА-ЯёЁіІїЇєЄ\s]/g, "");
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.customerName.trim()) {
      toast.error("Введите имя");
      return false;
    }

    if (!form.phone.trim()) {
      toast.error("Введите телефон");
      return false;
    }

    if (form.telegram && !form.telegram.startsWith("@")) {
      toast.error("Telegram должен начинаться с @");
      return false;
    }

    if (cartItems.length === 0) {
      toast.error("Корзина пуста");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          telegram: form.telegram.trim() || null,
          comment: form.comment.trim() || null,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Ошибка оформления заказа");
      }

      clearCart();
      toast.success("Заказ оформлен");

      router.push("/success");

    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Не удалось оформить заказ"
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="container mx-auto px-4 py-10">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h1 className="text-2xl font-bold">Оформление заказа</h1>

          <p className="mt-3 text-gray-500">Ваша корзина пуста</p>

          <Link
            href="/catalog"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-medium text-white hover:opacity-90"
          >
            Перейти в каталог
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Оформление заказа</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-4">

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Имя</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) =>
                  handleChange("customerName", e.target.value)
                }
                className="h-11 rounded-xl border border-gray-300 px-4 outline-none focus:border-black"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Телефон</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="h-11 rounded-xl border border-gray-300 px-4 outline-none focus:border-black"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Telegram</label>
              <input
                type="text"
                value={form.telegram}
                onChange={(e) => handleChange("telegram", e.target.value)}
                className="h-11 rounded-xl border border-gray-300 px-4 outline-none focus:border-black"
                placeholder="@username"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Комментарий
              </label>
              <textarea
                value={form.comment}
                onChange={(e) => handleChange("comment", e.target.value)}
                rows={4}
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 rounded-xl bg-black text-white font-medium hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Оформление..." : "Оформить заказ"}
            </button>

          </form>
        </section>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Ваш заказ</h2>

          <div className="mt-5 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-2xl border border-gray-200 p-3"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>

                  <p className="text-sm text-gray-500">
                    {formatPrice(item.price)} грн × {item.quantity}
                  </p>

                  <p className="text-sm font-semibold">
                    {formatPrice(item.price * item.quantity)} грн
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Товаров</span>
              <span>{totalItems}</span>
            </div>

            <div className="flex justify-between font-semibold">
              <span>Итого</span>
              <span>{formatPrice(totalPrice)} грн</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";

type CheckoutForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  telegram: string;
  comment: string;
  paymentMethod: "CASH" | "CARD";
};

function formatPrice(value: number) {
  return value.toLocaleString("ru-RU");
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart, getCartCount, getCartTotal } = useCart();
  const { status } = useSession();

  const [form, setForm] = useState<CheckoutForm>({
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    telegram: "",
    comment: "",
    paymentMethod: "CASH",
  });

  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);

  // Подтягиваем данные профиля
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setDiscount(data.user.personalDiscount || 0);
            setUserId(data.user.id);
            setForm((prev) => ({
              ...prev,
              firstName: data.user.firstName || "",
              lastName: data.user.lastName || "",
              middleName: data.user.middleName || "",
              phone: data.user.phone || "",
            }));
          }
        })
        .catch((err) => console.error("Ошибка при получении профиля:", err));
    }
  }, [status]);

  const totalItems = useMemo(() => getCartCount(), [cartItems]);
  const totalPrice = useMemo(() => getCartTotal(), [cartItems]);
  
  const discountAmount = Math.floor((totalPrice * discount) / 100);
  const finalTotal = totalPrice - discountAmount;

  const handleChange = (field: keyof CheckoutForm, value: string) => {
    if (field === "phone") {
      value = value.replace(/\D/g, "");
    }
    if (field === "firstName" || field === "lastName" || field === "middleName") {
      value = value.replace(/[^a-zA-Zа-яА-ЯёЁіІїЇєЄ\s]/g, "");
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.lastName.trim()) {
      toast.error("Введите фамилию");
      return false;
    }
    if (!form.firstName.trim()) {
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
          userId: userId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim() || null,
          phone: form.phone.trim(),
          telegram: form.telegram.trim() || null,
          comment: form.comment.trim() || null,
          paymentMethod: form.paymentMethod,
          discount: discount,
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
        {/* ЛЕВАЯ ЧАСТЬ: ФОРМА */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-6">
            
            {/* Личные данные */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">Личные данные</h2>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Фамилия <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className="h-11 rounded-xl border border-gray-300 px-4 outline-none focus:border-black"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Имя <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className="h-11 rounded-xl border border-gray-300 px-4 outline-none focus:border-black"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Отчество</label>
                <input
                  type="text"
                  value={form.middleName}
                  onChange={(e) => handleChange("middleName", e.target.value)}
                  className="h-11 rounded-xl border border-gray-300 px-4 outline-none focus:border-black"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Телефон <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="h-11 rounded-xl border border-gray-300 px-4 outline-none focus:border-black"
                  required
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
            </div>

            {/* Способ оплаты */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">Способ оплаты</h2>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl hover:bg-gray-50 transition">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="CASH" 
                    checked={form.paymentMethod === "CASH"}
                    onChange={() => handleChange("paymentMethod", "CASH")}
                    className="w-5 h-5 text-black focus:ring-black"
                  />
                  <span className="font-medium">Наличными при получении</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl hover:bg-gray-50 transition">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="CARD" 
                    checked={form.paymentMethod === "CARD"}
                    onChange={() => handleChange("paymentMethod", "CARD")}
                    className="w-5 h-5 text-black focus:ring-black"
                  />
                  <span className="font-medium">Перевод на карту (Реквизиты выдаст менеджер)</span>
                </label>
              </div>
            </div>

            {/* Комментарий */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Комментарий к заказу</label>
              <textarea
                value={form.comment}
                onChange={(e) => handleChange("comment", e.target.value)}
                rows={3}
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 h-12 rounded-xl bg-black text-white font-bold hover:opacity-90 disabled:opacity-60 text-lg transition"
            >
              {loading ? "Оформление..." : "Подтвердить заказ"}
            </button>

          </form>
        </section>

        {/* ПРАВАЯ ЧАСТЬ: ВАШ ЗАКАЗ (ТОВАРЫ И СУММА) */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Ваш заказ</h2>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-xl border border-gray-100 p-2"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {formatPrice(item.price)} грн × {item.quantity}
                    </p>
                    <p className="text-sm font-bold">
                      {formatPrice(item.price * item.quantity)} грн
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Товаров ({totalItems}):</span>
              <span>{formatPrice(totalPrice)} грн</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Скидка клиента ({discount}%):</span>
                <span>- {formatPrice(discountAmount)} грн</span>
              </div>
            )}

            <div className="flex justify-between font-extrabold text-xl pt-2 border-t text-black">
              <span>К оплате:</span>
              <span>{formatPrice(finalTotal)} грн</span>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
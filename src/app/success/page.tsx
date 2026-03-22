"use client";

import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

        <h1 className="text-3xl font-bold mb-4">
          Спасибо! Ваш заказ оформлен 🎉
        </h1>

        <p className="text-gray-600 mb-6">
          Мы получили ваш заказ.  
          В ближайшее время с вами свяжутся по указанным контактам
          для подтверждения и уточнения деталей.
        </p>

        <Link
          href="/catalog"
          className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Вернуться в каталог
        </Link>

      </div>
    </main>
  );
}
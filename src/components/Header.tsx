"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import MiniCart from "@/components/MiniCart";
import { useSession } from "next-auth/react";

export default function Header() {
  const { getCartCount } = useCart();
  const { status } = useSession();

  const cartCount = getCartCount();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        
        {/* LOGO + TELEGRAM */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold">
            emptymag
          </Link>

          <a
            href="https://t.me/ridina_ua"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Наш Telegram
          </a>
        </div>

        {/* NAV */}
        <nav className="flex items-center gap-4 md:gap-6 text-sm font-medium">
          
          {/* Скрываем Каталог на телефонах */}
          <Link href="/catalog" className="hidden md:block hover:underline">
            Каталог
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/catalog?category=liquids" className="hover:underline">
              Жидкости
            </Link>

            <Link href="/catalog?category=pods" className="hover:underline">
              Под-системы
            </Link>

            <Link href="/catalog?category=accessories" className="hover:underline">
              Аксессуары
            </Link>
          </div>

          {/* Вход или Кабинет (виден всегда, на телефоне заменяет Каталог) */}
          {status === "authenticated" ? (
            <Link href="/profile" className="font-bold text-black hover:underline">
              Кабинет
            </Link>
          ) : (
            <Link href="/login" className="font-bold text-black hover:underline">
              Вход
            </Link>
          )}

        </nav>

        {/* CART */}
        <div className="flex items-center gap-3">

          <div className="hidden md:block">
            <MiniCart />
          </div>

          <Link
            href="/cart"
            className="rounded-xl bg-black px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Корзина {cartCount > 0 && `(${cartCount})`}
          </Link>

        </div>

      </div>
    </header>
  );
}
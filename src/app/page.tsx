import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-10 text-center text-4xl font-bold">
        Категории товаров
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/catalog?category=liquids"
          className="flex h-56 items-center justify-center rounded-2xl bg-zinc-900 text-2xl font-semibold text-white transition hover:scale-[1.02]"
        >
          Жидкости
        </Link>

        <Link
          href="/catalog?category=pods"
          className="flex h-56 items-center justify-center rounded-2xl bg-zinc-900 text-2xl font-semibold text-white transition hover:scale-[1.02]"
        >
          Под-системы
        </Link>

        <Link
          href="/catalog?category=accessories"
          className="flex h-56 items-center justify-center rounded-2xl bg-zinc-900 text-2xl font-semibold text-white transition hover:scale-[1.02]"
        >
          Аксессуары
        </Link>
      </div>
    </main>
  );
}
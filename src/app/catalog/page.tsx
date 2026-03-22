"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";

const CATEGORY_LABELS: Record<string, string> = {
  liquids: "Жидкости",
  pods: "Под-системы",
  accessories: "Аксессуары",
};

const PRODUCTS_PER_PAGE = 12;

export default function CatalogPage() {
  const { products, loading } = useProducts();
  const { addToCart } = useCart();

  const searchParams = useSearchParams();
  const router = useRouter();

  const urlCategory = searchParams.get("category");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    urlCategory ?? "all"
  );
  const [sort, setSort] = useState("default");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [urlCategory]);

  const categories = useMemo(() => {
    return [
      "all",
      ...new Set(
        products
          .map((product) => product.category)
          .filter((cat) => cat !== "disposables")
      ),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((product) => product.category === selectedCategory);
    }

    if (onlyInStock) {
      result = result.filter((product) => product.stock > 0);
    }

    if (sort === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sort === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "name-desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [products, search, selectedCategory, sort, onlyInStock]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(1);

    if (value === "all") {
      router.push("/catalog");
    } else {
      router.push(`/catalog?category=${value}`);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSort("default");
    setOnlyInStock(false);
    setPage(1);

    router.push("/catalog");
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="mb-6 text-4xl font-bold">Каталог</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { value: "all", label: "Все" },
          { value: "liquids", label: "Жидкости" },
          { value: "pods", label: "Под-системы" },
          { value: "accessories", label: "Аксессуары" },
        ].map((cat) => {
          const active = selectedCategory === cat.value;

          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="mb-8 grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-4">
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
        />

        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "all"
                ? "Все категории"
                : CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
        >
          <option value="default">Без сортировки</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
          <option value="name-asc">Название: А-Я</option>
          <option value="name-desc">Название: Я-А</option>
        </select>

        <button
          onClick={resetFilters}
          className="rounded-xl bg-black px-4 py-3 text-white transition hover:opacity-90"
        >
          Сбросить фильтры
        </button>

        <label className="flex items-center gap-3 md:col-span-4">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => {
              setOnlyInStock(e.target.checked);
              setPage(1);
            }}
          />
          <span>Только в наличии</span>
        </label>
      </div>

      {loading ? (
        <p>Загрузка товаров...</p>
      ) : filteredProducts.length === 0 ? (
        <p>Товары не найдены.</p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/product/${product.slug}`}>
                  <div className="overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-64 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                </Link>

                <div className="p-4">
                  <p className="mb-1 text-sm text-gray-500">
                    {CATEGORY_LABELS[product.category]}
                  </p>

                  <h2 className="mb-2 text-lg font-semibold">
                    {product.name}
                  </h2>

                  <p className="mb-2 text-xl font-bold">
                    {product.price} грн
                  </p>

                  <p
                    className={`mb-3 text-sm font-medium ${
                      product.stock > 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {product.stock > 0
                      ? `В наличии: ${product.stock} шт.`
                      : "Нет в наличии"}
                  </p>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.stock === 0}
                    className={`w-full rounded-lg py-2 text-sm font-medium transition ${
                      product.stock > 0
                        ? "bg-black text-white hover:opacity-90"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {product.stock > 0 ? "В корзину" : "Нет в наличии"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-2 disabled:opacity-40"
            >
              ←
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-lg px-4 py-2 ${
                  page === p
                    ? "bg-black text-white"
                    : "border hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-2 disabled:opacity-40"
            >
              →
            </button>
          </div>
        </>
      )}
    </main>
  );
}
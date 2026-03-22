"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProducts } from "@/context/ProductContext";

type AdminFormState = {
  name: string;
  slug: string;
  price: string;
  image: string;
  description: string;
  stock: string;
  category: string;
};

type ProductItem = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  category: string;
};

const emptyForm: AdminFormState = {
  name: "",
  slug: "",
  price: "",
  image: "",
  description: "",
  stock: "",
  category: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яёіїєґ\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminPageClient() {
  const router = useRouter();
  const { products, refreshProducts, loading } = useProducts();

  const [form, setForm] = useState<AdminFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageMode, setImageMode] = useState<"url" | "file">("url");
  const [imagePreview, setImagePreview] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImageMode("url");
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Не удалось выйти");
      }

      router.replace("/admin-login");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось выйти из админки");
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        setForm((prev) => ({ ...prev, image: result }));
        setImagePreview(result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const finalSlug = slugify(form.slug.trim() || form.name.trim());

    const preparedProduct = {
      name: form.name.trim(),
      slug: finalSlug,
      price: Number(form.price),
      image: form.image.trim(),
      description: form.description.trim(),
      stock: Number(form.stock),
      category: form.category.trim(),
    };

    if (
      !preparedProduct.name ||
      !preparedProduct.slug ||
      !preparedProduct.image ||
      !preparedProduct.description ||
      !preparedProduct.category ||
      Number.isNaN(preparedProduct.price) ||
      Number.isNaN(preparedProduct.stock) ||
      preparedProduct.price <= 0 ||
      preparedProduct.stock < 0
    ) {
      toast.error("Заполни все поля корректно");
      return;
    }

    try {
      setSubmitting(true);

      if (editingId !== null) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preparedProduct),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message || data?.error || "Не удалось обновить товар"
          );
        }

        toast.success("Товар обновлён");
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preparedProduct),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message || data?.error || "Не удалось добавить товар"
          );
        }

        toast.success("Товар добавлен");
      }

      await refreshProducts();
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Ошибка при сохранении товара"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: ProductItem) => {
    setEditingId(product.id);

    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      price: typeof product.price === "number" ? String(product.price) : "",
      image: product.image ?? "",
      description: product.description ?? "",
      stock: typeof product.stock === "number" ? String(product.stock) : "0",
      category: product.category ?? "",
    });

    setImagePreview(product.image ?? "");
    setImageMode(product.image?.startsWith("data:image") ? "file" : "url");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Удалить этот товар?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Не удалось удалить товар"
        );
      }

      toast.success("Товар удалён");
      await refreshProducts();

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Ошибка при удалении товара"
      );
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Админ-панель</h1>
          <p className="mt-2 text-zinc-600">
            Добавление, редактирование и удаление товаров
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
        >
          Выйти
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-bold">
            {editingId !== null ? "Редактировать товар" : "Добавить товар"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Название</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  const newName = e.target.value;

                  setForm((prev) => ({
                    ...prev,
                    name: newName,
                    slug:
                      prev.slug === "" || prev.slug === slugify(prev.name)
                        ? slugify(newName)
                        : prev.slug,
                  }));
                }}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Название товара"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="unikalnyy-slug-tovara"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Категория</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Например: electronics"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Цена</label>
              <input
                type="number"
                min="1"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Цена"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Источник изображения
              </label>

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`rounded-xl px-4 py-2 text-sm transition ${
                    imageMode === "url"
                      ? "bg-black text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Ссылка
                </button>

                <button
                  type="button"
                  onClick={() => setImageMode("file")}
                  className={`rounded-xl px-4 py-2 text-sm transition ${
                    imageMode === "file"
                      ? "bg-black text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Файл
                </button>
              </div>

              {imageMode === "url" ? (
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, image: value }));
                    setImagePreview(value);
                  }}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                  placeholder="https://..."
                  required
                />
              ) : (
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-white"
                  required={imageMode === "file" && !form.image}
                />
              )}

              {imagePreview && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Описание товара"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Наличие</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, stock: e.target.value }))
                }
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Количество на складе"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Сохраняем..."
                  : editingId !== null
                  ? "Сохранить"
                  : "Добавить"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-zinc-300 px-5 py-3 transition hover:bg-zinc-100"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold">Список товаров</h2>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
                Всего: {products.length}
              </span>

              <input
                type="text"
                placeholder="Поиск товара..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 outline-none focus:border-black md:w-72"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-zinc-500">Загрузка товаров...</p>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-zinc-200 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-24 w-24 rounded-xl object-cover"
                      />

                      <div>
                        <h3 className="text-lg font-bold">{product.name}</h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {product.description}
                        </p>
                        <p className="mt-2 text-sm text-zinc-600">
                          Slug: /product/{product.slug}
                        </p>
                        <p className="mt-2 text-sm text-zinc-600">
                          Категория: {product.category}
                        </p>
                        <p className="mt-2 font-medium">{product.price} грн</p>
                        <p className="text-sm text-zinc-600">
                          Наличие: {product.stock}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(product as ProductItem)}
                        className="rounded-xl border border-zinc-300 px-4 py-2 transition hover:bg-zinc-100"
                      >
                        Изменить
                      </button>

                      <button
                        onClick={() => handleDelete(product.id)}
                        className="rounded-xl border border-red-300 px-4 py-2 text-red-600 transition hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <p className="text-zinc-500">Ничего не найдено.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
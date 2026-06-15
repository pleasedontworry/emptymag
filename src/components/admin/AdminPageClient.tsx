"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProducts } from "@/context/ProductContext";

type LiquidBrand = "Chaser" | "ElfLiq" | "Lucky";

type AdminFormState = {
  name: string;
  slug: string;
  price: string;
  image: string;
  description: string;
  stock: string;
  category: string;
  liquidBrand: "" | LiquidBrand;
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
  liquidBrand?: LiquidBrand | null;
};

const emptyForm: AdminFormState = {
  name: "",
  slug: "",
  price: "",
  image: "",
  description: "",
  stock: "",
  category: "",
  liquidBrand: "",
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

      if (!res.ok) throw new Error();

      router.replace("/admin-login");
      router.refresh();
    } catch {
      toast.error("Не удалось выйти из админки");
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, image: reader.result as string }));
        setImagePreview(reader.result as string);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const finalSlug = slugify(form.slug || form.name);
    const isLiquid = form.category === "liquids";

    const preparedProduct = {
      name: form.name.trim(),
      slug: finalSlug,
      price: Number(form.price),
      image: form.image.trim(),
      description: form.description.trim(),
      stock: Number(form.stock),
      category: form.category,
      liquidBrand: isLiquid ? form.liquidBrand : undefined,
    };

    if (
      !preparedProduct.name ||
      !preparedProduct.slug ||
      !preparedProduct.image ||
      !preparedProduct.description ||
      !preparedProduct.category ||
      Number.isNaN(preparedProduct.price) ||
      Number.isNaN(preparedProduct.stock)
    ) {
      toast.error("Заполни все поля корректно");
      return;
    }

    if (isLiquid && !preparedProduct.liquidBrand) {
      toast.error("Выбери категорию жидкости (Chaser / ElfLiq / Lucky)");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(
        editingId ? `/api/products/${editingId}` : "/api/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preparedProduct),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Ошибка");
      }

      toast.success(editingId ? "Обновлено" : "Добавлено");

      await refreshProducts();
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка сохранения"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: ProductItem) => {
    setEditingId(product.id);

    setForm({
      name: product.name,
      slug: product.slug,
      price: String(product.price),
      image: product.image,
      description: product.description,
      stock: String(product.stock),
      category: product.category,
      liquidBrand: product.liquidBrand ?? "",
    });

    setImagePreview(product.image);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить товар?")) return;

    await fetch(`/api/products/${id}`, { method: "DELETE" });

    await refreshProducts();
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">Админка</h1>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-10">

        <input
          placeholder="Название"
          value={form.name}
          onChange={(e) =>
            setForm((p) => ({ ...p, name: e.target.value }))
          }
          className="w-full border p-3 rounded"
        />

        <select
          value={form.category}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              category: e.target.value,
              liquidBrand: e.target.value === "liquids" ? p.liquidBrand : "",
            }))
          }
          className="w-full border p-3 rounded"
        >
          <option value="">Выбери категорию</option>
          <option value="liquids">Жидкости</option>
          <option value="pods">Под-системы</option>
          <option value="disposables">Одноразки</option>
          <option value="accessories">Аксессуары</option>
        </select>

        {form.category === "liquids" && (
          <select
            value={form.liquidBrand}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                liquidBrand: e.target.value as LiquidBrand,
              }))
            }
            className="w-full border p-3 rounded"
          >
            <option value="">Выбери категорию жидкости</option>
            <option value="Chaser">Chaser</option>
            <option value="ElfLiq">ElfLiq</option>
            <option value="Lucky">Lucky</option>
          </select>
        )}

        <input
          type="number"
          placeholder="Цена"
          value={form.price}
          onChange={(e) =>
            setForm((p) => ({ ...p, price: e.target.value }))
          }
          className="w-full border p-3 rounded"
        />

        <input
          placeholder="Ссылка на картинку"
          value={form.image}
          onChange={(e) =>
            setForm((p) => ({ ...p, image: e.target.value }))
          }
          className="w-full border p-3 rounded"
        />

        <textarea
          placeholder="Описание"
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          placeholder="Наличие"
          value={form.stock}
          onChange={(e) =>
            setForm((p) => ({ ...p, stock: e.target.value }))
          }
          className="w-full border p-3 rounded"
        />

        <button className="bg-black text-white px-6 py-3 rounded">
          {editingId ? "Сохранить" : "Добавить"}
        </button>
      </form>

      {/* Список */}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        products.map((p) => (
          <div key={p.id} className="border p-4 mb-3 rounded">
            <b>{p.name}</b> — {p.category}
            {p.liquidBrand && ` / ${p.liquidBrand}`}
            <div className="flex gap-3 mt-2">
              <button onClick={() => handleEdit(p as ProductItem)}>Редактировать</button>
              <button onClick={() => handleDelete(p.id)}>Удалить</button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
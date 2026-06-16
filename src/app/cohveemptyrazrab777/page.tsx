"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ProductCategory = "liquids" | "pods" | "disposables" | "accessories";
type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";
type LiquidBrand = "Chaser" | "ElfLiq" | "Lucky";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  isActive: boolean;
  isRedPrice: boolean;
  category: ProductCategory;
  liquidBrand?: LiquidBrand | null;
  createdAt: string;
  updatedAt: string;
};

type OrderItem = {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  productSlug: string;
  price: number;
  quantity: number;
  image: string;
  createdAt: string;
};

type Order = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  phone: string;
  telegram: string | null;
  comment: string | null;
  totalPrice: number;
  totalItems: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

type User = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  email: string;
  phone: string | null;
  totalSpent: number;
  personalDiscount: number;
  createdAt: string;
};

type ProductDraft = {
  name: string;
  slug: string;
  price: string;
  image: string;
  description: string;
  stock: string;
  isRedPrice: boolean;
  category: ProductCategory;
  liquidBrand: LiquidBrand | "";
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  liquids: "Жидкости",
  pods: "Под-системы",
  disposables: "Одноразки",
  accessories: "Аксессуары",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждён",
  completed: "Завершён",
  cancelled: "Отменён",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const INITIAL_NEW_PRODUCT: ProductDraft = {
  name: "",
  slug: "",
  price: "",
  image: "",
  description: "",
  stock: "",
  isRedPrice: false,
  category: "liquids",
  liquidBrand: "",
};

function formatPrice(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU");
}

function isValidImageUrl(value: string) {
  const url = value.trim();
  return url.startsWith("http://") || url.startsWith("https://");
}

export default function HiddenAdminPage() {
  const router = useRouter();

  const [tab, setTab] = useState<"products" | "orders" | "clients">("products");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [productDrafts, setProductDrafts] = useState<Record<number, ProductDraft>>({});
  const [newProduct, setNewProduct] = useState<ProductDraft>(INITIAL_NEW_PRODUCT);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderStatus>("all");
  const [orderSort, setOrderSort] = useState<"newest" | "oldest" | "price-desc" | "price-asc">("newest");

  const [clients, setClients] = useState<User[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [clientForm, setClientForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phone: "",
    totalSpent: 0,
    personalDiscount: 0,
    newPassword: "",
  });

  const loadProducts = async () => {
    try {
      setProductsLoading(true);

      const res = await fetch("/api/products", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Не удалось загрузить товары");
      }

      const data = (await res.json()) as Product[];

      setProducts(data);

      const drafts: Record<number, ProductDraft> = {};
      for (const product of data) {
        drafts[product.id] = {
          name: product.name,
          slug: product.slug,
          price: String(product.price),
          image: product.image,
          description: product.description,
          stock: String(product.stock),
          isRedPrice: product.isRedPrice || false,
          category: product.category,
          liquidBrand: product.category === "liquids" ? product.liquidBrand ?? "" : "",
        };
      }

      setProductDrafts(drafts);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить товары");
    } finally {
      setProductsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);

      const res = await fetch("/api/orders", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Не удалось загрузить заказы");
      }

      const data = (await res.json()) as Order[];
      setOrders(data);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить заказы");
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      setClientsLoading(true);
      const res = await fetch("/api/admin/clients", { cache: "no-store" });
      if (!res.ok) throw new Error("Не удалось загрузить клиентов");
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить клиентов");
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadClients();
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      const res = await fetch("/api/admin/logout", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Не удалось выйти из админки");
      }

      toast.success("Вы вышли из админки");
      router.replace("/cohveemptyrazrab777/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Не удалось выйти из админки"
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const updateDraft = (
    productId: number,
    field: keyof ProductDraft,
    value: any
  ) => {
    setProductDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const updateNewProduct = (field: keyof ProductDraft, value: any) => {
    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateProductDraft = (draft: ProductDraft) => {
    const price = Number(draft.price);
    const stock = Number(draft.stock);

    if (!draft.name.trim()) {
      return "Название товара обязательно";
    }

    if (!draft.slug.trim()) {
      return "Slug обязателен";
    }

    if (!draft.image.trim()) {
      return "Ссылка на изображение обязательна";
    }

    if (!draft.description.trim()) {
      return "Описание обязательно";
    }

    if (!Number.isInteger(price) || price < 0) {
      return "Цена должна быть целым числом от 0";
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return "Остаток должен быть целым числом от 0";
    }

    if (draft.category === "liquids" && !draft.liquidBrand) {
      return "Для жидкости выбери подкатегорию";
    }

    return null;
  };

  const createProduct = async () => {
    const validationError = validateProductDraft(newProduct);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setCreatingProduct(true);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          slug: newProduct.slug.trim(),
          price: Number(newProduct.price),
          image: newProduct.image.trim(),
          description: newProduct.description.trim(),
          stock: Number(newProduct.stock),
          isRedPrice: newProduct.isRedPrice,
          category: newProduct.category,
          liquidBrand:
            newProduct.category === "liquids"
              ? newProduct.liquidBrand
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Не удалось создать товар");
      }

      toast.success("Товар добавлен");
      setNewProduct(INITIAL_NEW_PRODUCT);
      await loadProducts();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Не удалось создать товар"
      );
    } finally {
      setCreatingProduct(false);
    }
  };

  const saveProduct = async (productId: number) => {
    const draft = productDrafts[productId];

    if (!draft) return;

    const validationError = validateProductDraft(draft);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSavingProductId(productId);

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: draft.name.trim(),
          slug: draft.slug.trim(),
          price: Number(draft.price),
          image: draft.image.trim(),
          description: draft.description.trim(),
          stock: Number(draft.stock),
          isRedPrice: draft.isRedPrice,
          category: draft.category,
          liquidBrand:
            draft.category === "liquids" ? draft.liquidBrand : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Не удалось сохранить товар");
      }

      toast.success("Товар обновлён");
      await loadProducts();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Не удалось сохранить товар"
      );
    } finally {
      setSavingProductId(null);
    }
  };

  const deleteProduct = async (productId: number) => {
    const confirmed = window.confirm(
      "Удалить товар? Это действие нельзя отменить."
    );

    if (!confirmed) return;

    try {
      setDeletingProductId(productId);

      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Не удалось удалить товар");
      }

      toast.success("Товар удалён");

      setProducts((prev) => prev.filter((item) => item.id !== productId));

      setProductDrafts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Не удалось удалить товар"
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);

      const res = await fetch(`/api/orders/${orderId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Не удалось обновить заказ");
      }

      toast.success("Статус заказа обновлён");
      await loadOrders();
      await loadProducts();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Не удалось обновить заказ"
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const deleteOrder = async (orderId: number) => {
    const confirmed = window.confirm(
      "Удалить заказ?\n\nЕсли заказ не был отменён, товары будут возвращены на склад."
    );

    if (!confirmed) return;

    try {
      setDeletingOrderId(orderId);

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Не удалось удалить заказ");
      }

      toast.success("Заказ удалён");
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      await loadProducts();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Не удалось удалить заказ"
      );
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleEditClientClick = (client: User) => {
    setEditingClient(client);
    setClientForm({
      firstName: client.firstName || "",
      lastName: client.lastName || "",
      middleName: client.middleName || "",
      email: client.email || "",
      phone: client.phone || "",
      totalSpent: client.totalSpent,
      personalDiscount: client.personalDiscount || 0,
      newPassword: "",
    });
  };

  const saveClient = async () => {
    if (!editingClient) return;
    try {
      const res = await fetch(`/api/admin/clients/${editingClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientForm),
      });
      if (!res.ok) throw new Error("Не удалось обновить клиента");
      toast.success("Клиент обновлен");
      setEditingClient(null);
      await loadClients();
    } catch (error) {
      toast.error("Ошибка при сохранении клиента");
    }
  };

  const deleteClient = async (id: number) => {
    if (!window.confirm("Точно удалить клиента?")) return;
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Не удалось удалить клиента");
      toast.success("Клиент удален");
      await loadClients();
    } catch (error) {
      toast.error("Ошибка удаления");
    }
  };

  const orderStats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((order) => order.status.toLowerCase() === "pending").length;
    const confirmed = orders.filter((order) => order.status.toLowerCase() === "confirmed").length;
    const completed = orders.filter((order) => order.status.toLowerCase() === "completed").length;
    const cancelled = orders.filter((order) => order.status.toLowerCase() === "cancelled").length;

    const revenue = orders
      .filter((order) => order.status.toLowerCase() !== "cancelled")
      .reduce((sum, order) => sum + order.totalPrice, 0);

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      revenue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = orderSearch.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      const statusKey = order.status.toLowerCase() as OrderStatus;
      const matchesStatus =
        orderStatusFilter === "all" ? true : statusKey === orderStatusFilter;

      const fullName = `${order.lastName || ""} ${order.firstName || ""} ${order.middleName || ""}`.toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        String(order.id).includes(normalizedSearch) ||
        fullName.includes(normalizedSearch) ||
        (order.phone && order.phone.toLowerCase().includes(normalizedSearch)) ||
        (order.telegram && order.telegram.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (orderSort) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "price-asc":
          return a.totalPrice - b.totalPrice;
        case "price-desc":
          return b.totalPrice - a.totalPrice;
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return sorted;
  }, [orders, orderSearch, orderStatusFilter, orderSort]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Админка</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Управление товарами и заказами
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "products"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 bg-white hover:bg-zinc-50"
            }`}
          >
            Товары
          </button>

          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "orders"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 bg-white hover:bg-zinc-50"
            }`}
          >
            Заказы
          </button>

          <button
            type="button"
            onClick={() => setTab("clients")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "clients"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 bg-white hover:bg-zinc-50"
            }`}
          >
            Клиенты
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Выход..." : "Выйти"}
          </button>
        </div>
      </div>

      {tab === "products" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Добавить товар</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Здесь снова есть предпросмотр изображения перед созданием
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Название</label>
                  <input
                    value={newProduct.name}
                    onChange={(e) => updateNewProduct("name", e.target.value)}
                    className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                    placeholder="Название товара"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Slug</label>
                  <input
                    value={newProduct.slug}
                    onChange={(e) => updateNewProduct("slug", e.target.value)}
                    className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                    placeholder="slug-tovara"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Категория</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => {
                      const nextCategory = e.target.value as ProductCategory;
                      setNewProduct((prev) => ({
                        ...prev,
                        category: nextCategory,
                        liquidBrand:
                          nextCategory === "liquids" ? prev.liquidBrand : "",
                      }));
                    }}
                    className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                  >
                    <option value="liquids">Жидкости</option>
                    <option value="pods">Под-системы</option>
                    <option value="disposables">Одноразки</option>
                    <option value="accessories">Аксессуары</option>
                  </select>
                </div>

                {newProduct.category === "liquids" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Подкатегория жидкости
                    </label>
                    <select
                      value={newProduct.liquidBrand}
                      onChange={(e) =>
                        updateNewProduct(
                          "liquidBrand",
                          e.target.value as LiquidBrand | ""
                        )
                      }
                      className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                    >
                      <option value="">Выбери подкатегорию</option>
                      <option value="Chaser">Chaser</option>
                      <option value="ElfLiq">ElfLiq</option>
                      <option value="Lucky">Lucky</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Цена</label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => updateNewProduct("price", e.target.value)}
                    className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Остаток</label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => updateNewProduct("stock", e.target.value)}
                    className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl hover:bg-red-50 transition border-red-200">
                    <input
                      type="checkbox"
                      checked={newProduct.isRedPrice}
                      onChange={(e) => updateNewProduct("isRedPrice", e.target.checked)}
                      className="w-5 h-5 text-red-600 focus:ring-red-600 accent-red-600"
                    />
                    <span className="font-bold text-red-600">Красная цена (Акция)</span>
                  </label>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    Ссылка на изображение
                  </label>

                  <input
                    value={newProduct.image}
                    onChange={(e) => updateNewProduct("image", e.target.value)}
                    className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                    placeholder="https://..."
                  />

                  <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                    Загрузить фото
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        if (!e.target.files?.[0]) return;

                        const formData = new FormData();
                        formData.append("file", e.target.files[0]);

                        const res = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });

                        const data = await res.json();

                        if (data.url) {
                          updateNewProduct("image", data.url);
                          toast.success("Фото загружено");
                        } else {
                          toast.error("Ошибка загрузки");
                        }
                      }}
                    />
                  </label>

                  {newProduct.image && (
                    <img
                      src={newProduct.image}
                      alt="preview"
                      className="mt-3 h-32 w-32 rounded-xl border object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-medium">Описание</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) =>
                      updateNewProduct("description", e.target.value)
                    }
                    rows={5}
                    className="rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
                    placeholder="Описание товара"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={createProduct}
                    disabled={creatingProduct}
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingProduct ? "Добавление..." : "Добавить товар"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-3 text-sm font-medium">Предпросмотр фото</div>

                {isValidImageUrl(newProduct.image) ? (
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                    <div className="relative aspect-square">
                      <Image
                        src={newProduct.image.trim()}
                        alt={newProduct.name || "Предпросмотр"}
                        fill
                        className="object-cover"
                        sizes="260px"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-4 text-center text-sm text-zinc-500">
                    Вставь ссылку на изображение, и здесь появится предпросмотр
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Товары</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Всего товаров: {products.length}
                </p>
              </div>

              <button
                type="button"
                onClick={loadProducts}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Обновить
              </button>
            </div>
          </div>

          {productsLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl bg-zinc-100"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => {
                const draft = productDrafts[product.id];

                if (!draft) return null;

                return (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {product.name}
                          {product.isRedPrice && (
                            <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">
                              АКЦИЯ
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          ID: {product.id} · {CATEGORY_LABELS[product.category]}
                          {product.category === "liquids" && product.liquidBrand
                            ? ` · ${product.liquidBrand}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            product.stock > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock > 0
                            ? `В наличии: ${product.stock}`
                            : "Нет в наличии"}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">Название</label>
                          <input
                            value={draft.name}
                            onChange={(e) =>
                              updateDraft(product.id, "name", e.target.value)
                            }
                            className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">Slug</label>
                          <input
                            value={draft.slug}
                            onChange={(e) =>
                              updateDraft(product.id, "slug", e.target.value)
                            }
                            className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">Категория</label>
                          <select
                            value={draft.category}
                            onChange={(e) => {
                              const nextCategory =
                                e.target.value as ProductCategory;
                              setProductDrafts((prev) => ({
                                ...prev,
                                [product.id]: {
                                  ...prev[product.id],
                                  category: nextCategory,
                                  liquidBrand:
                                    nextCategory === "liquids"
                                      ? prev[product.id].liquidBrand
                                      : "",
                                },
                              }));
                            }}
                            className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                          >
                            <option value="liquids">Жидкости</option>
                            <option value="pods">Под-системы</option>
                            <option value="disposables">Одноразки</option>
                            <option value="accessories">Аксессуары</option>
                          </select>
                        </div>

                        {draft.category === "liquids" && (
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">
                              Подкатегория жидкости
                            </label>
                            <select
                              value={draft.liquidBrand}
                              onChange={(e) =>
                                updateDraft(
                                  product.id,
                                  "liquidBrand",
                                  e.target.value
                                )
                              }
                              className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                            >
                              <option value="">Выбери подкатегорию</option>
                              <option value="Chaser">Chaser</option>
                              <option value="ElfLiq">ElfLiq</option>
                              <option value="Lucky">Lucky</option>
                            </select>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">Цена</label>
                          <input
                            type="number"
                            min="0"
                            value={draft.price}
                            onChange={(e) =>
                              updateDraft(product.id, "price", e.target.value)
                            }
                            className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">Остаток</label>
                          <input
                            type="number"
                            min="0"
                            value={draft.stock}
                            onChange={(e) =>
                              updateDraft(product.id, "stock", e.target.value)
                            }
                            className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                          />
                        </div>

                        <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-3">
                          <label className="flex items-center gap-3 cursor-pointer mt-1">
                            <input
                              type="checkbox"
                              checked={draft.isRedPrice}
                              onChange={(e) =>
                                updateDraft(product.id, "isRedPrice", e.target.checked)
                              }
                              className="w-5 h-5 text-red-600 focus:ring-red-600 accent-red-600"
                            />
                            <span className="font-bold text-red-600">
                              Красная цена в каталоге
                            </span>
                          </label>
                        </div>

                        <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-3">
                          <label className="text-sm font-medium">
                            Ссылка на изображение
                          </label>
                          <input
                            value={draft.image}
                            onChange={(e) =>
                              updateDraft(product.id, "image", e.target.value)
                            }
                            className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
                          />
                        </div>

                        <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-3">
                          <label className="text-sm font-medium">Описание</label>
                          <textarea
                            value={draft.description}
                            onChange={(e) =>
                              updateDraft(
                                product.id,
                                "description",
                                e.target.value
                              )
                            }
                            rows={4}
                            className="rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
                          />
                        </div>

                        <div className="md:col-span-2 xl:col-span-3">
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => saveProduct(product.id)}
                              disabled={savingProductId === product.id}
                              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingProductId === product.id
                                ? "Сохранение..."
                                : "Сохранить"}
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteProduct(product.id)}
                              disabled={deletingProductId === product.id}
                              className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingProductId === product.id
                                ? "Удаление..."
                                : "Удалить"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <div className="mb-3 text-sm font-medium">
                          Предпросмотр фото
                        </div>

                        {isValidImageUrl(draft.image) ? (
                          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                            <div className="relative aspect-square">
                              <Image
                                src={draft.image.trim()}
                                alt={draft.name || "Предпросмотр"}
                                fill
                                className="object-cover"
                                sizes="220px"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-4 text-center text-sm text-zinc-500">
                            Вставь ссылку на изображение
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "orders" && (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-zinc-500">Всего заказов</div>
              <div className="mt-2 text-2xl font-bold">{orderStats.total}</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-zinc-500">Ожидают</div>
              <div className="mt-2 text-2xl font-bold">{orderStats.pending}</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-zinc-500">Подтверждены</div>
              <div className="mt-2 text-2xl font-bold">
                {orderStats.confirmed}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-zinc-500">Завершены</div>
              <div className="mt-2 text-2xl font-bold">
                {orderStats.completed}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-zinc-500">Выручка</div>
              <div className="mt-2 text-2xl font-bold">
                {formatPrice(orderStats.revenue)} ₴
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Поиск по заказам</label>
              <input
                type="text"
                placeholder="ID, имя, телефон, telegram"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Фильтр по статусу</label>
              <select
                value={orderStatusFilter}
                onChange={(e) =>
                  setOrderStatusFilter(e.target.value as "all" | OrderStatus)
                }
                className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
              >
                <option value="all">Все статусы</option>
                <option value="pending">Ожидает</option>
                <option value="confirmed">Подтверждён</option>
                <option value="completed">Завершён</option>
                <option value="cancelled">Отменён</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Сортировка</label>
              <select
                value={orderSort}
                onChange={(e) =>
                  setOrderSort(
                    e.target.value as
                      | "newest"
                      | "oldest"
                      | "price-desc"
                      | "price-asc"
                  )
                }
                className="h-11 rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-900"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="price-desc">Сначала дороже</option>
                <option value="price-asc">Сначала дешевле</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={loadOrders}
                className="h-11 w-full rounded-xl border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50"
              >
                Обновить заказы
              </button>
            </div>
          </div>

          {ordersLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-2xl bg-zinc-100"
                />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
              <h2 className="text-xl font-semibold">Заказы не найдены</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Попробуй изменить поиск или фильтры.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => {
                const statusKey = order.status.toLowerCase() as OrderStatus;

                return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold">
                          Заказ #{order.id}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[statusKey]}`}
                        >
                          {STATUS_LABELS[statusKey]}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-zinc-600">
                        <p>
                          <span className="font-medium text-zinc-900">
                            Клиент:
                          </span>{" "}
                          {order.lastName} {order.firstName} {order.middleName || ""}
                        </p>
                        <p>
                          <span className="font-medium text-zinc-900">
                            Телефон:
                          </span>{" "}
                          {order.phone}
                        </p>
                        {order.telegram && (
                          <p>
                            <span className="font-medium text-zinc-900">
                              Telegram:
                            </span>{" "}
                            {order.telegram}
                          </p>
                        )}
                        {order.comment && (
                          <p>
                            <span className="font-medium text-zinc-900">
                              Комментарий:
                            </span>{" "}
                            {order.comment}
                          </p>
                        )}
                        <p>
                          <span className="font-medium text-zinc-900">
                            Создан:
                          </span>{" "}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 rounded-2xl bg-zinc-50 p-4 text-sm xl:min-w-[230px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">Товаров</span>
                        <span className="font-semibold">{order.totalItems}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-500">Сумма</span>
                        <span className="font-semibold">
                          {formatPrice(order.totalPrice)} ₴
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 overflow-hidden rounded-2xl border border-zinc-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-zinc-50 text-left">
                          <tr>
                            <th className="px-4 py-3 font-medium">Товар</th>
                            <th className="px-4 py-3 font-medium">Цена</th>
                            <th className="px-4 py-3 font-medium">Кол-во</th>
                            <th className="px-4 py-3 font-medium">Сумма</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-zinc-200"
                            >
                              <td className="px-4 py-3">{item.productName}</td>
                              <td className="px-4 py-3">
                                {formatPrice(item.price)} ₴
                              </td>
                              <td className="px-4 py-3">{item.quantity}</td>
                              <td className="px-4 py-3">
                                {formatPrice(item.price * item.quantity)} ₴
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "confirmed")}
                      disabled={updatingOrderId === order.id}
                      className="rounded-xl border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Подтвердить
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "completed")}
                      disabled={updatingOrderId === order.id}
                      className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Завершить
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                      disabled={updatingOrderId === order.id}
                      className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Отменить
                    </button>

                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "pending")}
                      disabled={updatingOrderId === order.id}
                      className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Вернуть в ожидание
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteOrder(order.id)}
                      disabled={deletingOrderId === order.id}
                      className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingOrderId === order.id
                        ? "Удаление..."
                        : "Удалить заказ"}
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </section>
      )}

      {tab === "clients" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Список клиентов ({clients.length})</h2>
            
            {clientsLoading ? (
              <p>Загрузка клиентов...</p>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="border p-4 rounded-xl flex justify-between items-center bg-gray-50">
                    <div>
                      <p className="font-bold text-lg">{client.lastName} {client.firstName} {client.middleName}</p>
                      <p className="text-sm text-gray-500">{client.email} • {client.phone || "Нет телефона"}</p>
                      <p className="text-sm text-emerald-600 font-medium mt-1">
                        Выкуплено: {formatPrice(client.totalSpent)} ₴ 
                        {client.personalDiscount > 0 && <span className="text-blue-600 ml-2">• Персональная скидка: {client.personalDiscount}%</span>}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleEditClientClick(client)}
                      className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
                    >
                      Редактировать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editingClient && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Редактирование профиля</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Фамилия</label>
                    <input type="text" value={clientForm.lastName} onChange={(e) => setClientForm({...clientForm, lastName: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Имя</label>
                    <input type="text" value={clientForm.firstName} onChange={(e) => setClientForm({...clientForm, firstName: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Отчество</label>
                    <input type="text" value={clientForm.middleName} onChange={(e) => setClientForm({...clientForm, middleName: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={clientForm.email} onChange={(e) => setClientForm({...clientForm, email: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Телефон</label>
                    <input type="text" value={clientForm.phone} onChange={(e) => setClientForm({...clientForm, phone: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-black" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Сумма выкупа</label>
                      <input type="number" value={clientForm.totalSpent} onChange={(e) => setClientForm({...clientForm, totalSpent: Number(e.target.value)})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-black text-emerald-600 font-bold" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Скидка (%)</label>
                      <input type="number" max="100" min="0" value={clientForm.personalDiscount} onChange={(e) => setClientForm({...clientForm, personalDiscount: Number(e.target.value)})} className="w-full border border-blue-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600 text-blue-600 font-bold" />
                    </div>
                  </div>
                  <div className="pt-2 border-t mt-2">
                    <label className="text-sm font-medium text-red-600">Задать новый пароль</label>
                    <input type="text" placeholder="Оставьте пустым, если не меняете" value={clientForm.newPassword} onChange={(e) => setClientForm({...clientForm, newPassword: e.target.value})} className="w-full border border-red-300 rounded-xl px-3 py-2 outline-none focus:border-red-600 placeholder:text-red-300" />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <button onClick={() => deleteClient(editingClient.id)} className="text-red-600 font-medium hover:underline text-sm">Удалить аккаунт</button>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingClient(null)} className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-gray-50">Отмена</button>
                    <button onClick={saveClient} className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">Сохранить</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
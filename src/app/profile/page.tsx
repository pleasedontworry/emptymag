"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Состояния для редактирования профиля
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    telegram: "",
  });

  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [currentCatIndex, setCurrentCatIndex] = useState(0);
  const categories = ["liquids", "pods", "accessories"];
  const catNames = ["Жидкости", "Под-системы", "Аксессуары"];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProfile();
      fetchLeaderboard();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (res.ok) setUserData(data.user);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (res.ok) setLeaderboard(data);
    } catch (error) {
      console.error("Ошибка загрузки лидерборда:", error);
    }
  };

  // Включаем режим редактирования и заполняем форму текущими данными
  const handleEditClick = () => {
    setEditForm({
      firstName: userData?.firstName || "",
      lastName: userData?.lastName || "",
      middleName: userData?.middleName || "",
      phone: userData?.phone || "",
      telegram: userData?.telegram || "",
    });
    setIsEditing(true);
  };

  // Сохраняем новые данные
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Ошибка обновления профиля");
      }

      setUserData(data.user);
      setIsEditing(false);
      toast.success("Данные успешно обновлены!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-medium text-gray-600">Загрузка данных...</div>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case "PENDING": return "В обработке";
      case "CONFIRMED": return "Подтвержден";
      case "COMPLETED": return "Завершен";
      case "CANCELLED": return "Отменен";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Личный кабинет</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md font-medium transition"
          >
            Выйти
          </button>
        </div>

        {/* БЛОК ДАННЫХ ПОЛЬЗОВАТЕЛЯ */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Мои данные</h2>
            {!isEditing && (
              <button 
                onClick={handleEditClick}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-black px-4 py-1.5 rounded-lg font-medium transition"
              >
                Редактировать
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                  <input type="text" required value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 border outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                  <input type="text" required value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 border outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
                  <input type="text" value={editForm.middleName} onChange={(e) => setEditForm({...editForm, middleName: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 border outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input type="tel" required value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 border outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                  <input type="text" required value={editForm.telegram} onChange={(e) => setEditForm({...editForm, telegram: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 border outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email (Логин)</label>
                  <input type="text" disabled value={userData?.email || ""} className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 border text-gray-500 cursor-not-allowed" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSaving} className="bg-black text-white px-5 py-2 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-70">
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-100 text-black px-5 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-gray-700">
              <p><span className="font-semibold w-32 inline-block">Фамилия:</span> {userData?.lastName || "Не указана"}</p>
              <p><span className="font-semibold w-32 inline-block">Имя:</span> {userData?.firstName || "Не указано"}</p>
              <p><span className="font-semibold w-32 inline-block">Отчество:</span> {userData?.middleName || "—"}</p>
              <p><span className="font-semibold w-32 inline-block">Telegram:</span> {userData?.telegram || "Не указан"}</p>
              <p><span className="font-semibold w-32 inline-block">Телефон:</span> {userData?.phone || "Не указан"}</p>
              <p className="pt-2"><span className="font-semibold w-32 inline-block">Email:</span> {userData?.email}</p>
              
              <div className="mt-4 p-4 bg-gray-100 rounded-lg inline-block">
                <p className="text-lg font-bold text-gray-900">
                  Ваша персональная скидка: <span className="text-green-600">{userData?.personalDiscount || 0}%</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Топ-10 покупателей за 30 дней</h2>
            <div className="flex gap-4 items-center">
              <button onClick={() => setCurrentCatIndex((prev) => (prev > 0 ? prev - 1 : 2))} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">←</button>
              <span className="font-bold text-sm w-32 text-center">{catNames[currentCatIndex]}</span>
              <button onClick={() => setCurrentCatIndex((prev) => (prev < 2 ? prev + 1 : 0))} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">→</button>
            </div>
          </div>
          
          <div className="space-y-2">
            {leaderboard?.[categories[currentCatIndex]]?.length > 0 ? (
              leaderboard[categories[currentCatIndex]].map((entry: any, i: number) => (
                <div key={i} className={`flex justify-between p-3 rounded-lg border ${entry.userId === userData?.id ? 'bg-yellow-50 border-yellow-200 font-bold' : 'bg-gray-50'}`}>
                  <span>{i + 1}. {entry.name} {entry.userId === userData?.id && "(ВЫ)"}</span>
                  <span>{entry.count} шт.</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Данных за 30 дней пока нет</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">История заказов</h2>
          {userData?.orders && userData.orders.length > 0 ? (
            <div className="space-y-6">
              {userData.orders.map((order: any, index: number) => (
                <div key={order.id} className="border border-gray-200 p-5 rounded-xl bg-white hover:shadow-md transition">
                  <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <div>
                      <p className="font-bold text-lg">Заказ #{userData.orders.length - index}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="space-y-3 mb-4">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg">
                        <img src={item.image || "/placeholder.jpg"} className="w-16 h-16 object-cover rounded-md" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.price} грн × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-right font-extrabold text-lg">Итого: {order.totalPrice} грн</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">У вас пока нет заказов.</p>
          )}
        </div>
      </div>
    </div>
  );
}
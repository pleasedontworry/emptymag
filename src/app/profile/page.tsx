"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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

        <div className="bg-white shadow-md rounded-xl p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Мои данные</h2>
          <div className="space-y-3 text-gray-700">
            <p><span className="font-semibold w-32 inline-block">Фамилия:</span> {userData?.lastName || "Не указана"}</p>
            <p><span className="font-semibold w-32 inline-block">Имя:</span> {userData?.firstName || "Не указано"}</p>
            <p><span className="font-semibold w-32 inline-block">Отчество:</span> {userData?.middleName || "Не указано"}</p>
            <p className="pt-2"><span className="font-semibold w-32 inline-block">Email:</span> {userData?.email}</p>
            <p><span className="font-semibold w-32 inline-block">Телефон:</span> {userData?.phone || "Не указан"}</p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg inline-block">
              <p className="text-lg font-bold text-gray-900">
                Ваша персональная скидка: <span className="text-green-600">{userData?.personalDiscount || 0}%</span>
              </p>
            </div>
          </div>
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
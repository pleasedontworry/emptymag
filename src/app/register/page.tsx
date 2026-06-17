"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ALLOWED_DOMAINS = [
  "gmail.com",
  "icloud.com",
  "ukr.net",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "meta.ua",
  "i.ua"
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    telegram: "",
    password: "",
  });
  
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    phone: "",
    email: "",
    telegram: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    if (name === "firstName" || name === "lastName") {
      value = value.replace(/[^а-яА-ЯёЁіІїЇєЄґҐ\s\-]/g, "");
    }

    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 9);
      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
    }

    if (name === "email" && fieldErrors.email) {
      setFieldErrors({ ...fieldErrors, email: "" });
    }

    if (name === "telegram" && fieldErrors.telegram) {
      setFieldErrors({ ...fieldErrors, telegram: "" });
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({ phone: "", email: "", telegram: "" });

    let hasErrors = false;

    if (form.phone.length !== 9) {
      setFieldErrors((prev) => ({ ...prev, phone: "Номер должен состоять из 9 цифр" }));
      hasErrors = true;
    }

    const emailDomain = form.email.split("@")[1]?.toLowerCase();
    if (!emailDomain || !ALLOWED_DOMAINS.includes(emailDomain)) {
      setFieldErrors((prev) => ({ 
        ...prev, 
        email: `Разрешены почты: ${ALLOWED_DOMAINS.join(", ")}` 
      }));
      hasErrors = true;
    }

    const tgHandle = form.telegram.trim();
    if (!tgHandle.startsWith("@")) {
      setFieldErrors((prev) => ({ ...prev, telegram: "Telegram должен начинаться с @" }));
      hasErrors = true;
    }

    if (hasErrors) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: `+380${form.phone}`,
          telegram: tgHandle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Ошибка при регистрации");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Создать аккаунт
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Для получения накопительной скидки
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="sr-only">Имя</label>
              <input id="firstName" name="firstName" type="text" required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                placeholder="Имя" value={form.firstName} onChange={handleChange} />
            </div>
            
            <div>
              <label htmlFor="lastName" className="sr-only">Фамилия</label>
              <input id="lastName" name="lastName" type="text" required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                placeholder="Фамилия" value={form.lastName} onChange={handleChange} />
            </div>

            <div>
              <div className={`flex items-center overflow-hidden rounded border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} bg-white focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-colors`}>
                <div className="flex items-center justify-center bg-gray-100 px-3 py-2 border-r border-gray-300 text-gray-700 select-none">
                  <span className="mr-1 text-lg leading-none">🇺🇦</span>
                  <span className="font-medium text-sm mt-[1px]">+380</span>
                </div>
                <input id="phone" name="phone" type="tel" required
                  className="appearance-none block w-full px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none sm:text-sm"
                  placeholder="XX XXX XX XX" value={form.phone} onChange={handleChange} />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="telegram" className="sr-only">Telegram</label>
              <input id="telegram" name="telegram" type="text" required
                className={`appearance-none rounded relative block w-full px-3 py-2 border ${fieldErrors.telegram ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black sm:text-sm`}
                placeholder="Telegram (@username)" value={form.telegram} onChange={handleChange} />
              {fieldErrors.telegram && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.telegram}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input id="email" name="email" type="email" required
                className={`appearance-none rounded relative block w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black sm:text-sm`}
                placeholder="Email адрес" value={form.email} onChange={handleChange} />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Пароль</label>
              <input id="password" name="password" type="password" required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                placeholder="Пароль" value={form.password} onChange={handleChange} />
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400 transition">
              {loading ? "Загрузка..." : "Зарегистрироваться"}
            </button>
          </div>
          <div className="text-center text-sm">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-black hover:underline">
              Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone } = body;

    if (!email || !password || !phone) {
      return NextResponse.json(
        { message: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // 1. Проверяем, свободен ли Email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: "Пользователь с таким Email адресом уже зарегистрирован" },
        { status: 400 }
      );
    }

    // 2. Проверяем, свободен ли номер телефона
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return NextResponse.json(
        { message: "Пользователь с таким номером телефона уже зарегистрирован" },
        { status: 400 }
      );
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя в БД
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
      },
    });

    return NextResponse.json(
      { message: "Пользователь успешно создан", user: { email: newUser.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ ОШИБКА РЕГИСТРАЦИИ:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
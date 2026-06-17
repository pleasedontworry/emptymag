import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// ======================
// 📥 ПОЛУЧЕНИЕ ПРОФИЛЯ
// ======================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Пользователь не найден" }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error("Ошибка получения профиля:", error);
    return NextResponse.json({ message: "Ошибка сервера" }, { status: 500 });
  }
}

// ======================
// ✏️ ОБНОВЛЕНИЕ ПРОФИЛЯ
// ======================
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, middleName, phone, telegram } = body;

    // Простая валидация Telegram
    if (telegram && !telegram.trim().startsWith("@")) {
      return NextResponse.json({ message: "Telegram должен начинаться с @" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        middleName: middleName?.trim(),
        phone: phone?.trim(),
        telegram: telegram?.trim(),
      },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({ message: "Профиль обновлен", user: userWithoutPassword }, { status: 200 });
  } catch (error: any) {
    // Обработка ошибок уникальности от Prisma
    if (error.code === "P2002") {
      const target = error.meta?.target?.[0];
      if (target === "telegram") {
        return NextResponse.json({ message: "Этот Telegram уже привязан к другому аккаунту" }, { status: 400 });
      }
      if (target === "phone") {
        return NextResponse.json({ message: "Этот номер телефона уже зарегистрирован" }, { status: 400 });
      }
    }
    console.error("Ошибка обновления профиля:", error);
    return NextResponse.json({ message: "Ошибка сервера при сохранении" }, { status: 500 });
  }
}
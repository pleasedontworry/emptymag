import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

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
          include: { items: true }, // ВАЖНО: теперь мы получаем товары внутри заказа!
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
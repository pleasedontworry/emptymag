import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Вычисляем дату: 30 дней назад от текущего момента
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Получаем завершенные заказы за последние 30 дней
    const recentOrders = await prisma.order.findMany({
      where: { 
        status: "COMPLETED",
        createdAt: { gte: thirtyDaysAgo } 
      },
      include: { items: true },
    });

    const stats: Record<string, Record<number, number>> = {
      liquids: {},
      pods: {},
      accessories: {},
    };

    for (const order of recentOrders) {
      if (!order.userId) continue;
      for (const item of order.items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId || 0 } });
        if (!product) continue;

        const cat = product.category;
        if (stats[cat]) {
          stats[cat][order.userId] = (stats[cat][order.userId] || 0) + item.quantity;
        }
      }
    }

    const getTop = async (cat: string) => {
      const usersMap = stats[cat] || {};
      const sorted = Object.entries(usersMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return Promise.all(sorted.map(async ([userId, count]) => {
        const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
        return {
          name: user ? `${user.lastName || ""} ${user.firstName || ""}`.trim() || "Пользователь" : "Гость",
          count,
          userId: Number(userId)
        };
      }));
    };

    return NextResponse.json({
      liquids: await getTop("liquids"),
      pods: await getTop("pods"),
      accessories: await getTop("accessories"),
    });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка загрузки лидерборда" }, { status: 500 });
  }
}
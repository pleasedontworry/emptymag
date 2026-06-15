import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Разрешаем принимать статусы в любом регистре от клиента
type InputOrderStatus = "pending" | "confirmed" | "completed" | "cancelled" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

// Строгий тип, который ожидает Prisma
type PrismaOrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // ✅ поддержка и обычного params и Promise params
    const resolvedParams = await context.params;
    const idRaw = resolvedParams?.id;

    const orderId = Number(idRaw);

    if (!idRaw || Number.isNaN(orderId)) {
      return NextResponse.json(
        { error: "Неверный ID заказа" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const rawStatus = body.status as InputOrderStatus;

    if (!rawStatus) {
      return NextResponse.json(
        { error: "Статус обязателен" },
        { status: 400 }
      );
    }

    // Приводим статус к верхнему регистру для сравнения и сохранения в Prisma
    const targetStatus = String(rawStatus).toUpperCase() as PrismaOrderStatus;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Заказ не найден" },
        { status: 404 }
      );
    }

    // Текущий статус в базе данных (он уже в верхнем регистре)
    const currentStatus = String(order.status).toUpperCase() as PrismaOrderStatus;

    // 🔥 возврат товара при отмене
    if (targetStatus === "CANCELLED" && currentStatus !== "CANCELLED") {
      for (const item of order.items) {
        if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }
      
      // Защита: если отменили завершенный заказ, отнимаем сумму из скидки клиента
      if (currentStatus === "COMPLETED" && order.userId) {
        await prisma.user.update({
          where: { id: order.userId },
          data: { totalSpent: { decrement: order.totalPrice } },
        });
      }
    }

    // 🔥 списание при подтверждении
    if (targetStatus === "CONFIRMED" && currentStatus === "PENDING") {
      for (const item of order.items) {
        if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }
    }
    
    // 🔥 НАЧИСЛЕНИЕ СУММЫ ЗАКАЗА В ПРОФИЛЬ КЛИЕНТА (ДЛЯ СКИДКИ)
    if (targetStatus === "COMPLETED" && currentStatus !== "COMPLETED") {
      if (order.userId) {
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            totalSpent: {
              increment: order.totalPrice, 
            },
          },
        });
      }
    }

    // Сохраняем обновленный статус
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: targetStatus },
      include: { items: true },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка обновления заказа",
      },
      { status: 500 }
    );
  }
}
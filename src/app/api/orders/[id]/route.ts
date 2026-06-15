import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminRequest } from "@/lib/is-admin-request";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// Расширяем типы статусов, чтобы принимать и нижний, и верхний регистр
type OrderStatusInput = "pending" | "confirmed" | "completed" | "cancelled" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

type OrderItemWithProductId = {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSlug: string;
  price: number;
  quantity: number;
  image: string;
  createdAt: Date;
};

function parseOrderId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function hasProductId(
  item: {
    id: number;
    orderId: number;
    productId: number | null;
    productName: string;
    productSlug: string;
    price: number;
    quantity: number;
    image: string;
    createdAt: Date;
  }
): item is OrderItemWithProductId {
  return item.productId !== null;
}

// ================= GET =================
export async function GET(request: NextRequest, context: RouteContext) {
  const isAdmin = await isAdminRequest(request);

  if (!isAdmin) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseOrderId(rawId);

  if (!id) {
    return NextResponse.json(
      { error: "Некорректный id заказа" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { id: "asc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return NextResponse.json(order);
}

// ================= PATCH =================
export async function PATCH(request: NextRequest, context: RouteContext) {
  const isAdmin = await isAdminRequest(request);

  if (!isAdmin) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseOrderId(rawId);

  if (!id) {
    return NextResponse.json(
      { error: "Некорректный id заказа" },
      { status: 400 }
    );
  }

  const body = (await request.json()) as {
    status?: OrderStatusInput;
  };

  const nextStatus = body.status;

  if (!nextStatus) {
    return NextResponse.json(
      { error: "Статус не передан" },
      { status: 400 }
    );
  }

  const currentOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!currentOrder) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const stockItems = currentOrder.items.filter(hasProductId);

  try {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Строго типизируем статусы для Prisma
      type PrismaOrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

      // Безопасное приведение статусов
      const currentStatus = String(currentOrder.status).toUpperCase() as PrismaOrderStatus;
      const targetStatus = String(nextStatus).toUpperCase() as PrismaOrderStatus;

      // 1. CONFIRMED → CANCELLED (вернуть stock)
      if (currentStatus === "CONFIRMED" && targetStatus === "CANCELLED") {
        for (const item of stockItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      // 2. PENDING → CONFIRMED (уменьшить stock)
      if (currentStatus === "PENDING" && targetStatus === "CONFIRMED") {
        for (const item of stockItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // 3. ЗАЩИТА ОТ НАКРУТКИ: COMPLETED → CANCELLED (вычитаем сумму из профиля, если отменили завершенный)
      if (currentStatus === "COMPLETED" && targetStatus === "CANCELLED" && currentOrder.userId) {
        await tx.user.update({
          where: { id: currentOrder.userId },
          data: { totalSpent: { decrement: currentOrder.totalPrice } },
        });
      }

      // 4. НАЧИСЛЕНИЕ СУММЫ: любой статус → COMPLETED (добавляем сумму в профиль клиента)
      if (currentStatus !== "COMPLETED" && targetStatus === "COMPLETED" && currentOrder.userId) {
        await tx.user.update({
          where: { id: currentOrder.userId },
          data: { totalSpent: { increment: currentOrder.totalPrice } },
        });
      }

      return tx.order.update({
        where: { id },
        data: {
          status: targetStatus,
        },
        include: {
          items: {
            orderBy: { id: "asc" },
          },
        },
      });
    });

    return NextResponse.json(updatedOrder);

  } catch (error) {
    console.error("PATCH ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось обновить заказ",
      },
      { status: 500 }
    );
  }
}

// ================= DELETE =================
export async function DELETE(request: NextRequest, context: RouteContext) {
  const isAdmin = await isAdminRequest(request);

  if (!isAdmin) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseOrderId(rawId);

  if (!id) {
    return NextResponse.json(
      { error: "Некорректный id заказа" },
      { status: 400 }
    );
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existingOrder) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const stockItems = existingOrder.items.filter(hasProductId);

  try {
    await prisma.$transaction(async (tx) => {

      // Возвращаем stock только если заказ был подтвержден
      const currentStatus = String(existingOrder.status).toUpperCase();
      if (currentStatus === "CONFIRMED") {
        for (const item of stockItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.order.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Заказ удалён",
    });

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось удалить заказ";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
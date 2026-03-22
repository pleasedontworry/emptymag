import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

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
    const { status } = body as { status: OrderStatus };

    if (!status) {
      return NextResponse.json(
        { error: "Статус обязателен" },
        { status: 400 }
      );
    }

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

    // 🔥 возврат товара при отмене
    if (status === "cancelled" && order.status !== "cancelled") {
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
    }

    // 🔥 списание при подтверждении
    if (status === "confirmed" && order.status === "pending") {
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

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
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
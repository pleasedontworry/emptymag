import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // ПРЕОБРАЗУЕМ id в число
    const orderId = Number(id)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Если уже отменён — ничего не делаем
    if (order.status === "CANCELLED") {
      return NextResponse.json({ message: "Order already cancelled" })
    }

    // Возвращаем stock ТОЛЬКО если заказ был confirmed
    if (order.status === "CONFIRMED") {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
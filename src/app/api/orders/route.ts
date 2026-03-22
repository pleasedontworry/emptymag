import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ======================
// 📩 TELEGRAM
// ======================
async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch (error) {
    console.error("Telegram error:", error);
  }
}

// ======================
// 📦 ПОЛУЧЕНИЕ ЗАКАЗОВ (АДМИНКА)
// ======================
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return NextResponse.json(
      { error: "Не удалось загрузить заказы" },
      { status: 500 }
    );
  }
}

// ======================
// 🛒 СОЗДАНИЕ ЗАКАЗА
// ======================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customerName,
      phone,
      telegram,
      comment,
      items,
    } = body;

    if (!customerName || !phone) {
      return NextResponse.json(
        { error: "Заполните имя и телефон" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Корзина пуста" },
        { status: 400 }
      );
    }

    // 🔥 получаем товары из базы
    const productIds = items.map((i: any) => i.productId);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    let totalPrice = 0;
    let totalItems = 0;

    const orderItemsData = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new Error("Товар не найден");
      }

      totalPrice += product.price * item.quantity;
      totalItems += item.quantity;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        telegram,
        comment,
        totalPrice,
        totalItems,
        status: "pending",
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // ======================
    // 📩 TELEGRAM УВЕДОМЛЕНИЕ
    // ======================
    const itemsText = order.items
      .map(
        (item) =>
          `• ${item.productName} × ${item.quantity} — ${item.price * item.quantity} грн`
      )
      .join("\n");

    await sendTelegramMessage(`
🛒 <b>Новый заказ!</b>

👤 <b>Имя:</b> ${order.customerName}
📞 <b>Телефон:</b> ${order.phone}
💬 <b>Telegram клиента:</b> ${order.telegram || "не указан"}

📦 <b>Товары:</b>
${itemsText}

💰 <b>Сумма:</b> ${order.totalPrice} грн

📝 <b>Комментарий:</b>
${order.comment || "нет"}
`);

    return NextResponse.json(order);

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка оформления заказа",
      },
      { status: 500 }
    );
  }
}
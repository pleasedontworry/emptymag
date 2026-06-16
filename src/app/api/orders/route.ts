import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ======================
// 📩 TELEGRAM
// ======================
async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("❌ TELEGRAM ENV НЕ НАЙДЕНЫ");
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML" // Добавили поддержку HTML для жирного текста
        }),
      }
    );

    const data = await res.json();
    console.log("📩 TELEGRAM RESPONSE:", data);
  } catch (error) {
    console.error("❌ TELEGRAM ERROR:", error);
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
        user: true, // Добавлено, чтобы если нужно, подтягивать связь с аккаунтом
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
      userId, 
      firstName, 
      lastName, 
      middleName, 
      phone, 
      telegram, 
      comment, 
      paymentMethod,
      discount,
      items 
    } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "Заполните обязательные поля (Имя, Фамилия, Телефон)" },
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

    let baseTotalPrice = 0;
    let totalItems = 0;

    const orderItemsData = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new Error("Товар не найден");
      }

      baseTotalPrice += product.price * item.quantity;
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

    // Применяем скидку
    const appliedDiscount = discount || 0;
    const discountAmount = Math.floor((baseTotalPrice * appliedDiscount) / 100);
    const finalPrice = baseTotalPrice - discountAmount;

    // Сохраняем в базу данных
    const order = await prisma.order.create({
      data: {
        userId: userId || null,
        firstName,
        lastName,
        middleName,
        phone,
        telegram,
        comment,
        paymentMethod: paymentMethod || "CASH",
        status: "PENDING", // Статус из нашего Enum
        totalPrice: finalPrice, 
        totalItems,
        discount: appliedDiscount,
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
          `• <i>${item.productName}</i> × ${item.quantity} шт. = <b>${item.price * item.quantity} грн</b>`
      )
      .join("\n");

    const paymentText = paymentMethod === "CARD" ? "💳 Перевод на карту" : "💵 Наличные при получении";
    const discountText = appliedDiscount > 0 ? `\n📉 <b>Скидка клиента:</b> ${appliedDiscount}% (-${discountAmount} грн)` : "";

    await sendTelegramMessage(
`🛒 <b>НОВЫЙ ЗАКАЗ #${order.id}</b>

👤 <b>Клиент:</b> ${lastName} ${firstName} ${middleName || ""}
📞 <b>Телефон:</b> ${phone}
💬 <b>Telegram:</b> ${telegram || "не указан"}
💰 <b>Оплата:</b> ${paymentText}${discountText}

📦 <b>Товары:</b>
${itemsText}

💵 <b>ИТОГО К ОПЛАТЕ: ${finalPrice} грн</b>

📝 <b>Комментарий:</b> ${comment || "нет"}`
    );

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
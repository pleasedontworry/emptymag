import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clients = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "Ошибка загрузки клиентов" }, { status: 500 });
  }
}
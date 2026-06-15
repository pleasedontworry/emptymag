import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params;
    const id = Number(resolvedParams?.id);
    if (!id) return NextResponse.json({ error: "Неверный ID" }, { status: 400 });

    const body = await request.json();
    const { firstName, lastName, middleName, phone, email, totalSpent, personalDiscount, newPassword } = body;

    const dataToUpdate: any = {
      firstName,
      lastName,
      middleName, // Добавили Отчество
      phone,
      email,
      totalSpent: Number(totalSpent),
      personalDiscount: Number(personalDiscount), // Добавили Скидку
    };

    if (newPassword && newPassword.trim().length > 0) {
      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Ошибка обновления клиента" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params;
    const id = Number(resolvedParams?.id);
    if (!id) return NextResponse.json({ error: "Неверный ID" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка удаления клиента" }, { status: 500 });
  }
}
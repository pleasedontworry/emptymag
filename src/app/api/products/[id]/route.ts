import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/data/products";
import type { ProductCategory } from "@/data/products";
import { isAdminRequest } from "@/lib/is-admin-request";

type Params = {
  params: Promise<{ id: string }>;
};

function normalizeCategory(category: unknown): ProductCategory {
  if (
    category === "liquids" ||
    category === "pods" ||
    category === "disposables" ||
    category === "accessories"
  ) {
    return category;
  }

  return "liquids";
}

async function ensureUniqueSlug(slug: string, currentId: number) {
  const baseSlug = slugify(slug) || "product";
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
    });

    if (!existing || existing.id === currentId) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const isAdmin = await isAdminRequest(request);

    if (!isAdmin) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const { id } = await params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Некорректный id" }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: numericId },
    });

    if (!existingProduct) {
      return NextResponse.json({ message: "Товар не найден" }, { status: 404 });
    }

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const image = String(body.image ?? "").trim();
    const description = String(body.description ?? "").trim();
    const price = Number(body.price);
    const stock = Number(body.stock);
    const category = normalizeCategory(body.category);

    if (
      !name ||
      !image ||
      !description ||
      Number.isNaN(price) ||
      Number.isNaN(stock) ||
      price <= 0 ||
      stock < 0
    ) {
      return NextResponse.json(
        { message: "Некорректные данные товара" },
        { status: 400 }
      );
    }

    const uniqueSlug = await ensureUniqueSlug(String(body.slug || name), numericId);

    const product = await prisma.product.update({
      where: { id: numericId },
      data: {
        name,
        slug: uniqueSlug,
        image,
        description,
        price,
        stock,
        category,
        isActive: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);

    return NextResponse.json(
      { message: "Не удалось обновить товар" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const isAdmin = await isAdminRequest(request);

    if (!isAdmin) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const { id } = await params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Некорректный id" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id: numericId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);

    return NextResponse.json(
      { message: "Не удалось удалить товар" },
      { status: 500 }
    );
  }
}
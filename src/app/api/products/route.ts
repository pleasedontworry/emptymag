export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminRequest } from "@/lib/is-admin-request";
import { slugify } from "@/data/products";
import type { ProductCategory } from "@/data/products";

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

function normalizeLiquidBrand(brand: unknown): "Chaser" | "ElfLiq" | "Lucky" | null {
  if (brand === "Chaser" || brand === "ElfLiq" || brand === "Lucky") {
    return brand;
  }

  return null;
}

async function ensureUniqueSlug(slug: string) {
  const baseSlug = slugify(slug) || "product";
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAdminRequest(request);

    const products = await prisma.product.findMany({
      where: isAdmin
        ? undefined
        : {
            isActive: true,
          },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      { error: "Не удалось загрузить товары" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminRequest(request);

    if (!isAdmin) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const body = await request.json();

    const name = String(body?.name ?? "").trim();
    const image = String(body?.image ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const price = Number(body?.price);
    const stock = Number(body?.stock);
    const category = normalizeCategory(body?.category);
    const liquidBrand = normalizeLiquidBrand(body?.liquidBrand);
    
    // Получаем значение Красной цены
    const isRedPrice = Boolean(body?.isRedPrice);

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

    const uniqueSlug = await ensureUniqueSlug(String(body?.slug || name));

    const product = await prisma.product.create({
      data: {
        name,
        slug: uniqueSlug,
        price,
        image,
        description,
        stock,
        category,
        liquidBrand, 
        isRedPrice, // 👈 ДОБАВИЛИ СОХРАНЕНИЕ КРАСНОЙ ЦЕНЫ
        isActive: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);

    return NextResponse.json(
      { message: "Не удалось создать товар" },
      { status: 500 }
    );
  }
}
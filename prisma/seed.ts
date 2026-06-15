import { PrismaClient } from "@prisma/client";
import { defaultProducts } from "../src/data/products";

const prisma = new PrismaClient();

async function main() {
  for (const product of defaultProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description,
        stock: product.stock,
        isActive: product.isActive,
        category: product.category,
      },
      create: {
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image,
        description: product.description,
        stock: product.stock,
        isActive: product.isActive,
        category: product.category,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
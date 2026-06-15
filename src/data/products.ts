export type ProductCategory =
  | "liquids"
  | "pods"
  | "disposables"
  | "accessories";

export type LiquidBrand = "Chase" | "ElfLiq" | "Lucky";

export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  isActive: boolean;
  category: ProductCategory;
  liquidBrand?: LiquidBrand;
};

export const categoryLabels: Record<ProductCategory, string> = {
  liquids: "Жидкости",
  pods: "Pod-системы",
  disposables: "Одноразки",
  accessories: "Аксессуары",
};

export const categoryOptions: ProductCategory[] = [
  "liquids",
  "pods",
  "disposables",
  "accessories",
];

export const liquidBrandLabels: Record<LiquidBrand, string> = {
  Chase: "Chase",
  ElfLiq: "ElfLiq",
  Lucky: "Lucky",
};

export const liquidBrandOptions: LiquidBrand[] = ["Chase", "ElfLiq", "Lucky"];

export function slugify(value: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ye",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "yi",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ь: "",
    ю: "yu",
    я: "ya",
    ы: "y",
    э: "e",
    ё: "yo",
    ъ: "",
    "'": "",
    "’": "",
    "`": "",
  };

  return value
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export const defaultProducts: StoreProduct[] = [
  {
    id: 1,
    name: "М'ята 30/65",
    slug: "myata-30-65",
    price: 265,
    image: "https://mpvape.shop/files/resized/products/myata.800x600w.jpg",
    description: "Освіжаючий смак м'яти.",
    stock: 12,
    isActive: true,
    category: "liquids",
    liquidBrand: "Chase",
  },
  {
    id: 2,
    name: "Блакитна малина 30/65",
    slug: "blakytna-malyna-30-65",
    price: 265,
    image: "https://mpvape.shop/files/resized/products/blakitna-malina.800x600w.jpg",
    description: "Солодкий смак блакитної малини.",
    stock: 8,
    isActive: true,
    category: "liquids",
    liquidBrand: "ElfLiq",
  },
  {
    id: 3,
    name: "Ківі полуниця 30/65",
    slug: "kivi-polunytsia-30-65",
    price: 265,
    image: "https://mpvape.shop/files/resized/products/kivi-polunitsya.800x600w.jpg",
    description: "Поєднання ківі та полуниці.",
    stock: 0,
    isActive: true,
    category: "liquids",
    liquidBrand: "Lucky",
  },
];
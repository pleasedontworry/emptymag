import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";

import { ProductProvider } from "@/context/ProductContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "emptymag",
  description: "emptymag store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <ProductProvider>
          <CartProvider>

            <Header />

            {children}

            <Toaster
              position="top-center"
              richColors
              closeButton
            />

          </CartProvider>
        </ProductProvider>
      </body>
    </html>
  );
}
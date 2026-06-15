import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";

import { ProductProvider } from "@/context/ProductContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
// Импортируем наш AuthProvider
import AuthProvider from "@/components/AuthProvider";

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
        {/* Оборачиваем всё приложение в AuthProvider */}
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  );
}
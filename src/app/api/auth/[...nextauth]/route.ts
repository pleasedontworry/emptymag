import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email или Telegram (@)", type: "text" }, // Изменили type на text
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Пожалуйста, введите логин и пароль");
        }

        const loginInput = credentials.email.trim();
        const isTelegram = loginInput.startsWith("@");

        // Ищем пользователя по email ИЛИ по telegram
        const user = await prisma.user.findFirst({
          where: isTelegram ? { telegram: loginInput } : { email: loginInput },
        });

        if (!user) {
          throw new Error("Пользователь не найден");
        }

        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("Неверный пароль");
        }

        // Возвращаем данные, которые сохранятся в сессии
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.firstName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
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
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Пожалуйста, введите email и пароль");
        }

        // Ищем пользователя в БД
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error("Пользователь не найден");
        }

        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Неверный пароль");
        }

        // Возвращаем данные, которые сохранятся в сессии
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.firstName,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Добавляем ID пользователя в токен
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Передаем ID из токена в саму сессию, чтобы использовать на клиенте
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore - игнорируем ошибку TS, так как мы расширяем стандартный тип сессии
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Указываем кастомную страницу входа (создадим ее следующим шагом)
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
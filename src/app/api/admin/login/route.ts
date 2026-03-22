import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminCookieName,
  getAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const login = String(body?.login ?? "").trim();
    const password = String(body?.password ?? "").trim();

    const admin = getAdminCredentials();

    if (login !== admin.login || password !== admin.password) {
      return NextResponse.json(
        { error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken(login);

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: getAdminCookieName(),
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("POST /api/admin/login error:", error);

    return NextResponse.json(
      { error: "Не удалось выполнить вход" },
      { status: 500 }
    );
  }
}
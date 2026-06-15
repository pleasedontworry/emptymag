import { NextResponse } from "next/server";
import { getAdminCookieName } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );

  response.cookies.set({
    name: getAdminCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
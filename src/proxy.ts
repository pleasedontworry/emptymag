import { NextRequest, NextResponse } from "next/server";
import {
  getAdminCookieName,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

const ADMIN_PATH = "/cohveemptyrazrab777";
const ADMIN_LOGIN_PATH = "/cohveemptyrazrab777/login";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isAdminRoot = pathname === ADMIN_PATH;
  const isAdminNested = pathname.startsWith(`${ADMIN_PATH}/`);
  const isAdminRoute = isAdminRoot || isAdminNested;
  const isAdminLoginRoute = pathname === ADMIN_LOGIN_PATH;

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const cookieName = getAdminCookieName();
  const token = request.cookies.get(cookieName)?.value;
  const isAuthenticated = await verifyAdminSessionToken(token);

  if (isAdminLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(ADMIN_PATH, request.url));
  }

  if (!isAdminLoginRoute && !isAuthenticated) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", `${pathname}${search}`);

    const response = NextResponse.redirect(loginUrl);

    if (token) {
      response.cookies.set({
        name: cookieName,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(0),
      });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cohveemptyrazrab777", "/cohveemptyrazrab777/:path*"],
};
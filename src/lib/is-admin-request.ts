import { NextRequest } from "next/server";
import {
  getAdminCookieName,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export async function isAdminRequest(request: NextRequest) {
  try {
    const cookieName = getAdminCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return false;
    }

    return await verifyAdminSessionToken(token);
  } catch (error) {
    console.error("isAdminRequest error:", error);
    return false;
  }
}
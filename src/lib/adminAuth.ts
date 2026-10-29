import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  SESSION_DURATION,
  verifySessionToken,
} from "./adminAuthCore";

export * from "./adminAuthCore";

export async function isAuthenticatedServer(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return await verifySessionToken(token);
  } catch {
    return false;
  }
}

export function isRequestAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

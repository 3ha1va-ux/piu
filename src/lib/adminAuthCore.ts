import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE_NAME = "admin_session";
export const SESSION_DURATION = 60 * 60 * 24; // 24 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET || "piu-ge-super-secret-key-change-in-production-min32chars";
  return new TextEncoder().encode(secret);
}

export function checkAdminCredentials(user: string, pass: string): boolean {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "piu2026";

  if (!user || !pass) return false;
  return user === expectedUser && pass === expectedPass;
}

export async function createSessionToken(username: string): Promise<string> {
  const secretKey = getSecretKey();
  return await new SignJWT({ user: username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secretKey);
}

export async function verifySessionToken(token?: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

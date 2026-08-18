import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-replace-me"
);
const COOKIE_NAME = "raiz_session";
const EXPIRY = "7d";

export type TokenPayload = { sub: string; email: string; role: string };

/**
 * Create a signed JWT for a user (includes role).
 */
export async function createToken(userId: string, email: string, role: string) {
  return new SignJWT({ sub: userId, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(EXPIRY)
    .setIssuedAt()
    .sign(SECRET);
}

/**
 * Verify a JWT and return the payload, or null.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Get the full user info from the session cookie.
 */
export async function getUserFromToken(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Get the current admin email from the session cookie.
 * Returns null if not authenticated.
 */
export async function adminEmail(): Promise<string | null> {
  const payload = await getUserFromToken();
  return payload?.email || null;
}

/**
 * Require that the logged-in user has one of the allowed roles.
 * Returns the token payload if authorized, or null if not.
 */
export async function requireRole(
  allowed: string[]
): Promise<TokenPayload | null> {
  const payload = await getUserFromToken();
  if (!payload) return null;
  if (!allowed.includes(payload.role)) return null;
  return payload;
}

/**
 * Set the session cookie after login.
 */
export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear the session cookie.
 */
export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Authenticate a user by email and password.
 * Returns {id, email, role} or null.
 */
export async function authenticate(email: string, password: string) {
  const result = await db.execute({
    sql: "SELECT id, email, password_hash, role FROM users WHERE email = ? COLLATE NOCASE",
    args: [email],
  });

  const user = result.rows[0];
  if (!user) return null;

  const valid = await bcrypt.compare(password, String(user.password_hash));
  if (!valid) return null;

  return {
    id: String(user.id),
    email: String(user.email),
    role: String(user.role),
  };
}

/**
 * Hash a password for storage.
 */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

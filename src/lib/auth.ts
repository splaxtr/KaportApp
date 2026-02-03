import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const DEFAULT_JWT_SECRET = "CHANGE_THIS_SECRET_IN_PRODUCTION_MIN_32_CHARS!";

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!raw || raw === DEFAULT_JWT_SECRET) {
      throw new Error("JWT_SECRET must be set to a secure value in production.");
    }
  }
  return new TextEncoder().encode(raw || DEFAULT_JWT_SECRET);
}

const JWT_SECRET = getJwtSecret();

const COOKIE_NAME = "kaporta_auth";
const TOKEN_EXPIRY = "8h";

export interface AuthPayload extends JWTPayload {
  id: number;
  email: string;
  role: string;
  fullName: string;
}

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  fullName: string;
}

// JWT Token oluştur
export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

// JWT Token doğrula
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

// Cookie'den kullanıcı bilgisi al (Server Actions için)
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    fullName: payload.fullName,
  };
}

// Request'ten kullanıcı bilgisi al (API Routes için)
export async function getAuthUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    fullName: payload.fullName,
  };
}

// Auth cookie ayarla
export async function setAuthCookie(user: AuthUser): Promise<void> {
  const token = await createToken(user);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 saat
  });
}

// Auth cookie sil
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Rol kontrolü
export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

// Admin kontrolü
export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, ["system_admin", "admin"]);
}

// System admin kontrolü
export function isSystemAdmin(user: AuthUser | null): boolean {
  return hasRole(user, ["system_admin"]);
}

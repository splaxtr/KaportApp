import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

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

const PUBLIC_PATHS = ["/", "/login", "/api-docs"];
const PUBLIC_API_PATHS = ["/api/auth/login", "/api/review-links/view", "/api/openapi", "/api/health"];

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets - her zaman izin ver
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public review sayfaları
  if (pathname.startsWith("/review")) {
    return NextResponse.next();
  }

  // Public API endpoints
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Public sayfalar
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Auth kontrolü
  const token = req.cookies.get("kaporta_auth")?.value;

  if (!token) {
    // API istekleri için 401 döndür
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }
    // Sayfa istekleri için login'e yönlendir
    return NextResponse.redirect(new URL("/", req.url));
  }

  // JWT doğrulama
  const payload = await verifyToken(token);

  if (!payload) {
    // Geçersiz token - cookie'yi sil ve yönlendir
    const response = pathname.startsWith("/api")
      ? NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 })
      : NextResponse.redirect(new URL("/", req.url));

    response.cookies.delete("kaporta_auth");
    return response;
  }

  const role = payload.role as string;

  // Admin-only API endpoints
  const adminOnlyApis = ["/api/users", "/api/roles"];
  if (
    adminOnlyApis.some((p) => pathname.startsWith(p)) &&
    !["system_admin", "admin"].includes(role)
  ) {
    return NextResponse.json(
      { error: "Bu işlem için admin yetkisi gerekiyor." },
      { status: 403 }
    );
  }

  // Employee ayarlar sayfasına giremesin
  if (role === "employee" && pathname.startsWith("/settings")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Kullanıcı bilgisini header'a ekle (API'lerde kullanmak için)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", String(payload.id));
  requestHeaders.set("x-user-role", role);
  requestHeaders.set("x-user-email", payload.email as string);

  // Nonce tabanlı CSP üret (Web Crypto API - Edge uyumlu)
  const nonceBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  requestHeaders.set("x-csp-nonce", nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Security headers (ek koruma - Traefik'e ek olarak)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // Nonce-based CSP - /api-docs için Swagger UI inline style istisnası
  const isApiDocs = pathname.startsWith("/api-docs");
  const scriptSrc = isApiDocs
    ? `'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'unsafe-inline'`;
  const styleSrc = isApiDocs
    ? `'self' 'unsafe-inline'`
    : `'self' 'nonce-${nonce}' 'unsafe-inline'`;

  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src ${scriptSrc}; style-src ${styleSrc}; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'`
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/image|_next/static|favicon.ico).*)"],
};

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow review links and public assets/APIs
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/review") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const auth = req.cookies.get("kaporta_auth");
  if (!auth) {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }

  let role: string | null = null;
  try {
    role = JSON.parse(auth.value)?.role ?? null;
  } catch {
    role = null;
  }

  // Employee rolü ayarlar sayfasına giremesin
  if (role === "employee" && pathname.startsWith("/settings")) {
    const url = new URL("/dashboard", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/image|_next/static|favicon.ico).*)"],
};

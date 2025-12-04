import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/not-authorized", "/_next", "/api"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;

  if (!token || !role) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const allow = (target: "admin" | "owner" | "employee") => {
    if (target === "admin") return role === "admin";
    if (target === "owner") return role === "owner" || role === "admin";
    return role === "employee" || role === "owner" || role === "admin";
  };

  if (pathname.startsWith("/admin") && !allow("admin")) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }
  if (pathname.startsWith("/owner") && !allow("owner")) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }
  if (pathname.startsWith("/employee") && !allow("employee")) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

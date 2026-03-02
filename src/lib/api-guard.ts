import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest, AuthUser, isAdmin, isSystemAdmin } from "./auth";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { logger } from "@/lib/logger";

type ApiHandler<T = unknown> = (
  req: NextRequest,
  context: { params: Promise<T>; user: AuthUser }
) => Promise<NextResponse>;

type GuardOptions = {
  requireAdmin?: boolean;
  requireSystemAdmin?: boolean;
  allowedRoles?: string[];
  requiredPermissions?: string[];
};

// Rate limiting için basit in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const TRUST_PROXY = process.env.TRUST_PROXY === "true";

function getClientIp(req: NextRequest): string {
  if (TRUST_PROXY) {
    const forwarded = req.headers.get("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function getRateLimitKey(req: NextRequest): string {
  const ip = getClientIp(req);
  return `${ip}:${req.nextUrl.pathname}`;
}

async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const redis = await getRedis();
  if (redis) {
    const redisKey = `rl:${windowMs}:${key}`;
    try {
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pExpire(redisKey, windowMs);
      }
      return count <= limit;
    } catch (error) {
      logger.error("Redis rate limit error", error as Error);
    }
  }

  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Periyodik temizlik (memory leak önleme)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Her dakika temizle

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  const candidate = origin || referer;
  // Origin ve Referer header'ları yoksa state-changing istekleri reddet
  if (!candidate) return false;

  try {
    const url = new URL(candidate);

    // 1) NEXT_PUBLIC_APP_URL varsa (production/Docker), onu kullan
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const expected = new URL(appUrl);
      return url.origin === expected.origin;
    }

    // 2) Host header ile karşılaştır (reverse proxy arkasında daha güvenilir)
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) {
      // host "example.com" veya "example.com:3000" formatında olabilir
      return url.host === host;
    }

    // 3) Fallback: nextUrl.origin (sadece dev ortamında güvenilir)
    return url.origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

function shouldEnforceCsrf(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

export function withAuth<T = unknown>(
  handler: ApiHandler<T>,
  options: GuardOptions = {}
) {
  return async (req: NextRequest, context: { params: Promise<T> }): Promise<NextResponse> => {
    if (shouldEnforceCsrf(req) && !isSameOrigin(req)) {
      return NextResponse.json(
        { error: "Geçersiz istek kaynağı." },
        { status: 403 }
      );
    }
    // Rate limiting (dakikada 60 istek)
    const rateLimitKey = getRateLimitKey(req);
    if (!(await checkRateLimit(rateLimitKey, 60, 60000))) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    // Auth kontrolü
    const user = await getAuthUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    // Rol kontrolü
    if (options.requireSystemAdmin && !isSystemAdmin(user)) {
      return NextResponse.json(
        { error: "Bu işlem için system admin yetkisi gerekiyor." },
        { status: 403 }
      );
    }

    if (options.requireAdmin && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Bu işlem için admin yetkisi gerekiyor." },
        { status: 403 }
      );
    }

    if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 403 }
      );
    }

    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      if (user.role !== "system_admin") {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
            permissions: { include: { permission: true } },
          },
        });

        const permissionKeys = new Set<string>();
        dbUser?.role?.permissions.forEach((rp: { permission: { key: string } }) => permissionKeys.add(rp.permission.key));
        dbUser?.permissions.forEach((up: { permission: { key: string } }) => permissionKeys.add(up.permission.key));

        const hasAll = options.requiredPermissions.every((p) => permissionKeys.has(p));
        if (!hasAll) {
          return NextResponse.json(
            { error: "Bu işlem için yetkiniz yok." },
            { status: 403 }
          );
        }
      }
    }

    // Handler'ı çalıştır
    return handler(req, { ...context, user });
  };
}

// Login endpoint için özel rate limiter (daha sıkı) + CSRF koruması
export function withLoginRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Login endpoint'ine de CSRF koruması uygula
    if (shouldEnforceCsrf(req) && !isSameOrigin(req)) {
      return NextResponse.json(
        { error: "Geçersiz istek kaynağı." },
        { status: 403 }
      );
    }

    const rateLimitKey = getRateLimitKey(req) + ":login";

    // Login için dakikada 5 deneme
    if (!(await checkRateLimit(rateLimitKey, 5, 60000))) {
      return NextResponse.json(
        { error: "Çok fazla giriş denemesi. 1 dakika bekleyin." },
        { status: 429 }
      );
    }

    return handler(req);
  };
}

// Public endpoint için sadece rate limiting
export function withRateLimit(
  handler: (req: NextRequest, context: { params: Promise<unknown> }) => Promise<NextResponse>,
  limit: number = 60,
  windowMs: number = 60000
) {
  return async (req: NextRequest, context: { params: Promise<unknown> }): Promise<NextResponse> => {
    const rateLimitKey = getRateLimitKey(req);

    if (!(await checkRateLimit(rateLimitKey, limit, windowMs))) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    return handler(req, context);
  };
}

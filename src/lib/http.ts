import { NextResponse } from "next/server";

type JsonValue = string | number | boolean | null | Date | JsonValue[] | { [key: string]: JsonValue };

export function json(data: Record<string, JsonValue> | JsonValue, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Yetkisiz erişim") {
  return json({ error: message }, { status: 401 });
}

export function notFound(message = "Kayıt bulunamadı") {
  return json({ error: message }, { status: 404 });
}

export function serverError(message = "Sunucu hatası oluştu. Lütfen tekrar deneyin.") {
  return json({ error: message }, { status: 500 });
}

/**
 * Hatayı sınıflandırıp kullanıcıya anlamlı mesaj döner.
 * Tüm API catch bloklarında `return handleApiError(error, logger, context)` şeklinde kullanılır.
 */
export function handleApiError(
  error: unknown,
  loggerFn: (msg: string, err: Error, ctx?: Record<string, unknown>) => void,
  context: { path: string; method: string; [key: string]: unknown }
): ReturnType<typeof serverError> {
  const err = error instanceof Error ? error : new Error(String(error));
  const msg = err.message || "";
  const name = err.name || "";

  loggerFn(`${context.method} ${context.path} error`, err, context);

  // Veritabanı hataları
  if (name.includes("PrismaClient") || msg.includes("prisma")) {
    if (msg.includes("Authentication failed")) {
      return serverError("Veritabanı kimlik doğrulama hatası. Sistem yöneticisine başvurun.");
    }
    if (msg.includes("connect") || msg.includes("Connection") || msg.includes("timeout") || msg.includes("Timed out")) {
      return serverError("Veritabanına bağlanılamadı. Lütfen birkaç dakika sonra tekrar deneyin.");
    }
    if (msg.includes("Unique constraint")) {
      return badRequest("Bu kayıt zaten mevcut.");
    }
    if (msg.includes("Foreign key constraint")) {
      return badRequest("İlişkili kayıt bulunamadı.");
    }
    if (msg.includes("Record to") && msg.includes("not found")) {
      return notFound("İşlem yapılacak kayıt bulunamadı.");
    }
    return serverError("Veritabanı hatası oluştu. Lütfen tekrar deneyin.");
  }

  // Redis hataları
  if (msg.includes("Redis") || msg.includes("redis") || msg.includes("ECONNREFUSED")) {
    return serverError("Önbellek servisi geçici olarak kullanılamıyor. Lütfen tekrar deneyin.");
  }

  // Dosya sistemi hataları
  if (msg.includes("ENOENT") || msg.includes("EACCES")) {
    return serverError("Dosya işlemi hatası. Sistem yöneticisine başvurun.");
  }

  return serverError();
}

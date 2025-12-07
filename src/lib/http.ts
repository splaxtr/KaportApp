import { NextResponse } from "next/server";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

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

export function serverError(message = "Beklenmeyen bir hata oluştu") {
  return json({ error: message }, { status: 500 });
}

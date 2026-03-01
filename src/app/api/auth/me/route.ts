import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  const email = req.headers.get("x-user-email");

  if (!userId || !role) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  return NextResponse.json({ id: Number(userId), role, email });
}

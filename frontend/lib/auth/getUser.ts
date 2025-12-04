import { cookies } from "next/headers";

type Decoded = {
  role?: string;
  shopId?: string | null;
  sub?: string;
};

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const roleCookie = cookieStore.get("role")?.value;
  const shopCookie = cookieStore.get("shopId")?.value;

  let decoded: Decoded = {};
  if (token) {
    try {
      const payload = token.split(".")[1];
      const json = Buffer.from(payload, "base64").toString("utf-8");
      decoded = JSON.parse(json);
    } catch {
      decoded = {};
    }
  }

  const role = roleCookie || decoded.role || decoded["role"];
  const shopId = shopCookie || decoded.shopId || null;
  const userId = decoded.sub;

  return { token, role, shopId, userId };
}

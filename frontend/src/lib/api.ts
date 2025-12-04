const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    shopId?: string | null;
  };
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error("E-posta veya şifre hatalı");
    }
    throw new Error(body?.message || "Giriş başarısız");
  }

  return res.json();
}

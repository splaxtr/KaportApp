const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

async function fetchWithAuth<T>(path: string, token: string, options: RequestInit = {}, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      if (fallback !== undefined) return fallback;
      throw new Error(`Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

export type ShopRow = {
  id: string;
  name: string;
  owner?: { id: string; name?: string; email: string } | null;
  usersCount?: number;
  vehiclesCount?: number;
  status?: "active" | "passive";
};

export type CreateShopDto = {
  name: string;
  ownerId: string;
  status: "active" | "passive";
};

export type UpdateShopDto = Partial<CreateShopDto>;

export type UserOption = { id: string; name?: string; email: string; role?: string };

export function getShops(token: string) {
  return fetchWithAuth<ShopRow[]>("/admin/shops", token, {}, []);
}

export function getShop(id: string, token: string) {
  return fetchWithAuth<ShopRow>(`/admin/shops/${id}`, token);
}

export function getUsers(token: string) {
  return fetchWithAuth<UserOption[]>("/admin/users", token, {}, []);
}

export function assignShopUsers(id: string, userIds: string[], token: string) {
  return fetchWithAuth<{ success: boolean }>(`/admin/shops/${id}/assign-users`, token, {
    method: "POST",
    body: JSON.stringify({ userIds }),
  });
}

export function createShop(data: CreateShopDto, token: string) {
  return fetchWithAuth<ShopRow>("/admin/shops", token, { method: "POST", body: JSON.stringify(data) });
}

export function updateShop(id: string, data: UpdateShopDto, token: string) {
  return fetchWithAuth<ShopRow>(`/admin/shops/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

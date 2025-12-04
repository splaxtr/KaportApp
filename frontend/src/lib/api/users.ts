const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type FetchOptions = RequestInit & { fallback?: any };

async function fetchWithAuth<T>(path: string, token: string, options: FetchOptions = {}): Promise<T> {
  const { fallback, ...rest } = options;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(rest.headers || {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      if (fallback !== undefined) return fallback as T;
      throw new Error(`Request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (fallback !== undefined) return fallback as T;
    throw err;
  }
}

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "owner" | "employee";
  shop?: { id: string; name: string } | null;
  status?: "active" | "passive";
  createdAt?: string;
  lastLogin?: string | null;
};

export type CreateUserDto = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "owner" | "employee";
  shopId?: string;
};

export type UpdateUserDto = Partial<Omit<CreateUserDto, "password">> & {
  status?: "active" | "passive";
  password?: string;
};

export function getUsers(token: string) {
  return fetchWithAuth<UserRow[]>("/admin/users", token, { fallback: [] });
}

export function createUser(data: CreateUserDto, token: string) {
  return fetchWithAuth<UserRow>("/admin/users", token, { method: "POST", body: JSON.stringify(data) });
}

export function getUserDetail(id: string, token: string) {
  return fetchWithAuth<UserRow>(`/admin/users/${id}`, token);
}

export function updateUser(id: string, data: UpdateUserDto, token: string) {
  return fetchWithAuth<UserRow>(`/admin/users/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteUser(id: string, token: string) {
  return fetchWithAuth<{ success: boolean }>(`/admin/users/${id}`, token, { method: "DELETE" });
}

export function changeUserRole(id: string, role: "admin" | "owner" | "employee", token: string) {
  return fetchWithAuth<UserRow>(`/admin/users/${id}/role`, token, { method: "POST", body: JSON.stringify({ role }) });
}

export function assignUserShop(id: string, shopId: string | null, token: string) {
  return fetchWithAuth<UserRow>(`/admin/users/${id}/shop`, token, { method: "POST", body: JSON.stringify({ shopId }) });
}

export function getUserActivity(id: string, token: string) {
  return fetchWithAuth<{ id: string; message: string; createdAt: string }[]>(
    `/admin/users/${id}/activity`,
    token,
    { fallback: [] }
  );
}

// current user helper
export function getMe(userId: string, token: string) {
  return getUserDetail(userId, token);
}

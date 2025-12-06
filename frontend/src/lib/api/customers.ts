const defaultBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || defaultBase;

type FetchOptions = RequestInit & { fallback?: any };

async function fetchWithAuth<T>(path: string, token: string, options: FetchOptions = {}): Promise<T> {
  const { fallback, ...rest } = options;
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...(rest.headers as Record<string, string> | undefined),
    };
    if (!(rest.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${API_BASE}${path}`, { ...rest, headers, cache: "no-store" });
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

export type CustomerRow = { id: string; name: string; phone?: string | null; email?: string | null; tcVkn?: string | null };

export function getCustomers(token: string) {
  return fetchWithAuth<CustomerRow[]>("/customers", token, { fallback: [] });
}

export function createCustomer(
  data: Partial<CustomerRow> & { name: string },
  token: string
) {
  return fetchWithAuth<CustomerRow>("/customers", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCustomer(id: string, data: Partial<CustomerRow>, token: string) {
  return fetchWithAuth<CustomerRow>(`/customers/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCustomer(id: string, token: string) {
  return fetchWithAuth<{ success: boolean }>(`/customers/${id}`, token, { method: "DELETE" });
}

const defaultBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || defaultBase;

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

export type PartRow = {
  id: string;
  name: string;
  statusKey: string;
  quantity?: number;
  position?: string | null;
  caseId?: string | null;
  updatedAt?: string;
};

export function getCaseParts(caseId: string, token: string) {
  return fetchWithAuth<PartRow[]>(`/parts?caseId=${caseId}`, token, { fallback: [] });
}

export function addCasePart(caseId: string, shopId: string, data: any, token: string) {
  return fetchWithAuth<PartRow>("/parts", token, { method: "POST", body: JSON.stringify({ ...data, caseId, shopId }) });
}

export function updatePart(partId: string, data: any, token: string) {
  return fetchWithAuth<PartRow>(`/parts/${partId}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export function deletePart(partId: string, token: string) {
  return fetchWithAuth<{ success: boolean }>(`/parts/${partId}`, token, { method: "DELETE" });
}

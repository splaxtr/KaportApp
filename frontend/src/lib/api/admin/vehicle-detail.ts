const defaultBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || defaultBase;

export type VehicleDetail = {
  id: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  currentOwnerId?: string | null;
  createdAt?: string | null;
  cases?: {
    id: string;
    caseNumber?: string | null;
    damageDate?: string | null;
    status?: string | null;
    createdAt?: string | null;
  }[];
};

type CasePayload = {
  ownerId: string;
  caseNumber?: string;
  damageDate?: string;
  expertName?: string;
  phone?: string;
  tcVkn?: string;
  notes?: string;
};

async function fetchWithAuth<T>(path: string, token: string, opts: RequestInit = {}, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      if (fallback !== undefined) return fallback as T;
      throw new Error(`Request failed: ${res.status}`);
    }
    if (res.status === 204) return {} as T;
    return (await res.json()) as T;
  } catch (err) {
    if (fallback !== undefined) return fallback as T;
    throw err;
  }
}

export function getAdminVehicleDetail(id: string, token: string) {
  return fetchWithAuth<VehicleDetail>(`/admin/vehicles/${id}`, token);
}

export function createVehicleCase(vehicleId: string, payload: CasePayload, token: string) {
  return fetchWithAuth(`/vehicles/${vehicleId}/cases`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

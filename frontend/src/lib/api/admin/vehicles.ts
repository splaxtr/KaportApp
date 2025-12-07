import { VehicleRow } from "@/lib/api/vehicles";

const defaultBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || defaultBase;

export type VehicleListItem = VehicleRow;

export type VehicleListParams = {
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  shopId?: string;
};

async function fetchWithAuth<T>(path: string, token: string, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
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

export async function getAdminVehicles(token: string, filters: VehicleListParams = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
  });
  const qs = params.toString();
  return fetchWithAuth<VehicleListItem[]>(`/admin/vehicles${qs ? `?${qs}` : ""}`, token, []);
}

export type CreateVehiclePayload = {
  shopId: string;
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
  ownerId: string;
  caseNumber?: string;
  damageDate?: string;
  expertName?: string;
  phone?: string;
  tcVkn?: string;
  notes?: string;
};

export async function createVehicleAdmin(payload: CreateVehiclePayload, token: string) {
  const res = await fetch(`${API_BASE}/vehicles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

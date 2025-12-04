const defaultBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || defaultBase;

type FetchOptions = RequestInit & { fallback?: any };

async function fetchWithAuth<T>(path: string, token: string, options: FetchOptions = {}): Promise<T> {
  const { fallback, ...rest } = options;
  try {
    const isForm = rest.body instanceof FormData;
    const baseHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...(rest.headers as Record<string, string> | undefined),
    };
    if (!isForm) {
      baseHeaders["Content-Type"] = "application/json";
    }
    const res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: baseHeaders,
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

export type OwnerHistoryRow = {
  id: string;
  ownerId: string;
  assignedAt: string;
  releasedAt?: string | null;
  owner?: { id: string; name?: string | null; email?: string | null };
};

export type VehicleRow = {
  id: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  package?: string | null;
  currentOwnerId?: string | null;
  currentOwner?: { id: string; name?: string | null; email?: string | null; phone?: string | null } | null;
  shop?: { id: string; name: string } | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { parts?: number; photos?: number; cases?: number };
  ownerHistory?: OwnerHistoryRow[];
  cases?: {
    id: string;
    caseNumber?: string | null;
    damageDate?: string | null;
    createdAt?: string;
    owner?: { id: string; name?: string | null; phone?: string | null };
  }[];
};

export type VehicleFilters = {
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  status?: string;
  shopId?: string;
  package?: string;
  ownerId?: string;
  includeHistory?: boolean;
};

export function getVehicles(token: string, filters: VehicleFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
  });
  const qs = params.toString();
  return fetchWithAuth<VehicleRow[]>(`/admin/vehicles${qs ? `?${qs}` : ""}`, token, { fallback: [] });
}

export function searchVehicles(params: VehicleFilters, token: string) {
  return getVehicles(token, params);
}

export function editVehicle(id: string, data: Partial<VehicleRow & { shopId?: string }>, token: string) {
  return fetchWithAuth<VehicleRow>(`/admin/vehicles/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteVehicle(id: string, token: string) {
  return fetchWithAuth<{ success: boolean }>(`/admin/vehicles/${id}`, token, { method: "DELETE" });
}

export function getVehicle(id: string, token: string, includeHistory = false) {
  const qs = includeHistory ? "?includeHistory=true" : "";
  return fetchWithAuth<VehicleRow>(`/admin/vehicles/${id}${qs}`, token);
}

export function getVehicleActivity(id: string, token: string) {
  return fetchWithAuth<{ id: string; message?: string; payload?: any; createdAt: string; actor?: any }[]>(
    `/admin/vehicles/${id}/activity`,
    token,
    { fallback: [] }
  );
}

export function getCaseParts(caseId: string, token: string) {
  return fetchWithAuth<any[]>(`/parts?caseId=${caseId}`, token, { fallback: [] });
}

export function getCasePhotos(caseId: string, token: string) {
  return fetchWithAuth<any[]>(`/photos?caseId=${caseId}`, token, { fallback: [] });
}

export type VehicleTaskRow = {
  id: string;
  title: string;
  status: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export function getCaseTasks(caseId: string, token: string) {
  return fetchWithAuth<VehicleTaskRow[]>(`/cases/${caseId}/tasks`, token, { fallback: [] });
}

export function createCaseTask(caseId: string, data: Partial<VehicleTaskRow>, token: string) {
  return fetchWithAuth<VehicleTaskRow>(`/cases/${caseId}/tasks`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(id: string, data: Partial<VehicleTaskRow>, token: string) {
  return fetchWithAuth<VehicleTaskRow>(`/tasks/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTask(id: string, token: string) {
  return fetchWithAuth<{ success: boolean }>(`/tasks/${id}`, token, { method: "DELETE" });
}

export function transferVehicleOwner(id: string, newOwnerId: string, token: string) {
  return fetchWithAuth<VehicleRow>(`/admin/vehicles/${id}/transfer-owner`, token, {
    method: "POST",
    body: JSON.stringify({ newOwnerId }),
  });
}

export function getVehicleOwnerHistory(id: string, token: string) {
  return fetchWithAuth<VehicleRow>(`/admin/vehicles/${id}?includeHistory=true`, token).then((v) => v.ownerHistory || []);
}

export function getVehicleBrands(token: string, shopId?: string) {
  const qs = shopId ? `?shopId=${shopId}` : "";
  return fetchWithAuth<{ name: string; isCustom?: boolean }[]>(`/vehicles/catalog/brands${qs}`, token, { fallback: [] });
}

export function getVehicleModels(token: string, brand: string, shopId?: string) {
  const params = new URLSearchParams();
  params.append("brand", brand);
  if (shopId) params.append("shopId", shopId);
  return fetchWithAuth<{ name: string; isCustom?: boolean }[]>(`/vehicles/catalog/models?${params.toString()}`, token, {
    fallback: [],
  });
}

export function getVehicleYears(token: string, brand: string, model: string, shopId?: string) {
  const params = new URLSearchParams();
  params.append("brand", brand);
  params.append("model", model);
  if (shopId) params.append("shopId", shopId);
  return fetchWithAuth<{ year: number; isCustom?: boolean }[]>(`/vehicles/catalog/years?${params.toString()}`, token, {
    fallback: [],
  });
}

export function getVehiclePackages(token: string, brand: string, model: string, year?: number, shopId?: string) {
  const params = new URLSearchParams();
  params.append("brand", brand);
  params.append("model", model);
  if (year) params.append("year", String(year));
  if (shopId) params.append("shopId", shopId);
  return fetchWithAuth<{ name: string }[]>(`/vehicles/catalog/packages?${params.toString()}`, token, { fallback: [] });
}

export function uploadVehiclePhoto(
  token: string,
  payload: { file: File; shopId: string; caseId: string; takenAt?: string }
) {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("shopId", payload.shopId);
  form.append("caseId", payload.caseId);
  if (payload.takenAt) form.append("takenAt", payload.takenAt);
  return fetchWithAuth(`/photos/upload`, token, { method: "POST", body: form });
}

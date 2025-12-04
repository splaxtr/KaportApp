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

export type PhotoRow = {
  id: string;
  url: string;
  storagePath?: string;
  takenAt?: string;
  addedBy?: string;
};

export function getVehiclePhotos(vehicleId: string, token: string) {
  const qs = new URLSearchParams({ vehicleId }).toString();
  return fetchWithAuth<PhotoRow[]>(`/photos?${qs}`, token, { fallback: [] });
}

export function deletePhoto(photoId: string, token: string) {
  return fetchWithAuth<{ success: boolean }>(`/photos/${photoId}`, token, { method: "DELETE" });
}

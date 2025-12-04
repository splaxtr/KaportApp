const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

async function fetchWithAuth<T>(path: string, token: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    return fallback;
  }
}

export type GlobalMetrics = {
  shops: number;
  users: number;
  vehicles: number;
  partsPending: number;
  last24hActions: number;
};

export type SystemMetrics = {
  apiHealth: "ok" | "degraded" | "down";
  dbLatency: number;
  storage: "ok" | "warning" | "error";
  uptime: number;
};

export type ActivityMetric = {
  id: string;
  message: string;
  createdAt: string;
  user?: string;
};

export type TopShopMetric = {
  shopName: string;
  jobCount: number;
};

export type PartStatusMetric = {
  status: string;
  count: number;
};

export function getGlobalMetrics(token: string) {
  return fetchWithAuth<GlobalMetrics>("/admin/metrics/global", token, {
    shops: 0,
    users: 0,
    vehicles: 0,
    partsPending: 0,
    last24hActions: 0,
  });
}

export function getSystemMetrics(token: string) {
  return fetchWithAuth<SystemMetrics>("/admin/metrics/system", token, {
    apiHealth: "degraded",
    dbLatency: 0,
    storage: "warning",
    uptime: 0,
  });
}

export function getActivities(token: string) {
  return fetchWithAuth<ActivityMetric[]>("/admin/metrics/activities", token, []);
}

export function getTopShops(token: string) {
  return fetchWithAuth<TopShopMetric[]>("/admin/metrics/top-shops", token, []);
}

export function getPartDistribution(token: string) {
  return fetchWithAuth<PartStatusMetric[]>("/admin/metrics/part-status", token, []);
}

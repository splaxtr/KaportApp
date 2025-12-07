const defaultBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || defaultBase;

type FetchOpts = RequestInit & { fallback?: any };

async function fetchWithAuth<T>(path: string, token: string, opts: FetchOpts = {}): Promise<T> {
  const { fallback, ...rest } = opts;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": rest.body instanceof FormData ? undefined : "application/json",
        ...(rest.headers || {}),
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

export type CaseStatus =
  | "opened"
  | "inspection"
  | "parts_waiting"
  | "repairing"
  | "paint"
  | "ready"
  | "delivered";

export type CaseDetailResponse = {
  case: {
    id: string;
    caseNumber?: string | null;
    damageDate?: string | null;
    expertName?: string | null;
    phone?: string | null;
    tcVkn?: string | null;
    notes?: string | null;
    status: CaseStatus;
    createdAt: string;
  };
  vehicle: {
    id: string;
    plate: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
  };
  parts: CasePart[];
  photos: CasePhoto[];
  operations: CaseOperation[];
  timeline: TimelineItem[];
};

export type CasePart = {
  id: string;
  caseId: string;
  name: string;
  status: string;
  price?: number | null;
  createdAt?: string;
};

export type CasePhoto = {
  id: string;
  caseId: string;
  url: string;
  storagePath?: string | null;
  takenAt?: string | null;
  addedBy?: string | null;
  createdAt?: string;
};

export type CaseOperation = {
  id: string;
  caseId: string;
  description: string;
  hours?: number | null;
  cost?: number | null;
  createdAt?: string;
};

export type TimelineItem = {
  type: string;
  createdAt: string;
  data?: any;
};

export async function getCaseDetail(caseId: string, token: string) {
  return fetchWithAuth<CaseDetailResponse>(`/cases/${caseId}/detail`, token);
}

export async function getCaseTimeline(caseId: string, token: string) {
  return fetchWithAuth<TimelineItem[]>(`/cases/${caseId}/timeline`, token, { fallback: [] });
}

export async function updateCaseStatus(
  caseId: string,
  payload: { status: CaseStatus; notes?: string },
  token: string,
) {
  return fetchWithAuth(`/cases/${caseId}/status`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCaseParts(caseId: string, token: string) {
  return fetchWithAuth<CasePart[]>(`/cases/${caseId}/parts`, token, { fallback: [] });
}

export async function createCasePart(
  caseId: string,
  payload: { name: string; status: string; price?: number | null },
  token: string,
) {
  return fetchWithAuth(`/cases/${caseId}/parts`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCasePart(
  partId: string,
  payload: { name?: string; status?: string; price?: number | null },
  token: string,
) {
  return fetchWithAuth(`/parts/${partId}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCasePart(partId: string, token: string) {
  return fetchWithAuth(`/parts/${partId}`, token, { method: "DELETE" });
}

export async function getCasePhotos(caseId: string, token: string) {
  return fetchWithAuth<CasePhoto[]>(`/cases/${caseId}/photos`, token, { fallback: [] });
}

export async function uploadCasePhoto(caseId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  return fetchWithAuth(`/cases/${caseId}/photos`, token, {
    method: "POST",
    body: formData,
  });
}

export async function deleteCasePhoto(photoId: string, token: string) {
  return fetchWithAuth(`/photos/${photoId}`, token, { method: "DELETE" });
}

export async function getCaseOperations(caseId: string, token: string) {
  return fetchWithAuth<CaseOperation[]>(`/cases/${caseId}/operations`, token, { fallback: [] });
}

export async function createCaseOperation(
  caseId: string,
  payload: { description: string; hours?: number | null; cost?: number | null },
  token: string,
) {
  return fetchWithAuth(`/cases/${caseId}/operations`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCaseOperation(
  operationId: string,
  payload: { description?: string; hours?: number | null; cost?: number | null },
  token: string,
) {
  return fetchWithAuth(`/operations/${operationId}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCaseOperation(operationId: string, token: string) {
  return fetchWithAuth(`/operations/${operationId}`, token, { method: "DELETE" });
}

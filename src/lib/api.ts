// REPLACE-WHOLE-FILE: src/lib/api.ts
export const RAW_API_BASE =
  (import.meta as any)?.env?.VITE_API_URL || "http://localhost:4000";

/** Ensure base ends with /api/v1 (no trailing slash), but don't double-append if already present */
function normalizeBase(base: string) {
  base = base.replace(/\/+$/, ""); // strip trailing slash
  if (!/\/api\/v1$/i.test(base)) base = `${base}/api/v1`;
  return base;
}

export const API_BASE_URL = normalizeBase(RAW_API_BASE);

type ApiOptions = {
  method?: string;
  auth?: boolean; // default true
  headers?: Record<string, string>;
  body?: any; // if object, will JSON.stringify (except FormData/Blob/ArrayBuffer)
};

/** Token helpers */
export function getToken() {
  return localStorage.getItem("accessToken") || "";
}
export function setToken(token: string) {
  localStorage.setItem("accessToken", token);
}
export function clearToken() {
  localStorage.removeItem("accessToken");
}

/** Build full URL. If an absolute URL is passed, use it as-is. Otherwise prefix with API_BASE_URL. */
function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path; // absolute URL
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

export async function api(path: string, opts: ApiOptions = {}) {
  const { method = "GET", auth = true, headers = {}, body } = opts;

  // Do not set JSON header for FormData/Blob/ArrayBuffer
  const isFormLike =
    typeof FormData !== "undefined" && body instanceof FormData ||
    typeof Blob !== "undefined" && body instanceof Blob ||
    typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer;

  const h: Record<string, string> = {
    ...(!isFormLike && body ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  if (auth) {
    const t = getToken();
    if (t) h["Authorization"] = `Bearer ${t}`;
  }

  const url = buildUrl(path);
  const res = await fetch(url, {
    method,
    headers: h,
    body: isFormLike
      ? body
      : body && typeof body === "object"
      ? JSON.stringify(body)
      : body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API ${method} ${url} failed: ${res.status} ${res.statusText} ${text}`.trim()
    );
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

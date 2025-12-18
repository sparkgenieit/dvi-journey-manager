// FILE: src/services/languageService.ts

import { getToken } from "@/lib/api";

export type LanguageId = string | number;

export type LanguageRow = {
  id: LanguageId;
  language: string;
  status: boolean;
};

export type LanguageUpsertInput = {
  language: string;
  status?: boolean;
};

/**
 * IMPORTANT:
 * Change this if your backend path differs.
 * Examples:
 *  "/languages"
 *  "/language"
 *  "/settings/languages"
 */
const LANGUAGES_BASE_PATH = "/languages";

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "";

function toBoolStatus(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return false;
}

function normalizeRow(r: any): LanguageRow {
  const id = r.id ?? r.language_id ?? r.language_ID ?? r.languageId;
  const language = r.language ?? r.language_name ?? r.title ?? "";
  const status = toBoolStatus(r.status);
  return { id, language, status };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    throw new Error(String(msg));
  }

  return data as T;
}

export const languageService = {
  async list(): Promise<LanguageRow[]> {
    const data = await apiFetch<any>(LANGUAGES_BASE_PATH, { method: "GET" });
    const rows = Array.isArray(data) ? data : data?.data ?? [];
    return rows.map(normalizeRow);
  },

  async create(payload: LanguageUpsertInput): Promise<LanguageRow> {
    const data = await apiFetch<any>(LANGUAGES_BASE_PATH, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const row = data?.data ?? data;
    return normalizeRow(row);
  },

  async update(id: LanguageId, payload: Partial<LanguageUpsertInput>): Promise<LanguageRow> {
    const data = await apiFetch<any>(`${LANGUAGES_BASE_PATH}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const row = data?.data ?? data;
    return normalizeRow(row);
  },

  async remove(id: LanguageId): Promise<void> {
    await apiFetch(`${LANGUAGES_BASE_PATH}/${id}`, { method: "DELETE" });
  },
};

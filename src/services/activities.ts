import { api } from "@/lib/api";

/** Build query string without external deps (arrays -> repeated keys) */
function toQuery(params?: Record<string, any>) {
  if (!params) return "";
  const parts: string[] = [];
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) {
      v.forEach((item) =>
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`),
      );
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  });
  return parts.length ? `?${parts.join("&")}` : "";
}
function withQuery(path: string, params?: Record<string, any>) {
  return `${path}${toQuery(params)}`;
}

/** Normalize api() returning either raw or { data } */
async function request<T>(path: string, opts?: any): Promise<T> {
  const res = await api(path, opts);
  if (res && typeof res === "object" && "data" in res) return (res as any).data as T;
  return res as T;
}

/* ================== Types ================== */

export type ActivityListRow = {
  counter: number;
  modify: number;
  activity_title: string;
  hotspot_name: string | null;
  hotspot_location: string | null;
  status: 0 | 1 | number;
  activity_id: number;
};
export type ActivityListResponse = { data: ActivityListRow[] };

export type HotspotOption = { id: number; label: string };

export type ActivityDetails = {
  activity_id: number;
  activity_title: string | null;
  hotspot_id: number | null;
  max_allowed_person_count: number | null;
  activity_duration: string | null; // "HH:MM:SS"
  activity_description: string | null;
  status: number;
  deleted: number;
  hotspot?:
    | {
        hotspot_ID: number;
        hotspot_name: string | null;
        hotspot_location: string | null;
      }
    | null;
  images?: Array<{
    activity_image_gallery_details_id: number;
    activity_image_gallery_name: string;
  }>;
};

export type PreviewPayload = {
  basic: ActivityDetails;
  hotspot: ActivityDetails["hotspot"];
  images: NonNullable<ActivityDetails["images"]>;
  defaultSlots: Array<{ start_time: string; end_time: string } & any>;
  specialSlots: Array<{ special_date: string; start_time: string; end_time: string } & any>;
  reviews: Array<{
    activity_review_id: number;
    activity_rating: string;
    activity_description: string | null;
    createdon: string;
  }>;
};

/* ================== API ================== */

export const ActivitiesAPI = {
  /** LIST — return plain rows array for easy setState */
  list: async (q?: string, status?: "0" | "1"): Promise<ActivityListRow[]> => {
    // If your api() supports searchParams, keep it; otherwise switch to withQuery().
    const res = await api("/activities", { method: "GET", searchParams: { q, status } });
    const payload: ActivityListResponse =
      res && typeof res === "object" && "data" in res ? (res as any) : { data: [] };
    return Array.isArray(payload.data) ? payload.data : [];
  },

  /** HOTSPOT DROPDOWN */
  hotspots: async (q?: string) =>
    request<HotspotOption[]>(withQuery("/activities/hotspots", { q }), { method: "GET" }),

  /** CREATE */
  create: async (body: any) =>
    request<ActivityDetails>("/activities", { method: "POST", body }),

  /** UPDATE */
  update: async (id: number, body: any) =>
    request<ActivityDetails>(`/activities/${id}`, { method: "PUT", body }),

  /** STATUS TOGGLE */
  toggleStatus: async (id: number, status: 0 | 1) =>
    request<any>(`/activities/${id}/status`, { method: "PATCH", body: { status } }),

  /** DELETE ACTIVITY */
  delete: async (id: number) => request<any>(`/activities/${id}`, { method: "DELETE" }),

  /** IMAGES */
  addImages: async (id: number, imageNames: string[], createdby?: number) =>
    request<any>(`/activities/${id}/images`, {
      method: "POST",
      body: { imageNames, createdby },
    }),

  deleteImage: async (id: number, imageId: number) =>
    request<any>(`/activities/${id}/images/${imageId}`, { method: "DELETE" }),

  /** TIME SLOTS */
  saveTimeSlots: async (id: number, body: any) =>
    request<any>(`/activities/${id}/time-slots`, { method: "POST", body }),

  /** PRICEBOOK */
  savePriceBook: async (id: number, body: any) =>
    request<any>(`/activities/${id}/pricebook`, { method: "POST", body }),

  /** REVIEWS */
  addReview: async (id: number, body: any) =>
    request<any>(`/activities/${id}/reviews`, { method: "POST", body }),

  updateReview: async (id: number, reviewId: number, body: any) =>
    request<any>(`/activities/${id}/reviews/${reviewId}`, { method: "PUT", body }),

  deleteReview: async (id: number, reviewId: number) =>
    request<any>(`/activities/${id}/reviews/${reviewId}`, { method: "DELETE" }),

  /** DETAILS & PREVIEW */
  details: async (id: number) => request<ActivityDetails>(`/activities/${id}`, { method: "GET" }),

  preview: async (id: number) => request<PreviewPayload>(`/activities/${id}/preview`, { method: "GET" }),
};

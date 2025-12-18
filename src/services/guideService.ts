// FILE: src/services/guideService.ts

import { api } from "@/lib/api";

/* -------------------------------------------------------
   Shared: List page helpers (works with multiple shapes)
   ------------------------------------------------------- */

type GuideListRowWire = any;

function normalizeRows(input: any): Array<{
  id: number;
  name: string;
  mobileNumber: string;
  email: string;
  status: 0 | 1;
}> {
  const rows: GuideListRowWire[] = Array.isArray(input?.data)
    ? input.data
    : Array.isArray(input)
    ? input
    : [];

  return rows.map((r: any) => {
    const id =
      Number(r?.modify ?? r?.id ?? r?.guide_id ?? r?.guideId ?? r?.GUIDE_ID ?? 0) || 0;

    const name = r?.guide_name ?? r?.name ?? r?.fullName ?? r?.GUIDE_NAME ?? "";

    const mobileNumber =
      r?.guide_primary_mobile_number ??
      r?.mobileNumber ??
      r?.primaryMobile ??
      r?.phone ??
      "";

    const email = r?.guide_email ?? r?.email ?? r?.mail ?? "";

    const statusNum =
      r?.status === true
        ? 1
        : r?.status === false
        ? 0
        : Number(r?.status ?? r?.active ?? 0);

    return {
      id,
      name: String(name ?? ""),
      mobileNumber: String(mobileNumber ?? ""),
      email: String(email ?? ""),
      status: (statusNum === 1 ? 1 : 0) as 0 | 1,
    };
  });
}

/* -------------------------------------------------------
   Export #1: GuideAPI (list/toggle/delete + full CRUD used by form)
   ------------------------------------------------------- */

export const GuideAPI = {
  /** DataTable list */
  async list(): Promise<
    Array<{ id: number; name: string; mobileNumber: string; email: string; status: 0 | 1 }>
  > {
    const res = await api("/guides", { method: "GET" });
    return normalizeRows(res);
  },

  /** Toggle active/inactive */
  async toggleStatus(id: number, status: 0 | 1): Promise<void> {
    await api(`/guides/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  /** Delete guide */
  async delete(id: number): Promise<void> {
    await api(`/guides/${id}`, { method: "DELETE" });
  },

  /* ---------- Added so GuideFormPage compiles & works ---------- */

  /** Get one guide for edit/preview */
  async get(id: number): Promise<{
    id: number;
    name: string;
    dateOfBirth: string;
    bloodGroup: string;
    gender: string;
    primaryMobile: string;
    alternativeMobile: string;
    email: string;
    emergencyMobile: string;
    password: string;
    role: string | number;
    experience: number;
    aadharCardNo: string;
    languageProficiency: string | number;
    country: string | number;
    state: string | number;
    city: string | number;
    gstType: string | number;
    gstPercentage: string;
    availableSlots: string[];
    bankDetails: {
      bankName: string;
      branchName: string;
      ifscCode: string;
      accountNumber: string;
      confirmAccountNumber: string;
    };
    preferredFor: { hotspot: boolean; activity: boolean; itinerary: boolean };
    pricebook: {
      startDate: string;
      endDate: string;
      pax1to5: { slot1: number; slot2: number; slot3: number };
      pax6to14: { slot1: number; slot2: number; slot3: number };
      pax15to40: { slot1: number; slot2: number; slot3: number };
    };
    reviews: Array<{ id: string; rating: number; description: string; createdOn: string }>;
  }> {
    const res = await api(`/guides/${id}`, { method: "GET" });
    return res;
  },

  /** Create */
  async create(body: any): Promise<{ id: number }> {
    const res = await api("/guides", { method: "POST", body });
    // allow either {id} or {data:{id}}
    const id =
      Number(res?.id ?? res?.data?.id ?? res?.guide_id ?? res?.GUIDE_ID ?? 0) || 0;
    return { id };
  },

  /** Update */
  async update(id: number, body: any): Promise<void> {
    await api(`/guides/${id}`, { method: "PUT", body });
  },

  /** Update pricebook only */
  async updatePricebook(
    id: number,
    pricebook: {
      startDate: string;
      endDate: string;
      pax1to5: { slot1: number; slot2: number; slot3: number };
      pax6to14: { slot1: number; slot2: number; slot3: number };
      pax15to40: { slot1: number; slot2: number; slot3: number };
    }
  ): Promise<void> {
    await api(`/guides/${id}/pricebook`, { method: "PATCH", body: pricebook });
  },

  /** Add a review */
  async addReview(
    id: number,
    payload: { rating: number; description: string; createdOn?: string }
  ): Promise<{ id: string; rating: number; description: string; createdOn: string }> {
    const res = await api(`/guides/${id}/reviews`, { method: "POST", body: payload });
    return {
      id: String(res?.id ?? res?.review_id ?? res?.GUIDE_REVIEW_ID ?? cryptoRandomId()),
      rating: Number(res?.rating ?? res?.guide_rating ?? payload.rating),
      description: String(res?.description ?? res?.guide_description ?? payload.description ?? ""),
      createdOn: String(res?.createdOn ?? res?.createdon ?? payload.createdOn ?? ""),
    };
  },

  /** Delete a review */
  async deleteReview(id: number, reviewId: string): Promise<void> {
    await api(`/guides/${id}/reviews/${reviewId}`, { method: "DELETE" });
  },
};

/* -------------------------------------------------------
   Export #2: Preview + options (as you already had)
   ------------------------------------------------------- */

export type GuideBasicRow = {
  guide_id: number;
  guide_name: string | null;
  guide_dob: string | null; // backend may send Date or {}
  guide_bloodgroup: string | null;
  guide_gender: number | null;
  guide_primary_mobile_number: string | null;
  guide_alternative_mobile_number: string | null;
  guide_email: string | null;
  guide_emergency_mobile_number: string | null;
  guide_language_proficiency: string | null;
  guide_aadhar_number: string | null;
  guide_experience: string | null;
  guide_country: number | null;
  guide_state: number | null;
  guide_city: number | null;

  guide_gst?: number | null;
  gst_type?: number | null;
  guide_available_slot?: string | null;

  guide_bank_name?: string | null;
  guide_bank_branch_name?: string | null;
  guide_ifsc_code?: string | null;
  guide_account_number?: string | null;
  guide_confirm_account_number?: string | null;

  guide_preffered_for?: string | null;
};

export type GuidePreviewView = {
  dob_text: string;
  gender_label: string;
  blood_group_label: string;
  language_label: string;
  state_name: string;
  country_name: string; // numeric string like "101" to mirror PHP payload
  gst_percent_text: string;
};

export type GuidePreviewResponse = {
  basic: GuideBasicRow;
  view?: GuidePreviewView; // new: server-rendered labels
  reviews: Array<{
    guide_review_id: number;
    guide_id: number;
    guide_rating: string | null; // "1".."5"
    guide_description: string | null;
    createdon?: string | null;
  }>;
  slots: string[];
  preferredFor: string[];
};

export type OptionsResponse = {
  // flexible shape; we normalize below
  roles?: Array<{ id: number | string; name: string }>;
  languages?: Array<{ id: number | string; name: string }>;
  countries?: Array<{ id: number; name: string }>;
  states?: Array<{ id: number; name: string; countryId?: number }>;
  cities?: Array<{ id: number; name: string; stateId?: number }>;
  gstPercentages?: Array<{ id: number | string; name: string }>;
};

export async function getGuidePreview(guideId: number): Promise<GuidePreviewResponse> {
  const res = await api(`/guides/${guideId}/preview`, { method: "GET" });
  return res as GuidePreviewResponse;
}

/* -------------------------------------------------------
   Dropdowns: single loader that works with /guides/options
   (and gracefully tolerates alternate server shapes)
   ------------------------------------------------------- */

function mapArray(
  input: any,
  idKeys: string[],
  nameKeys: string[],
  extra: Record<string, string[]> = {}
) {
  const arr: any[] = Array.isArray(input) ? input : [];
  return arr.map((r) => {
    const idKey = idKeys.find((k) => r?.[k] !== undefined);
    const nameKey = nameKeys.find((k) => r?.[k] !== undefined);
    const out: any = {
      id: idKey ? r[idKey] : r?.id,
      name: nameKey ? r[nameKey] : r?.name,
    };
    for (const [outKey, keys] of Object.entries(extra)) {
      const found = keys.find((k) => r?.[k] !== undefined);
      if (found) out[outKey] = r[found];
    }
    return out;
  });
}

export async function fetchGuideOptions(): Promise<OptionsResponse> {
  // Your backend exposes a SINGLE endpoint
  const res = await api(`/guides/options`, { method: "GET" });

  // Normalize multiple possible shapes safely
  const roles = mapArray(
    res?.roles ?? res?.data?.roles,
    ["role_id", "id", "ROLE_ID", "value"],
    ["role_name", "name", "ROLE_NAME"]
  );

  const languages = mapArray(
    res?.languages ?? res?.data?.languages,
    ["language_id", "id", "LANGUAGE_ID", "value"],
    ["language", "name", "LANGUAGE"]
  );

  const countries = mapArray(
    res?.countries ?? res?.data?.countries,
    ["country_id", "id", "COUNTRY_ID"],
    ["country_name", "name", "COUNTRY_NAME"]
  );

  const states = mapArray(
    res?.states ?? res?.data?.states,
    ["state_id", "id", "STATE_ID"],
    ["state_name", "name", "STATE_NAME"],
    { countryId: ["country_id", "COUNTRY_ID"] }
  );

  const cities = mapArray(
    res?.cities ?? res?.data?.cities,
    ["city_id", "id", "CITY_ID"],
    ["city_name", "name", "CITY_NAME"],
    { stateId: ["state_id", "STATE_ID"] }
  );

  const gstPercentages = mapArray(
    res?.gstPercentages ?? res?.gst ?? res?.data?.gstPercentages,
    ["gst_id", "id", "value"],
    ["gst_title", "title", "name"]
  );

  return {
    roles,
    languages,
    countries,
    states,
    cities,
    gstPercentages,
  };
}

/* Optional helpers if you later split endpoints on the server.
   These first try split paths; if 404, they fall back to /guides/options. */

export const GuideOptions = {
  async loadAll(): Promise<OptionsResponse> {
    try {
      // primary: single endpoint
      return await fetchGuideOptions();
    } catch {
      // if something breaks, at least return empty structure
      return {
        roles: [],
        languages: [],
        countries: [],
        states: [],
        cities: [],
        gstPercentages: [],
      };
    }
  },

  async states(countryId: string | number): Promise<Array<{ id: number; name: string; countryId?: number }>> {
    // try split path first
    try {
      const res = await api(`/geo/states?countryId=${countryId}`, { method: "GET" });
      return mapArray(res, ["state_id", "id", "STATE_ID"], ["state_name", "name", "STATE_NAME"], {
        countryId: ["country_id", "COUNTRY_ID"],
      });
    } catch {
      const all = await fetchGuideOptions();
      return (all.states ?? []).filter((s) => String(s.countryId ?? "") === String(countryId));
    }
  },

  async cities(stateId: string | number): Promise<Array<{ id: number; name: string; stateId?: number }>> {
    try {
      const res = await api(`/geo/cities?stateId=${stateId}`, { method: "GET" });
      return mapArray(res, ["city_id", "id", "CITY_ID"], ["city_name", "name", "CITY_NAME"], {
        stateId: ["state_id", "STATE_ID"],
      });
    } catch {
      const all = await fetchGuideOptions();
      return (all.cities ?? []).filter((c) => String(c.stateId ?? "") === String(stateId));
    }
  },
};
 
/* -------------------------------------------------------
   Legacy exported function kept for compatibility
   ------------------------------------------------------- */
export async function getGuideOptions(): Promise<OptionsResponse> {
  return fetchGuideOptions();
}

/* -------------------------------------------------------
   Small util
   ------------------------------------------------------- */
function cryptoRandomId(): string {
  // simple fallback for client id
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

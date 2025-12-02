// FILE: src/services/hotspotService.ts

import { api, API_BASE_URL } from "@/lib/api"; // ← adjust path if different

/** Strip `/api/v1` to get the public file base for /uploads */
const FILE_BASE = API_BASE_URL.replace(/\/api\/v1$/i, "");

type ListRow = {
  modify: number | string;
  hotspot_photo_url: string; // <img ...> HTML
  hotspot_name: string | null;
  hotspot_priority: number | string | null;
  hotspot_locations: string | null; // "a<br>b"
  local_members: string;   // HTML
  foreign_members: string; // HTML
};

type FormGetResponse = {
  payload: {
    id: number;
    hotspot_name: string;
    hotspot_type: string | null;
    hotspot_priority: number | null;
    hotspot_description: string | null;
    hotspot_landmark: string | null;
    hotspot_address: string | null;
    hotspot_adult_entry_cost?: number | null;
    hotspot_child_entry_cost?: number | null;
    hotspot_infant_entry_cost?: number | null;
    hotspot_foreign_adult_entry_cost?: number | null;
    hotspot_foreign_child_entry_cost?: number | null;
    hotspot_foreign_infant_entry_cost?: number | null;
    hotspot_rating?: number | null;
    hotspot_video_url?: string | null;
    hotspot_latitude?: string | null;
    hotspot_longitude?: string | null;
    hotspot_location_list?: string[];
    gallery: Array<{ id?: number | string; name: string }>;
    parkingCharges: Array<{ id?: number | string; vehicleTypeId: number; charge: number }>;
    operatingHours?: Record<
      string,
      { open24hrs?: boolean; closed24hrs?: boolean; slots: Array<{ id?: number | string; start: string; end: string }> }
    >;
  };
  options: {
    hotspotTypes: string[];
    locations: string[];
    vehicleTypes: Array<{ id: number; name: string }>;
  };
};

export type HotspotListItem = {
  id: string;
  imageUrl: string;
  name: string;
  priority: number;
  places: string[];
  localHtml: string;
  foreignHtml: string;
};

export type HotspotFormData = {
  id?: number;
  name: string;
  type: string | null;
  priority: number;
  description: string;
  landmark: string;
  address: string;
  adultCost: number;
  childCost: number;
  infantCost: number;
  foreignAdultCost: number;
  foreignChildCost: number;
  foreignInfantCost: number;
  rating: number;
  duration?: string;
  latitude: string;
  longitude: string;
  videoUrl: string;
  locations: string[];
  galleryImages: string[];
  parkingCharges: Record<string, number>;
  openingHours: Record<string, { is24Hours?: boolean; timeSlots: Array<{ start: string; end: string }> }>;
};

function imgFromHtml(html: string): string {
  const m = /<img[^>]*src=["']([^"']+)["']/i.exec(html || "");
  return m?.[1] ?? "";
}
function brToArray(s: string | null): string[] {
  return (s || "")
    .split(/<br\s*\/?>/i)
    .map((x) => x.trim())
    .filter(Boolean);
}

export const hotspotService = {
  async listHotspots(): Promise<HotspotListItem[]> {
    const json = await api("/hotspots"); // GET
    const rows: ListRow[] = json.data ?? [];
    return rows.map((r) => ({
      id: String(r.modify),
      imageUrl: imgFromHtml(r.hotspot_photo_url),
      name: r.hotspot_name ?? "",
      priority: Number(r.hotspot_priority ?? 0),
      places: brToArray(r.hotspot_locations),
      localHtml: r.local_members,
      foreignHtml: r.foreign_members,
    }));
  },

  async getHotspotForm(hotspotId: string): Promise<FormGetResponse> {
    return api(`/hotspots/${hotspotId}/form`);
  },

  async getFormOptions() {
    return api("/hotspots/form-options");
  },

  async saveHotspot(form: Partial<HotspotFormData>): Promise<{ id: number }> {
    const body = {
      id: form.id,
      hotspot_name: form.name,
      hotspot_type: form.type ?? null,
      hotspot_priority: form.priority ?? 0,
      hotspot_description: form.description ?? null,
      hotspot_landmark: form.landmark ?? null,
      hotspot_address: form.address ?? null,
      hotspot_adult_entry_cost: form.adultCost ?? null,
      hotspot_child_entry_cost: form.childCost ?? null,
      hotspot_infant_entry_cost: form.infantCost ?? null,
      hotspot_foreign_adult_entry_cost: form.foreignAdultCost ?? null,
      hotspot_foreign_child_entry_cost: form.foreignChildCost ?? null,
      hotspot_foreign_infant_entry_cost: form.foreignInfantCost ?? null,
      hotspot_rating: form.rating ?? null,
      hotspot_video_url: form.videoUrl ?? null,
      hotspot_latitude: form.latitude ?? null,
      hotspot_longitude: form.longitude ?? null,
      hotspot_location_list: form.locations ?? [],
      gallery: (form.galleryImages ?? []).map((u) => ({ name: u.split("/").pop()! })),
      parkingCharges: Object.entries(form.parkingCharges ?? {})
        .filter(([, charge]) => Number(charge) >= 0)
        .map(([k, charge]) => {
          const maybeId = Number(k);
          return { vehicleTypeId: Number.isFinite(maybeId) ? maybeId : 0, charge: Number(charge) };
        }),
      operatingHours: Object.fromEntries(
        Object.entries(form.openingHours ?? {}).map(([day, v]) => [
          day,
          {
            open24hrs: !!v?.is24Hours,
            closed24hrs: false,
            slots: (v?.timeSlots || []).map((s) => ({ start: s.start, end: s.end })),
          },
        ]),
      ),
    };

    return api("/hotspots/form", { method: "POST", body });
  },

  async deleteHotspot(id: string): Promise<void> {
    await api(`/hotspots/${id}`, { method: "DELETE" });
  },

  async updatePriority(id: string, priority: number) {
    await api(`/hotspots/${id}/priority`, { method: "PATCH", body: { priority } });
  },

  async uploadGallery(hotspotId: string | number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await api(`/hotspots/${hotspotId}/gallery/upload`, {
      method: "POST",
      body: fd,
      // api() will auto-detect FormData and avoid JSON headers
    });
    // ensure returned url is absolute for <img>
    return {
      ...r,
      url: r?.url?.startsWith("http") ? r.url : `${FILE_BASE}${r.url || ""}`,
    } as { ok: true; id: number | string; name: string; url: string };
  },

  fileBase(): string {
    return FILE_BASE;
  },
};

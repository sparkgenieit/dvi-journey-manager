// REPLACE WHOLE FILE: src/pages/hotel-form/RoomsStep.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoomForm } from "../HotelForm";

type ApiCtx = {
  apiGet: (p: string) => Promise<any>;
  apiPost: (p: string, b: any) => Promise<any>;
  apiGetFirst: (ps: string[]) => Promise<any>;
};

/* ====== GST helpers (DB requires 1/2) ====== */
const toGstNum = (v: any): 1 | 2 => {
  if (v === 1 || v === "1") return 1;
  if (v === 2 || v === "2") return 2;
  const s = String(v ?? "").toLowerCase();
  if (s.includes("include")) return 1;
  if (s.includes("exclude")) return 2;
  return 1;
};
const gstLabel = (n: 1 | 2) => (n === 1 ? "Included" : "Excluded");

/* ====== Time helpers ====== */
const to24h = (val: string): string => {
  // Accept "12:00 PM" or "12:00" -> return "HH:MM"
  if (!val) return "";
  const ampmMatch = val.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();
    if (ampm === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  // already 24h
  const hm = val.match(/^\d{2}:\d{2}$/);
  return hm ? val : "";
};
const to12h = (val: string): string => {
  // "HH:MM" -> "hh:mm AM/PM"
  if (!val) return "";
  const m = val.match(/^(\d{2}):(\d{2})$/);
  if (!m) return val;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${min} ${ampm}`;
};

/* ====== Chip multi-select for amenities (no external libs) ====== */
type Opt = { id: number | string; name: string };
function AmenityPicker({
  options,
  value,
  onChange,
  placeholder = "Select amenities",
}: {
  options: Opt[];
  value: (number | string)[];
  onChange: (ids: (number | string)[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(s));
  }, [q, options]);

  const add = (id: number | string) => {
    if (!value.includes(id)) onChange([...value, id]);
    setQ("");
    setOpen(false);
  };
  const remove = (id: number | string) => onChange(value.filter((v) => String(v) !== String(id)));

  return (
    <div ref={wrapRef} className="relative">
      {/* chips */}
      <div
        className="min-h-[38px] w-full border rounded-lg px-2 py-1 flex flex-wrap gap-1 cursor-text"
        onClick={() => setOpen(true)}
      >
        {value.length === 0 && (
          <span className="text-gray-400 text-sm px-1 py-1">{placeholder}</span>
        )}
        {value.map((id) => {
          const o = options.find((x) => String(x.id) === String(id));
          return (
            <span
              key={String(id)}
              className="inline-flex items-center gap-1 text-xs border rounded-full px-2 py-1 bg-gray-50"
            >
              {o?.name ?? id}
              <button
                type="button"
                className="leading-none text-gray-500 hover:text-gray-700"
                onClick={() => remove(id)}
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          className="flex-1 outline-none text-sm px-1 py-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto border rounded-lg bg-white shadow">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
          ) : (
            filtered.map((o) => (
              <button
                key={String(o.id)}
                type="button"
                onClick={() => add(o.id)}
                className="block w-full text-left px-3 py-2 hover:bg-purple-50"
              >
                {o.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function RoomsStep({
  api,
  hotelId,
  onPrev,
  onNext,
}: {
  api: ApiCtx;
  hotelId: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<RoomForm[]>([]);

  const defaultRow: RoomForm = {
    room_type: "",
    room_title: "",
    preferred_for: "",
    no_of_rooms: 1,
    ac_availability: 1,
    status: 1,
    max_adult: 2,
    max_children: 0,
    // store TIME as 24h "HH:MM" internally (for <input type='time'>)
    check_in_time: "12:00",
    check_out_time: "11:00",
    // GST numeric 1/2
    // @ts-ignore (RoomForm may declare string)
    gst_type: 1,
    gst_percentage: 5,
    amenities: [],
    food_breakfast: false,
    food_lunch: false,
    food_dinner: false,
    gallery: null,
  };

  /* ====== Meta options ====== */
  const gstTypes = [
    { id: 1 as const, name: "Included" },
    { id: 2 as const, name: "Excluded" },
  ];

  const { data: gstPercentsRaw = [] } = useQuery({
  queryKey: ["gstPercentages-room"],
  queryFn: () =>
    api
      .apiGetFirst([
        "/api/v1/meta/gst/percentages",
        "/api/v1/gst/percentages",
        "/api/v1/meta/gst/percents",
      ])
      .catch(() => [
        { id: 4, name: "5%", value: 5 },
        { id: 2, name: "18%", value: 18 },
        { id: 1, name: "12%", value: 12 },
        { id: 7, name: "0%", value: 0 },
      ]),
});

// Normalize to {id: number, label: string} using `value`,
// and order like the design: 5, 18, 12, 0 (fallback: by numeric asc)
const gstPercentOptions = useMemo(() => {
  const raw = (gstPercentsRaw as any[]).map((p) => {
    const val = Number(p?.value ?? p?.id ?? p);
    const v = Number.isFinite(val) ? val : 0;
    return { id: v, label: `${v} % GST - %${v}` };
  });

  const PRIORITY = [5, 18, 12, 0, 28]; // extend if you add more later
  raw.sort((a, b) => {
    const ai = PRIORITY.indexOf(a.id);
    const bi = PRIORITY.indexOf(b.id);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.id - b.id;
  });

  return raw;
}, [gstPercentsRaw]);


  const { data: preferredForOptions = [] } = useQuery({
    queryKey: ["preferred-for-room"],
    queryFn: () =>
      api
        .apiGetFirst([
          "/api/v1/meta/rooms/preferred-for",
          "/api/v1/rooms/preferred-for",
        ])
        .catch(() => [
          { id: "Family", name: "Family" },
          { id: "Couple", name: "Couple" },
          { id: "Business", name: "Business" },
          { id: "Group", name: "Group" },
        ]),
  });

  const { data: inbuiltAmenities = [] } = useQuery({
    queryKey: ["inbuilt-amenities-room"],
    queryFn: () =>
      api
        .apiGetFirst([
          "/api/v1/hotels/inbuilt-amenities",
          "/api/v1/meta/inbuilt-amenities",
          "/api/v1/inbuilt-amenities",
        ])
        .catch(() => []),
  });

  /* ====== Load rooms ====== */
  useQuery({
    queryKey: ["hotel-rooms", hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      const raw = await api
        .apiGetFirst([
          `/api/v1/hotels/${hotelId}/rooms`,
          `/api/v1/hotels/rooms?hotelId=${hotelId}`,
          `/api/v1/rooms?hotelId=${hotelId}`,
        ])
        .catch(() => []);
      const data = Array.isArray(raw) ? raw : raw?.items ?? raw?.data ?? raw?.rows ?? [];
      const mapped = (data as any[]).map((r) => ({
        room_type: r.room_type ?? "",
        room_title: r.room_title ?? r.title ?? "",
        preferred_for: r.preferred_for ?? "",
        no_of_rooms: r.no_of_rooms ?? r.count ?? 1,
        ac_availability: r.ac_availability ?? (r.ac ? 1 : 0),
        status: r.status ?? 1,
        max_adult: r.max_adult ?? 2,
        max_children: r.max_children ?? 0,
        check_in_time: to24h(r.check_in_time ?? "12:00 PM") || "12:00",
        check_out_time: to24h(r.check_out_time ?? "11:00 AM") || "11:00",
        // normalize GST to 1/2
        // @ts-ignore
        gst_type: toGstNum(r.gst_type ?? 1),
        gst_percentage: Number(r.gst_percentage ?? 5),
        amenities: Array.isArray(r.amenities)
          ? r.amenities
              .map((a: any) => a?.id ?? a?.inbuilt_amenity_type_id ?? a?.amenity_type_id ?? a)
              .filter((x: any) => x !== null && x !== undefined)
          : [],
        food_breakfast: Boolean(r.food_breakfast),
        food_lunch: Boolean(r.food_lunch),
        food_dinner: Boolean(r.food_dinner),
        gallery: null,
      }));
      setRows(mapped.length ? mapped : [defaultRow]);
      return mapped;
    },
  });

  /* ====== Handlers ====== */
  const handleChange = (i: number, field: keyof RoomForm, value: any) => {
    setRows((prev) => {
      const c = [...prev];
      if (field === "gst_type") value = toGstNum(value);
      if (field === "gst_percentage") value = Number(value ?? 0);
      c[i] = { ...c[i], [field]: value };
      return c;
    });
  };

  const addRow = () => setRows((p) => [...p, { ...defaultRow }]);
  const removeRow = (i: number) =>
    setRows((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  /* ====== Save ====== */
  const saveMut = useMutation({
    mutationFn: async (items: RoomForm[]) => {
      const payload = items.map((r) => ({
        hotel_id: Number(hotelId),
        room_type: r.room_type || null,
        room_title: r.room_title || null,
        preferred_for: r.preferred_for || null,
        no_of_rooms: Number(r.no_of_rooms || 1),
        ac_availability: Number(r.ac_availability || 0),
        status: Number(r.status || 1),
        max_adult: Number(r.max_adult || 0),
        max_children: Number(r.max_children || 0),
        // convert to 12h label if your backend expects that; keep 24h if supported
        check_in_time: to12h((r as any).check_in_time) || (r as any).check_in_time,
        check_out_time: to12h((r as any).check_out_time) || (r as any).check_out_time,
        gst_type: toGstNum((r as any).gst_type),
        gst_percentage: Number(r.gst_percentage || 0),
        amenities: (r.amenities ?? []).map((id) => Number(id)),
        food_breakfast: Boolean(r.food_breakfast),
        food_lunch: Boolean(r.food_lunch),
        food_dinner: Boolean(r.food_dinner),
      }));

      const paths = [
        `/api/v1/hotels/${hotelId}/rooms/bulk`,
        `/api/v1/hotels/${hotelId}/rooms`,
        `/api/v1/rooms/bulk`,
      ];
      let last: any;
      for (const p of paths) {
        try {
          try {
            return await api.apiPost(p, { items: payload });
          } catch {}
          return await api.apiPost(p, payload);
        } catch (e) {
          last = e;
        }
      }
      throw last || new Error("No rooms endpoint available");
    },
    onSuccess: () => {
      qc.invalidateQueries();
      alert("✅ Rooms saved");
      onNext();
    },
    onError: (e: any) => alert(`Failed: ${e?.message || "Unknown error"}`),
  });

  /* ====== Amenity option mapping ====== */
  const amenityOpts = useMemo<Opt[]>(() => {
    return (inbuiltAmenities as any[]).map((a) => ({
      id:
        a?.id ??
        a?.inbuilt_amenity_type_id ??
        a?.amenity_type_id ??
        a?.value ??
        a,
      name:
        a?.inbuilt_amenity_title ??
        a?.inbuilt_amenties_title ??
        a?.title ??
        a?.name ??
        String(a),
    }));
  }, [inbuiltAmenities]);

  return (
    <>
      <h3 className="text-pink-600 font-semibold mb-4">Rooms</h3>

      <div className="grid grid-cols-12 gap-4">
        {rows.map((row, idx) => (
          <div key={idx} className="col-span-12 border-b border-dashed pb-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h6 className="font-semibold text-sm">Room #{idx + 1}</h6>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 disabled:opacity-50"
                disabled={rows.length === 1}
              >
                Delete
              </button>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Room Type *</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.room_type}
                  onChange={(e) => handleChange(idx, "room_type", e.target.value)}
                  placeholder="Enter the Room type"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Room Title *</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.room_title}
                  onChange={(e) => handleChange(idx, "room_title", e.target.value)}
                  placeholder="Enter the Room Title"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Prefered For *</label>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.preferred_for}
                  onChange={(e) => handleChange(idx, "preferred_for", e.target.value)}
                >
                  <option value="">Select value</option>
                  {(preferredForOptions as any[]).map((o) => (
                    <option key={o.id ?? o.value ?? o} value={o.id ?? o.value ?? o}>
                      {o.name ?? o.label ?? String(o)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">No of Rooms Availability *</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.no_of_rooms}
                  onChange={(e) => handleChange(idx, "no_of_rooms", e.target.value)}
                  placeholder="Enter the No. of Rooms Available"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">AC Availability *</label>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.ac_availability}
                  onChange={(e) =>
                    handleChange(idx, "ac_availability", Number(e.target.value))
                  }
                >
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Status *</label>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.status}
                  onChange={(e) => handleChange(idx, "status", Number(e.target.value))}
                >
                  <option value={1}>Active</option>
                  <option value={0}>In-Active</option>
                </select>
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Max Adult *</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.max_adult}
                  onChange={(e) => handleChange(idx, "max_adult", e.target.value)}
                  placeholder="Enter the Max Adult"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Max Children *</label>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.max_children}
                  onChange={(e) => handleChange(idx, "max_children", e.target.value)}
                  placeholder="Enter the total children"
                />
              </div>

              {/* Time pickers now proper <input type="time"> */}
              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Check-In Time *</label>
                <input
                  type="time"
                  step={60}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={(row as any).check_in_time}
                  onChange={(e) => handleChange(idx, "check_in_time" as any, e.target.value)}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Saved as {to12h((row as any).check_in_time)}
                </p>
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Check-Out Time *</label>
                <input
                  type="time"
                  step={60}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={(row as any).check_out_time}
                  onChange={(e) => handleChange(idx, "check_out_time" as any, e.target.value)}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Saved as {to12h((row as any).check_out_time)}
                </p>
              </div>

              {/* GST (force new Included/Excluded only) */}
              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">GST Type *</label>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={(row as any).gst_type}
                  onChange={(e) => handleChange(idx, "gst_type" as any, Number(e.target.value))}
                >
                  {gstTypes.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">GST Percentage *</label>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.gst_percentage}
                  onChange={(e) => handleChange(idx, "gst_percentage", Number(e.target.value))}
                >
                  {gstPercentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amenities — chip picker (dropdown closes after pick) */}
              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Inbuilt Amenities *</label>
                <AmenityPicker
                  options={amenityOpts}
                  value={(row.amenities as any[]) ?? []}
                  onChange={(ids) => handleChange(idx, "amenities", ids as any[])}
                  placeholder="Choose amenities"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Room Gallery *</label>
                <input
                  type="file"
                  multiple
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  onChange={(e) =>
                    handleChange(idx, "gallery" as any, (e.target as HTMLInputElement).files)
                  }
                />
              </div>

              {/* Food Included? */}
              <div className="col-span-12">
                <div className="text-xs font-medium mb-2">Food Included? (Optional)</div>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.food_breakfast}
                      onChange={(e) => handleChange(idx, "food_breakfast", e.target.checked)}
                    />
                    Breakfast
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.food_lunch}
                      onChange={(e) => handleChange(idx, "food_lunch", e.target.checked)}
                    />
                    Lunch
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.food_dinner}
                      onChange={(e) => handleChange(idx, "food_dinner", e.target.checked)}
                    />
                    Dinner
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          type="button"
          onClick={addRow}
          className="px-4 py-2 rounded-lg border border-dashed border-purple-300 text-purple-700 text-sm"
        >
          + Add Room
        </button>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => saveMut.mutate(rows)}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white"
        >
          Update & Continue
        </button>
      </div>
    </>
  );
}

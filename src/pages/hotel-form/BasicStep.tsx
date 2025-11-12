// src/pages/hotel-form/BasicStep.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HotelForm } from "../HotelForm";

/* ================== Small, local ChipInput ==================
   - Keyboard: Enter / comma / space adds a chip
   - Backspace on empty input removes last chip
   - Shows simple pill chips with an × remove button
   - Fully controlled via value/onChange (string[])
==============================================================*/
function ChipInput({
  value,
  onChange,
  placeholder,
  type,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  type?: "phone" | "email";
}) {
  const [text, setText] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  const add = (raw: string) => {
    const items = raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return;
    const next = [...value];
    for (const item of items) {
      // very light validation
      if (type === "phone") {
        const ph = item.replace(/[^\d+]/g, "");
        if (ph.length < 7) continue;
        if (!next.includes(ph)) next.push(ph);
      } else if (type === "email") {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item);
        if (!ok) continue;
        if (!next.includes(item)) next.push(item);
      } else {
        if (!next.includes(item)) next.push(item);
      }
    }
    onChange(next);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (["Enter", ","].includes(e.key) || (e.key === " " && text.trim())) {
      e.preventDefault();
      add(text);
      setText("");
    } else if (e.key === "Backspace" && text === "" && value.length) {
      const next = [...value];
      next.pop();
      onChange(next);
    }
  };

  const removeAt = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div
      ref={boxRef}
      className="mt-1 w-full min-h-[42px] border rounded-lg px-2 py-2 flex flex-wrap gap-2 items-center"
      onClick={() => {
        const inp = boxRef.current?.querySelector("input");
        (inp as HTMLInputElement | null)?.focus();
      }}
    >
      {value.map((v, i) => (
        <span
          key={`${v}-${i}`}
          className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 rounded-md px-3 py-1"
        >
          {v}
          <button
            type="button"
            aria-label="Remove"
            className="text-gray-500 hover:text-gray-800"
            onClick={() => removeAt(i)}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 min-w-[160px] outline-none bg-transparent"
      />
    </div>
  );
}

/* ================== API ctx ================== */
type ApiCtx = {
  apiGet: (p: string) => Promise<any>;
  apiPost: (p: string, b: any) => Promise<any>;
  apiPatch: (p: string, b: any) => Promise<any>;
  apiGetFirst: (ps: string[]) => Promise<any>;
  API_BASE_URL: string;
  token: () => string;
};

export default function BasicStep({
  api,
  isEdit,
  hotelId,
  onNext,
}: {
  api: ApiCtx;
  isEdit: boolean;
  hotelId?: string;
  onNext: (newId: string | number) => void;
}) {
  const qc = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HotelForm & { hotel_mobile_arr: string[]; hotel_email_arr: string[] }>({
    defaultValues: {
      hotel_status: 1,
      hotel_powerbackup: 0,
      hotel_hotspot_status: 0,
      // arrays for chips
      hotel_mobile_arr: [],
      hotel_email_arr: [],
    } as any,
  });

  const statuses = [
    { id: 1, name: "Active" },
    { id: 0, name: "In-Active" },
  ];

  // helpers for parsing strings from edit payloads
  const splitPhones = (s?: any): string[] =>
    (typeof s === "string" ? s : String(s ?? ""))
      .split(/[,\s/|;]+/)
      .map((x) => x.trim().replace(/[^\d+]/g, ""))
      .filter((x) => x.length >= 7);
  const splitEmails = (s?: any): string[] =>
    (typeof s === "string" ? s : String(s ?? ""))
      .split(/[,\s/|;]+/)
      .map((x) => x.trim())
      .filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));

  // categories
  const { data: categories = [] } = useQuery({
    queryKey: ["hotel-categories"],
    queryFn: () =>
      api
        .apiGetFirst([
          "/api/v1/hotels/categories",
          "/api/v1/hotels/meta/categories",
          "/api/v1/meta/hotels/categories",
          "/api/v1/categories/hotels",
        ])
        .catch(() => []),
  });

  // countries
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () =>
      api
        .apiGetFirst(["/api/v1/meta/countries", "/api/v1/locations/countries", "/api/v1/countries"])
        .catch(() => []),
  });

  const countryId = watch("hotel_country");

  const statesPathList = useMemo(() => {
    const q = `?countryId=${countryId ?? ""}`;
    return [`/api/v1/meta/states${q}`, `/api/v1/locations/states${q}`, `/api/v1/states${q}`];
  }, [countryId]);

  const { data: states = [] } = useQuery({
    queryKey: ["states", countryId],
    queryFn: () => api.apiGetFirst(statesPathList).catch(() => []),
    enabled: !!countryId,
  });

  const stateId = watch("hotel_state");

  const citiesPathList = useMemo(() => {
    const q = `?stateId=${stateId ?? ""}`;
    return [`/api/v1/meta/cities${q}`, `/api/v1/locations/cities${q}`, `/api/v1/cities${q}`];
  }, [stateId]);

  const { data: cities = [] } = useQuery({
    queryKey: ["cities", stateId],
    queryFn: () => api.apiGetFirst(citiesPathList).catch(() => []),
    enabled: !!stateId,
  });

  // GST types & percentages
  const { data: gstTypes = [] } = useQuery({
    queryKey: ["gstTypes"],
    queryFn: () =>
      api
        .apiGetFirst(["/api/v1/meta/gst/types", "/api/v1/gst/types", "/api/v1/meta/gsttypes"])
        .catch(() => [
          { id: "Included", name: "Included" },
          { id: "Excluded", name: "Excluded" },
        ]),
  });

  const { data: gstPercents = [] } = useQuery({
    queryKey: ["gstPercentages"],
    queryFn: () =>
      api
        .apiGetFirst([
          "/api/v1/meta/gst/percentages",
          "/api/v1/gst/percentages",
          "/api/v1/meta/gst/percents",
        ])
        .catch(() => [
          { id: 0, name: "0%" },
          { id: 5, name: "5%" },
          { id: 12, name: "12%" },
          { id: 18, name: "18%" },
        ]),
  });

  const gstPercentOptions = useMemo(() => {
  // Fallback + normalization to numbers
  const fallback = [5, 18, 12, 0 ];
  const raw: number[] = (gstPercents as any[]).map((g: any) => {
    const n =
      typeof g === "number"
        ? g
        : Number(g?.id ?? g?.value ?? String(g?.name ?? "").replace("%", ""));
    return Number.isFinite(n) ? n : NaN;
  }).filter((n) => Number.isFinite(n)) as number[];

  // Preferred order, then any extra unique values
  const preferred = fallback.filter((v) => raw.includes(v));
  const extras = raw.filter((v) => !preferred.includes(v));
  const final = Array.from(new Set([...preferred, ...extras]));

  // Build the label: "5 % GST - %5"
  return final.map((v) => ({
    value: v,
    label: `${v} % GST - %${v}`,
  }));
}, [gstPercents]);

  /* EDIT defaults */
  useEffect(() => {
    if (!isEdit || !hotelId) return;
    let alive = true;
    api
      .apiGet(`/api/v1/hotels/${hotelId}`)
      .then((row) => {
        if (!alive || !row) return;
        const phones = splitPhones(row.hotel_mobile ?? row.hotel_mobile_no ?? row.phone ?? "");
        const emails = splitEmails(row.hotel_email ?? row.hotel_email_id ?? row.email ?? "");

        reset({
          hotel_name: row.hotel_name ?? row.name ?? "",
          hotel_place: row.hotel_place ?? row.place ?? "",
          hotel_status:
            row.status !== undefined
              ? Number(row.status)
              : row.hotel_status !== undefined
              ? Number(row.hotel_status)
              : 1,
          // keep original string fields too, but chip UI reads arrays:
          hotel_mobile_no: row.hotel_mobile ?? row.hotel_mobile_no ?? row.phone ?? "",
          hotel_email_id: row.hotel_email ?? row.hotel_email_id ?? row.email ?? "",
          hotel_mobile_arr: phones,
          hotel_email_arr: emails,

          hotel_category: row.hotel_category ?? row.categoryId ?? "",
          hotel_powerbackup:
            row.hotel_powerbackup !== undefined
              ? Number(row.hotel_powerbackup)
              : row.powerBackup
              ? 1
              : 0,
          hotel_country: row.hotel_country ?? row.countryId ?? "",
          hotel_state: row.hotel_state ?? row.stateId ?? "",
          hotel_city: row.hotel_city ?? row.cityId ?? "",
          hotel_postal_code: row.hotel_pincode ?? row.hotel_postal_code ?? row.pinCode ?? "",
          hotel_code: row.hotel_code ?? row.code ?? "",
          hotel_margin: row.hotel_margin ?? "",
          hotel_margin_gst_type: row.hotel_margin_gst_type ?? "",
          hotel_margin_gst_percentage: row.hotel_margin_gst_percentage ?? "",
          hotel_latitude:
            row.hotel_latitude !== undefined
              ? String(row.hotel_latitude ?? "")
              : row.latitude !== undefined
              ? String(row.latitude ?? "")
              : "",
          hotel_longitude:
            row.hotel_longitude !== undefined
              ? String(row.hotel_longitude ?? "")
              : row.longitude !== undefined
              ? String(row.longitude ?? "")
              : "",
          hotel_hotspot_status:
            row.hotel_hotspot_status !== undefined ? Number(row.hotel_hotspot_status) : row.hotSpot ? 1 : 0,
          hotel_address: row.hotel_address ?? row.addressLine1 ?? "",
        } as any);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isEdit, hotelId, api, reset]);

  /* Auto-generate hotel code when city changes */
  const cityWatch = watch("hotel_city");
  useEffect(() => {
    if (!cityWatch) return;
    const controller = new AbortController();
    (async () => {
      const tryPaths = [
        `/api/v1/hotels/code?cityId=${cityWatch}`,
        `/api/v1/hotels/generate-code?cityId=${cityWatch}`,
        `/api/v1/hotels/code?city_id=${cityWatch}`,
      ];
      for (const p of tryPaths) {
        try {
          const r = await fetch(`${api.API_BASE_URL}${p}`, {
            headers: { Authorization: `Bearer ${api.token()}` },
            signal: controller.signal,
          });
          if (r.ok) {
            const { code } = await r.json();
            setValue("hotel_code", code || "");
            break;
          }
        } catch {}
      }
    })();
    return () => controller.abort();
  }, [cityWatch, api, setValue]);

  const toNum = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));

  // Join chip arrays to strings for backend compatibility
  const normalizePayload = (data: HotelForm & { hotel_mobile_arr?: string[]; hotel_email_arr?: string[] }) => {
    const mobileJoined =
      (data as any).hotel_mobile_arr?.filter(Boolean).join(",") ||
      (data as any).hotel_mobile_no ||
      "";
    const emailJoined =
      (data as any).hotel_email_arr?.filter(Boolean).join(",") ||
      (data as any).hotel_email_id ||
      "";

    return {
      ...data,
      status: Number((data as any).hotel_status),
      hotel_status: Number((data as any).hotel_status),
      hotel_powerbackup: Number((data as any).hotel_powerbackup),
      hotel_hotspot_status: Number((data as any).hotel_hotspot_status),
      hotel_country: (data as any).hotel_country,
      hotel_state: (data as any).hotel_state,
      hotel_city: (data as any).hotel_city,
      hotel_margin: toNum((data as any).hotel_margin),
      hotel_margin_gst_type: toNum((data as any).hotel_margin_gst_type),
      hotel_margin_gst_percentage: toNum((data as any).hotel_margin_gst_percentage),
      hotel_latitude: (data as any).hotel_latitude === "" ? null : (data as any).hotel_latitude,
      hotel_longitude: (data as any).hotel_longitude === "" ? null : (data as any).hotel_longitude,
      // map to legacy fields
      hotel_mobile_no: mobileJoined,
      hotel_mobile: mobileJoined,
      hotel_email_id: emailJoined,
      hotel_email: emailJoined,
      hotel_pincode: (data as any).hotel_postal_code,
      hotel_address_1: (data as any).hotel_address,
    };
  };

  const createMut = useMutation({
    mutationFn: (payload: HotelForm & { hotel_mobile_arr?: string[]; hotel_email_arr?: string[] }) =>
      api.apiPost("/api/v1/hotels", normalizePayload(payload)),
    onSuccess: (res: any) => {
      qc.invalidateQueries();
      alert("✅ Hotel Basic Details Saved");
      const newId = res?.hotel_id ?? res?.id ?? res?.data?.hotel_id ?? res?.data?.id;
      onNext(newId);
    },
    onError: (e: any) => alert(`Failed: ${e?.message || "Unknown error"}`),
  });

  const updateMut = useMutation({
    mutationFn: (payload: HotelForm & { hotel_mobile_arr?: string[]; hotel_email_arr?: string[] }) =>
      api.apiPatch(`/api/v1/hotels/${hotelId}`, normalizePayload(payload)),
    onSuccess: () => {
      qc.invalidateQueries();
      alert("✅ Hotel Basic Details Updated");
      onNext(String(hotelId));
    },
    onError: (e: any) => alert(`Failed: ${e?.message || "Unknown error"}`),
  });

  const onSubmit = (data: any) => (isEdit ? updateMut.mutate(data) : createMut.mutate(data));
  const isSaving = isSubmitting || (createMut as any).isPending || (updateMut as any).isPending;

  return (
    <>
      <h3 className="text-pink-600 font-semibold mb-4">
        {isEdit ? "Edit Hotel - Basic Details" : "Basic Details"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-12 gap-4">
          {/* Name */}
          <div className="col-span-12 md:col-span-6">
            <label className="block text-sm font-medium">Hotel Name *</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="Enter the Hotel Name"
              {...register("hotel_name", { required: true })}
            />
            {errors.hotel_name && <p className="text-red-600 text-xs mt-1">Required</p>}
          </div>

          {/* Place */}
          <div className="col-span-12 md:col-span-3">
            <label className="block text-sm font-medium">Place *</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="Enter the hotel place"
              {...register("hotel_place", { required: true })}
            />
          </div>

          {/* Status */}
          <div className="col-span-12 md:col-span-3">
            <label className="block text-sm font-medium">Status *</label>
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              {...register("hotel_status", { required: true })}
            >
              {[{ id: 1, name: "Active" }, { id: 0, name: "In-Active" }].map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile (chips) */}
          <div className="col-span-12 md:col-span-6">
            <label className="block text-sm font-medium">Mobile *</label>
            <Controller
              control={control}
              name="hotel_mobile_arr"
              rules={{ validate: (v) => (v?.length ?? 0) > 0 || "At least one mobile is required" }}
              render={({ field }) => (
                <ChipInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Type a number and press Enter"
                  type="phone"
                />
              )}
            />
            {/* keep a hidden string field for compatibility (joined by commas) */}
            <input type="hidden" {...register("hotel_mobile_no")} />
            {errors as any && (errors as any).hotel_mobile_arr && (
              <p className="text-red-600 text-xs mt-1">{(errors as any).hotel_mobile_arr.message as string}</p>
            )}
          </div>

          {/* Email (chips) */}
          <div className="col-span-12 md:col-span-6">
            <label className="block text-sm font-medium">Email *</label>
            <Controller
              control={control}
              name="hotel_email_arr"
              rules={{ validate: (v) => (v?.length ?? 0) > 0 || "At least one email is required" }}
              render={({ field }) => (
                <ChipInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Type an email and press Enter"
                  type="email"
                />
              )}
            />
            <input type="hidden" {...register("hotel_email_id")} />
            {errors as any && (errors as any).hotel_email_arr && (
              <p className="text-red-600 text-xs mt-1">{(errors as any).hotel_email_arr.message as string}</p>
            )}
          </div>

          {/* Category */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">Category *</label>
            <select className="mt-1 w-full border rounded-lg px-3 py-2" {...register("hotel_category", { required: true })}>
              <option value="">Choose Category</option>
              {categories.map((c: any) => (
                <option key={c.id ?? c.value ?? c} value={c.id ?? c.value ?? c}>
                  {c.name ?? c.label ?? String(c)}
                </option>
              ))}
            </select>
          </div>

          {/* Power Backup */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">Power Backup? *</label>
            <select className="mt-1 w-full border rounded-lg px-3 py-2" {...register("hotel_powerbackup", { required: true })}>
              {[{ id: 1, name: "Yes" }, { id: 0, name: "No" }].map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Country / State / City */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">Country *</label>
            <select className="mt-1 w-full border rounded-lg px-3 py-2" {...register("hotel_country", { required: true })}>
              <option value="">Choose Country</option>
              {countries.map((c: any) => (
                <option key={c.id ?? c.value ?? c} value={c.id ?? c.value ?? c}>
                  {c.name ?? c.label ?? String(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">State *</label>
            <select className="mt-1 w-full border rounded-lg px-3 py-2" {...register("hotel_state", { required: true })}>
              <option value="">Please Choose State</option>
              {(states as any[]).map((s: any) => (
                <option key={s.id ?? s.value ?? s} value={s.id ?? s.value ?? s}>
                  {s.name ?? s.label ?? String(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">City *</label>
            <select className="mt-1 w-full border rounded-lg px-3 py-2" {...register("hotel_city", { required: true })}>
              <option value="">Please Choosen City</option>
              {(cities as any[]).map((c: any) => (
                <option key={c.id ?? c.value ?? c} value={c.id ?? c.value ?? c}>
                  {c.name ?? c.label ?? String(c)}
                </option>
              ))}
            </select>
          </div>

          {/* Pincode */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">Pincode *</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              maxLength={7}
              placeholder="Enter the Pincode"
              {...register("hotel_postal_code", { required: true })}
            />
          </div>

          {/* Hotel Code (readOnly) */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">Hotel Code *</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              readOnly
              placeholder="Enter the hotel code"
              {...register("hotel_code", { required: true })}
            />
          </div>

          {/* Margin */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">Hotel Margin (In Percentage) *</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="Enter the Margin"
              {...register("hotel_margin", { required: true })}
            />
          </div>

          {/* GST Type */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">Hotel Margin GST Type *</label>
            <select className="mt-1 w-full border rounded-lg px-3 py-2" {...register("hotel_margin_gst_type", { required: true })}>
              {(gstTypes as any[]).map((g: any) => (
                <option key={g.id ?? g.value ?? g} value={g.id ?? g.value ?? g}>
                  {g.name ?? g.label ?? String(g)}
                </option>
              ))}
            </select>
          </div>

          {/* GST % */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-sm font-medium">Hotel Margin GST Percentage *</label>
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              {...register("hotel_margin_gst_percentage", { required: true })}
            >
              {gstPercentOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lat/Lng */}
          <div className="col-span-12 md:col-span-2">
            <label className="block text-sm font-medium">Latitude</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="Enter the Latitude"
              {...register("hotel_latitude")}
            />
          </div>
          <div className="col-span-12 md:col-span-2">
            <label className="block text-sm font-medium">Longitude</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="Enter the Longitude"
              {...register("hotel_longitude")}
            />
          </div>

          {/* Hotspot */}
          <div className="col-span-12 md:col-span-3">
            <label className="block text-sm font-medium">Hotspot Status *</label>
            <select className="mt-1 w-full border rounded-lg px-3 py-2" {...register("hotel_hotspot_status", { required: true })}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className="col-span-12">
            <label className="block text-sm font-medium">Address *</label>
            <textarea
              rows={3}
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="Enter the Address"
              {...register("hotel_address", { required: true })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white"
          >
            {isEdit ? "Update & Continue" : "Update & Continue"}
          </button>
        </div>
      </form>
    </>
  );
}

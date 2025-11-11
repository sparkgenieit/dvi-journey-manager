// FILE: src/pages/hotel-form/PriceBookStep.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PricebookRow } from "../HotelForm";

type ApiCtx = {
  apiGetFirst: (ps: string[]) => Promise<any>;
  apiPost: (p: string, b: any) => Promise<any>;
};

export default function PriceBookStep({
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
  const [rows, setRows] = useState<PricebookRow[]>([]);

  const mealPlans = [
    { id: "EP", name: "EP (Room Only)" },
    { id: "CP", name: "CP (Breakfast)" },
    { id: "MAP", name: "MAP (Breakfast + Dinner)" },
    { id: "AP", name: "AP (All Meals)" },
  ];
  const occupancyTypes = [
    { id: "ROOM", name: "Per Room" },
    { id: "PAX", name: "Per Person" },
  ];

  const defaultRow: PricebookRow = {
    plan_title: "",
    room_type: "",
    meal_plan: "CP",
    occupancy_type: "ROOM",
    base_price: "",
    extra_adult_price: "",
    extra_child_price: "",
    status: 1,
  };

  useQuery({
    queryKey: ["hotel-pricebook", hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      const raw = await api.apiGetFirst([
        `/api/v1/hotels/${hotelId}/pricebook`,
        `/api/v1/hotels/${hotelId}/price-book`,
        `/api/v1/pricebook?hotelId=${hotelId}`,
        `/api/v1/hotel-pricebook?hotelId=${hotelId}`,
      ]).catch(() => []);
      const data = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? raw?.rows ?? []);
      const mapped: PricebookRow[] = (data as any[]).map((r) => ({
        id: r.id ?? r.pricebook_id,
        plan_title: r.plan_title ?? r.rate_title ?? "",
        room_type: r.room_type ?? r.room_category ?? "",
        meal_plan: r.meal_plan ?? r.plan_type ?? "CP",
        occupancy_type: r.occupancy_type ?? "ROOM",
        base_price: r.base_price ?? r.rate ?? "",
        extra_adult_price: r.extra_adult_price ?? r.extra_adult ?? "",
        extra_child_price: r.extra_child_price ?? r.extra_child ?? "",
        status: r.status ?? 1,
      }));
      setRows(mapped.length ? mapped : [{ ...defaultRow }]);
      return mapped;
    },
  });

  const handleChange = (index: number, field: keyof PricebookRow, value: any) => {
    setRows((prev) => {
      const c = [...prev];
      c[index] = { ...c[index], [field]: value };
      return c;
    });
  };

  const addRow = () => setRows((prev) => [...prev, { ...defaultRow }]);
  const removeRow = (index: number) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const saveMut = useMutation({
    mutationFn: async (items: PricebookRow[]) => {
      const payload = items.map((r) => ({
        id: r.id ?? undefined,
        hotel_id: Number(hotelId),
        plan_title: r.plan_title,
        room_type: r.room_type || null,
        meal_plan: r.meal_plan,
        occupancy_type: r.occupancy_type,
        base_price: Number(r.base_price || 0),
        extra_adult_price: Number(r.extra_adult_price || 0),
        extra_child_price: Number(r.extra_child_price || 0),
        status: Number(r.status || 1),
      }));
      const paths = [
        `/api/v1/hotels/${hotelId}/pricebook/bulk`,
        `/api/v1/hotels/${hotelId}/price-book/bulk`,
        `/api/v1/hotels/pricebook/bulk`,
      ];
      let lastErr: any;
      for (const p of paths) {
        try { return await api.apiPost(p, { items: payload }); } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error("No pricebook endpoint available");
    },
    onSuccess: () => {
      qc.invalidateQueries();
      alert("✅ Price Book saved");
      onNext();
    },
    onError: (e: any) => alert(`Failed: ${e?.message || "Unknown error"}`),
  });

  return (
    <>
      <h3 className="text-pink-600 font-semibold mb-4">Hotel Price Book</h3>

      <div className="grid grid-cols-12 gap-4">
        {rows.map((row, idx) => (
          <div key={row.id ?? idx} className="col-span-12 border-b border-dashed pb-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h6 className="font-semibold text-sm">Plan #{idx + 1}</h6>
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
                <label className="block text-xs font-medium">Plan Title *</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Standard CP"
                  value={row.plan_title}
                  onChange={(e)=>handleChange(idx,"plan_title",e.target.value)} />
              </div>

              <div className="col-span-12 md:col-span-2">
                <label className="block text-xs font-medium">Room Type (optional)</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Deluxe"
                  value={row.room_type || ""}
                  onChange={(e)=>handleChange(idx,"room_type",e.target.value)} />
              </div>

              <div className="col-span-12 md:col-span-2">
                <label className="block text-xs font-medium">Meal Plan *</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.meal_plan}
                  onChange={(e)=>handleChange(idx,"meal_plan",e.target.value)}>
                  {mealPlans.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="col-span-12 md:col-span-2">
                <label className="block text-xs font-medium">Occupancy Type *</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.occupancy_type}
                  onChange={(e)=>handleChange(idx,"occupancy_type",e.target.value)}>
                  {occupancyTypes.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Base Price (Per Night) *</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="0" value={row.base_price}
                  onChange={(e)=>handleChange(idx,"base_price",e.target.value)} />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Extra Adult Price</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="0" value={row.extra_adult_price}
                  onChange={(e)=>handleChange(idx,"extra_adult_price",e.target.value)} />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs font-medium">Extra Child Price</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="0" value={row.extra_child_price}
                  onChange={(e)=>handleChange(idx,"extra_child_price",e.target.value)} />
              </div>

              <div className="col-span-12 md:col-span-2">
                <label className="block text-xs font-medium">Status *</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={row.status}
                  onChange={(e)=>handleChange(idx,"status",Number(e.target.value))}>
                  <option value={1}>Active</option>
                  <option value={0}>In-Active</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <button type="button" onClick={addRow}
          className="px-4 py-2 rounded-lg border border-dashed border-purple-300 text-purple-700 text-sm">
          + Add Price Plan
        </button>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button type="button" onClick={onPrev} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
          Back
        </button>
        <button type="button" onClick={() => saveMut.mutate(rows)}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          Update & Continue
        </button>
      </div>
    </>
  );
}

// FILE: src/pages/hotel-form/PreviewStep.tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";

type ApiCtx = {
  apiGetFirst: (ps: string[]) => Promise<any>;
};

export default function PreviewStep({
  api,
  hotelId,
  hotelData,
  onPrev,
}: {
  api: ApiCtx;
  hotelId: string;
  hotelData: any;
  onPrev: () => void;
}) {
  const { data: rooms = [] } = useQuery({
    queryKey: ["hotel-rooms", hotelId],
    enabled: !!hotelId,
    queryFn: () =>
      api.apiGetFirst([
        `/api/v1/hotels/${hotelId}/rooms`,
        `/api/v1/hotels/rooms?hotelId=${hotelId}`,
        `/api/v1/rooms?hotelId=${hotelId}`,
      ]).catch(() => []),
  });

  const { data: amenities = [] } = useQuery({
    queryKey: ["hotel-amenities-preview", hotelId],
    enabled: !!hotelId,
    queryFn: () =>
      api.apiGetFirst([
        `/api/v1/hotel-amenities?hotelId=${hotelId}`,
        `/api/v1/hotel-amenities/${hotelId}`,
        `/api/v1/hotels/${hotelId}/amenities`,
      ]).catch(() => []),
  });

  const { data: pricebook = [] } = useQuery({
    queryKey: ["hotel-pricebook-preview", hotelId],
    enabled: !!hotelId,
    queryFn: () =>
      api.apiGetFirst([
        `/api/v1/hotels/${hotelId}/pricebook`,
        `/api/v1/hotels/${hotelId}/price-book`,
        `/api/v1/pricebook?hotelId=${hotelId}`,
      ]).catch(() => []),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["hotel-reviews-preview", hotelId],
    enabled: !!hotelId,
    queryFn: () =>
      api.apiGetFirst([
        `/api/v1/hotels/${hotelId}/reviews`,
        `/api/v1/hotels/${hotelId}/feedback`,
      ]).catch(() => []),
  });

  const basic = hotelData || {};

  return (
    <>
      <h3 className="text-pink-600 font-semibold mb-4">Preview</h3>

      <div className="space-y-6 text-sm">
        {/* Basic Info */}
        <div className="border rounded-2xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Basic Info</h4>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-4">
              <div className="text-xs text-gray-500">Hotel Name</div>
              <div className="font-medium">{basic.hotel_name ?? basic.name ?? "-"}</div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="text-xs text-gray-500">Place</div>
              <div className="font-medium">{basic.hotel_place ?? basic.place ?? "-"}</div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="text-xs text-gray-500">Status</div>
              <div className="font-medium">
                {Number(basic.status ?? basic.hotel_status ?? 1) === 1 ? "Active" : "In-Active"}
              </div>
            </div>

            <div className="col-span-12 md:col-span-4">
              <div className="text-xs text-gray-500">Mobile</div>
              <div className="font-medium">
                {basic.hotel_mobile ?? basic.hotel_mobile_no ?? basic.phone ?? "-"}
              </div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="text-xs text-gray-500">Email</div>
              <div className="font-medium">{basic.hotel_email ?? basic.email ?? "-"}</div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="text-xs text-gray-500">Hotel Code</div>
              <div className="font-medium">{basic.hotel_code ?? basic.code ?? "-"}</div>
            </div>
          </div>
        </div>

        {/* Rooms */}
        <div className="border rounded-2xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Rooms</h4>
          {rooms.length === 0 ? (
            <div className="text-xs text-gray-500">No rooms added.</div>
          ) : (
            <div className="space-y-3">
              {rooms.map((r: any, i: number) => (
                <div key={r.id ?? r.room_id ?? i} className="border rounded-xl p-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Room #{i + 1}: {r.room_title ?? r.room_type ?? "-"}</span>
                    <span>Status: {Number(r.status ?? 1) === 1 ? "Active" : "In-Active"}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-2 text-xs">
                    <div className="col-span-6 md:col-span-3">
                      <span className="text-gray-500">Type</span>
                      <div className="font-medium">{r.room_type ?? "-"}</div>
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <span className="text-gray-500">Max Adult</span>
                      <div className="font-medium">{r.max_adult ?? "-"}</div>
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <span className="text-gray-500">Max Children</span>
                      <div className="font-medium">{r.max_children ?? "-"}</div>
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <span className="text-gray-500">Check-In / Check-Out</span>
                      <div className="font-medium">
                        {(r.check_in_time ?? "") + " - " + (r.check_out_time ?? "")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amenities */}
        <div className="border rounded-2xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Amenities</h4>
          {amenities.length === 0 ? (
            <div className="text-xs text-gray-500">No amenities configured.</div>
          ) : (
            <ul className="list-disc pl-5 text-xs space-y-1">
              {amenities.map((a: any, i: number) => (
                <li key={a.id ?? a.hotel_amenities_id ?? i}>
                  {a.amenities_title ?? a.title ?? "-"}{" "}
                  {a.start_time && a.end_time && (
                    <span className="text-gray-500">({a.start_time} – {a.end_time})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Price Book */}
        <div className="border rounded-2xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Price Book</h4>
          {pricebook.length === 0 ? (
            <div className="text-xs text-gray-500">No price plans defined.</div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Plan</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Meal</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Occupancy</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Base Price</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Extra Adult</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Extra Child</th>
                  </tr>
                </thead>
                <tbody>
                  {pricebook.map((p: any, i: number) => (
                    <tr key={p.id ?? p.pricebook_id ?? i} className="border-t">
                      <td className="px-3 py-2">
                        {p.plan_title ?? p.rate_title ?? "-"} {p.room_type ? `(${p.room_type})` : ""}
                      </td>
                      <td className="px-3 py-2">{p.meal_plan ?? "-"}</td>
                      <td className="px-3 py-2">{p.occupancy_type ?? "-"}</td>
                      <td className="px-3 py-2">{p.base_price ?? p.rate ?? 0}</td>
                      <td className="px-3 py-2">{p.extra_adult_price ?? p.extra_adult ?? 0}</td>
                      <td className="px-3 py-2">{p.extra_child_price ?? p.extra_child ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="border rounded-2xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Reviews</h4>
          {reviews.length === 0 ? (
            <div className="text-xs text-gray-500">No reviews yet.</div>
          ) : (
            <div className="space-y-3 text-xs">
              {reviews.map((r: any, i: number) => (
                <div key={r.id ?? r.hotel_review_id ?? i} className="border rounded-xl p-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Rating: {r.rating ?? r.hotel_rating ?? "-"} ★</span>
                    <span className="text-gray-500">{r.created_at ?? r.created_on ?? r.createdDate ?? "-"}</span>
                  </div>
                  <div className="text-gray-700">{r.description ?? r.review_description ?? "-"}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <button type="button" onClick={onPrev}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Back</button>
        </div>
      </div>
    </>
  );
}

// FILE: src/pages/hotel-form/ReviewStep.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReviewForm } from "../HotelForm";

type ApiCtx = {
  apiGetFirst: (ps: string[]) => Promise<any>;
  apiPost: (p: string, b: any) => Promise<any>;
};

export default function ReviewStep({
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReviewForm>({
    defaultValues: { hotel_rating: "", review_description: "" },
  });

  const { data: reviews = [], refetch } = useQuery({
    queryKey: ["hotel-reviews", hotelId],
    enabled: !!hotelId,
    queryFn: () =>
      api.apiGetFirst([
        `/api/v1/hotels/${hotelId}/reviews`,
        `/api/v1/hotels/${hotelId}/feedback`,
        `/api/v1/hotels/reviews?hotelId=${hotelId}`,
      ]).catch(() => []),
  });

  const saveMut = useMutation({
    mutationFn: async (data: ReviewForm) => {
      const payload = {
        hotel_id: Number(hotelId),
        rating: Number(data.hotel_rating || 0),
        description: data.review_description,
      };
      const paths = [
        `/api/v1/hotels/${hotelId}/reviews`,
        `/api/v1/hotels/${hotelId}/feedback`,
        `/api/v1/hotels/reviews`,
      ];
      let lastErr: any;
      for (const p of paths) {
        try { return await api.apiPost(p, payload); } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error("No review endpoint available");
    },
    onSuccess: () => {
      qc.invalidateQueries();
      alert("✅ Review saved");
      reset({ hotel_rating: "", review_description: "" });
      refetch();
      onNext();
    },
    onError: (e: any) => alert(`Failed: ${e?.message || "Unknown error"}`),
  });

  const onSubmit = (data: ReviewForm) => saveMut.mutate(data);
  const ratingOptions = [5, 4, 3, 2, 1];

  return (
    <>
      <h3 className="text-pink-600 font-semibold mb-4">Review & Feedback</h3>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label text-primary text-sm font-semibold" htmlFor="hotel_rating">
                Rating
              </label>
              <select id="hotel_rating" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                {...register("hotel_rating", { required: true })}>
                <option value="">Select Rating</option>
                {ratingOptions.map((r) => (
                  <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">All reviews are from genuine customers</p>
            </div>

            <div>
              <label className="form-label text-sm font-semibold" htmlFor="review_description">
                Feedback <span className="text-red-500">*</span>
              </label>
              <textarea id="review_description" rows={4}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                {...register("review_description", { required: true })}/>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting || saveMut.isPending}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm">
                Save & Continue
              </button>
            </div>
          </form>
        </div>

        <div className="col-span-12 md:col-span-8">
          <h4 className="text-sm font-semibold mb-3">Existing Reviews</h4>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">S.no</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Rating</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Created On</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-xs text-gray-500">
                      No reviews added yet.
                    </td>
                  </tr>
                )}
                {reviews.map((r: any, i: number) => (
                  <tr key={r.id ?? r.hotel_review_id ?? i} className="border-t">
                    <td className="px-3 py-2 text-xs">{i + 1}</td>
                    <td className="px-3 py-2 text-xs">{(r.rating ?? r.hotel_rating ?? "-") + " ★"}</td>
                    <td className="px-3 py-2 text-xs">{r.description ?? r.review_description ?? "-"}</td>
                    <td className="px-3 py-2 text-xs">{r.created_at ?? r.created_on ?? r.createdDate ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button type="button" onClick={onPrev} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
          Back
        </button>
        <button type="button" onClick={onNext}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          Go to Preview
        </button>
      </div>
    </>
  );
}

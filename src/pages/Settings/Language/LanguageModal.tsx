// FILE: src/pages/Settings/LanguageModal.tsx

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export type LanguageFormValues = {
  language: string;
};

export function LanguageModal(props: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<LanguageFormValues>;
  onClose: () => void;
  onSubmit: (values: LanguageFormValues) => Promise<void> | void;
}) {
  const { open, mode, initial, onClose, onSubmit } = props;

  const titleText = mode === "create" ? "Add Language" : "Update Language";
  const submitLabel = mode === "create" ? "Save" : "Update";

  const initialState: LanguageFormValues = useMemo(
    () => ({ language: initial?.language ?? "" }),
    [initial]
  );

  const [values, setValues] = useState<LanguageFormValues>(initialState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setValues(initialState);
  }, [open, initialState]);

  if (!open) return null;

  const isValid = values.language.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    try {
      setSubmitting(true);
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div className="relative w-[780px] max-w-[92vw] rounded-lg bg-white shadow-2xl">
        <div className="px-10 py-10">
          <h2 className="text-center text-3xl font-semibold text-slate-600">
            {titleText}
          </h2>

          <div className="mt-10 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Language <span className="text-red-500">*</span>
              </label>
              <Input
                value={values.language}
                onChange={(e) => setValues({ language: e.target.value })}
                placeholder="Enter the Language"
              />
            </div>
          </div>

          <div className="mt-12 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-400 px-10 py-3 text-white font-semibold hover:bg-gray-500 transition"
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className={`rounded-md px-12 py-3 text-white font-semibold transition
                ${
                  !isValid || submitting
                    ? "bg-purple-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                }`}
            >
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

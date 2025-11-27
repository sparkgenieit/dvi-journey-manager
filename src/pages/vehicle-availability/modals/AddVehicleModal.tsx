// FILE: src/pages/VehicleAvailability/modals/AddVehicleModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  SimpleOption,
  createVehicle,
  fetchVendorBranches,
} from "@/services/vehicle-availability";
import { ChevronDown } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;

  vendors: SimpleOption[];
  vehicleTypes: SimpleOption[];
  // optional: reuse your existing locations list as origin suggestions
  locations?: SimpleOption[];

  defaultVendorId?: number | "";
  defaultVehicleTypeId?: number | "";
};

const inputBase =
  "h-[44px] w-full rounded-md border bg-white px-4 text-[15px] text-slate-700 placeholder:text-slate-400 focus:outline-none";

const labelBase = "text-[15px] text-slate-600";

function SelectBox({
  value,
  onChange,
  placeholder,
  options,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: SimpleOption[];
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <select
        className={[
          inputBase,
          "appearance-none pr-10",
          invalid ? "border-red-400" : "border-slate-300",
        ].join(" ")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={String(o.id)}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

export function AddVehicleModal({
  open,
  onClose,
  onCreated,
  vendors,
  vehicleTypes,
  locations = [],
  defaultVendorId = "",
  defaultVehicleTypeId = "",
}: Props) {
  const [vendorId, setVendorId] = useState<number | "">("");
  const [vendorBranchId, setVendorBranchId] = useState<number | "">("");
  const [vehicleTypeId, setVehicleTypeId] = useState<number | "">("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  const [vehicleOrigin, setVehicleOrigin] = useState("");
  const [vehicleExpiryDate, setVehicleExpiryDate] = useState("");
  const [insuranceStartDate, setInsuranceStartDate] = useState("");
  const [insuranceEndDate, setInsuranceEndDate] = useState("");

  const [branches, setBranches] = useState<SimpleOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const originDatalistId = useMemo(() => `origin-dl-${Math.random()}`, []);

  useEffect(() => {
    if (!open) return;

    setError("");
    setSaving(false);

    setVendorId(defaultVendorId ?? "");
    setVehicleTypeId(defaultVehicleTypeId ?? "");
    setVendorBranchId("");

    setRegistrationNumber("");
    setVehicleOrigin("");
    setVehicleExpiryDate("");
    setInsuranceStartDate("");
    setInsuranceEndDate("");

    setBranches([]);
    setBranchesLoading(false);
  }, [open, defaultVendorId, defaultVehicleTypeId]);

  // Load branches when vendor changes
  useEffect(() => {
    if (!open) return;

    const vId = vendorId === "" ? null : Number(vendorId);
    if (!vId) {
      setBranches([]);
      setVendorBranchId("");
      return;
    }

    let alive = true;
    (async () => {
      setBranchesLoading(true);
      setError("");
      try {
        const res = await fetchVendorBranches(vId);
        if (!alive) return;
        setBranches(res);
        setVendorBranchId("");
      } catch (e: any) {
        if (!alive) return;
        setBranches([]);
        setVendorBranchId("");
        setError(e?.message || "Failed to load vendor branches.");
      } finally {
        if (alive) setBranchesLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [vendorId, open]);

  if (!open) return null;

  const vendorInvalid = vendorId === "";
  const branchInvalid = vendorBranchId === "";
  const vehicleTypeInvalid = vehicleTypeId === "";

  async function handleSave() {
    setError("");

    if (vendorInvalid) return setError("Please choose Vendor.");
    if (branchInvalid) return setError("Please choose Vendor Branch.");
    if (vehicleTypeInvalid) return setError("Please choose Vehicle Type.");
    if (!registrationNumber.trim())
      return setError("Please enter Registration Number.");
    if (!vehicleOrigin.trim()) return setError("Please choose Vehicle Origin.");
    if (!vehicleExpiryDate) return setError("Please choose Vehicle Expiry Date.");
    if (!insuranceStartDate) return setError("Please choose Insurance Start Date.");
    if (!insuranceEndDate) return setError("Please choose Insurance End Date.");

    try {
      setSaving(true);

      // IMPORTANT: backend createVehicle currently safely accepts vendorId, vehicleTypeId, registrationNumber.
      // Vendor Branch / Dates need backend column support. If your Prisma model has them, keep below payload.
      await createVehicle({
        vendorId: Number(vendorId),
        vehicleTypeId: Number(vehicleTypeId),
        registrationNumber: registrationNumber.trim(),

        // send extra fields in snake_case to match legacy DB naming patterns
        vendor_branch_id: Number(vendorBranchId),
        vehicle_origin: vehicleOrigin.trim(),
        vehicle_expiry_date: vehicleExpiryDate,
        insurance_start_date: insuranceStartDate,
        insurance_end_date: insuranceEndDate,
      });

      onClose();
      onCreated?.();
    } catch (e: any) {
      setError(e?.message || "Failed to add vehicle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[980px] rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header centered like PHP */}
        <div className="pt-10 text-center">
          <h2 className="text-[28px] font-medium text-slate-600">
            Add New Vehicle
          </h2>
        </div>

        <div className="px-10 pb-10 pt-8">
          {error ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {/* 2-column grid like PHP */}
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-2">
            {/* Vendor */}
            <div>
              <div className={labelBase}>
                Vendor <span className="text-red-500">*</span>
              </div>
              <div className="mt-2">
                <SelectBox
                  value={vendorId === "" ? "" : String(vendorId)}
                  onChange={(v) => setVendorId(v ? Number(v) : "")}
                  placeholder="Choose Vendor"
                  options={vendors}
                  invalid={vendorInvalid}
                />
              </div>
            </div>

            {/* Vendor Branch */}
            <div>
              <div className={labelBase}>
                Vendor Branch <span className="text-red-500">*</span>
              </div>
              <div className="mt-2">
                <SelectBox
                  value={vendorBranchId === "" ? "" : String(vendorBranchId)}
                  onChange={(v) => setVendorBranchId(v ? Number(v) : "")}
                  placeholder={branchesLoading ? "Loading..." : "Choose Branch"}
                  options={branches}
                  invalid={branchInvalid}
                />
                {vendorId !== "" && !branchesLoading && branches.length === 0 ? (
                  <div className="mt-1 text-xs text-slate-400">
                    No branches found for this vendor.
                  </div>
                ) : null}
              </div>
            </div>

            {/* Vehicle Type */}
            <div>
              <div className={labelBase}>
                Vehicle Type <span className="text-red-500">*</span>
              </div>
              <div className="mt-2">
                <SelectBox
                  value={vehicleTypeId === "" ? "" : String(vehicleTypeId)}
                  onChange={(v) => setVehicleTypeId(v ? Number(v) : "")}
                  placeholder="Choose Vehicle Type"
                  options={vehicleTypes}
                  invalid={vehicleTypeInvalid}
                />
              </div>
            </div>

            {/* Registration Number */}
            <div>
              <div className={labelBase}>
                Registration Number <span className="text-red-500">*</span>
              </div>
              <div className="mt-2">
                <input
                  className={[inputBase, "border-slate-300"].join(" ")}
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Registration Number"
                />
              </div>
            </div>

            {/* Vehicle Origin */}
            <div>
              <div className={labelBase}>
                Vehicle Origin <span className="text-red-500">*</span>
              </div>
              <div className="mt-2">
                <input
                  className={[inputBase, "border-slate-300"].join(" ")}
                  value={vehicleOrigin}
                  onChange={(e) => setVehicleOrigin(e.target.value)}
                  placeholder="Choose Vehicle Origin"
                  list={originDatalistId}
                />
                <datalist id={originDatalistId}>
                  {locations.map((l) => (
                    <option key={l.id} value={l.label} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Vehicle Expiry Date */}
            <div>
              <div className={labelBase}>
                Vehicle Expiry Date <span className="text-red-500">*</span>
              </div>
              <div className="mt-2">
                <input
                  className={[inputBase, "border-slate-300"].join(" ")}
                  type="date"
                  value={vehicleExpiryDate}
                  onChange={(e) => setVehicleExpiryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Insurance Start Date */}
            <div>
              <div className={labelBase}>
                Insurance Start Date <span className="text-red-500">*</span>
              </div>
              <div className="mt-2">
                <input
                  className={[inputBase, "border-slate-300"].join(" ")}
                  type="date"
                  value={insuranceStartDate}
                  onChange={(e) => setInsuranceStartDate(e.target.value)}
                />
              </div>
            </div>

            {/* Insurance End Date */}
            <div>
              <div className={labelBase}>
                Insurance End Date <span className="text-red-500">*</span>
              </div>
              <div className="mt-2">
                <input
                  className={[inputBase, "border-slate-300"].join(" ")}
                  type="date"
                  value={insuranceEndDate}
                  onChange={(e) => setInsuranceEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer buttons like PHP */}
          <div className="mt-12 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-[44px] w-[130px] rounded-md bg-slate-400 text-[16px] font-semibold text-white hover:bg-slate-500 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-[44px] w-[100px] rounded-md bg-gradient-to-r from-purple-600 to-pink-500 text-[16px] font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Saving" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

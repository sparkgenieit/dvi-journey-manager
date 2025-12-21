// FILE: src/pages/vendor/steps/VendorStepVehiclePricebook.tsx

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { Option } from "../vendorFormTypes";

type Props = {
  vendorId?: number;
  onBack: () => void;
  onFinish: () => void;
};

const gstTypes = [
  { id: "included", label: "Included" },
  { id: "excluded", label: "Excluded" },
];

export const VendorStepVehiclePricebook: React.FC<Props> = ({
  vendorId,
  onBack,
  onFinish,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dropdowns
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<Option[]>([]);
  const [gstPercentOptions, setGstPercentOptions] = useState<Option[]>([]);

  // ----- Vendor margin state -----
  const [vendorMarginPercent, setVendorMarginPercent] = useState<string>("0");
  const [vendorMarginGstType, setVendorMarginGstType] =
    useState<string>("included");
  const [vendorMarginGstPercent, setVendorMarginGstPercent] =
    useState<string>("0");

  // ----- Driver Cost state -----
  const [driverCosts, setDriverCosts] = useState<any[]>([]);

  // ----- Vehicles state -----
  const [vehicles, setVehicles] = useState<any[]>([]);

  // ----- Pricebook state -----
  const [localPricebook, setLocalPricebook] = useState<any[]>([]);
  const [outstationPricebook, setOutstationPricebook] = useState<any[]>([]);

  // ----- Local KM Limit modal -----
  const [localKmOpen, setLocalKmOpen] = useState(false);
  const [localKmForm, setLocalKmForm] = useState({
    vehicleType: "",
    title: "",
    hours: "",
    kmLimit: "",
  });

  // ----- Outstation KM Limit modal -----
  const [outKmOpen, setOutKmOpen] = useState(false);
  const [outKmForm, setOutKmForm] = useState({
    vehicleType: "",
    title: "",
    kmLimit: "",
  });

  useEffect(() => {
    if (vendorId) {
      fetchData();
      fetchDropdowns();
    }
  }, [vendorId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, dcRes, vehRes, lpRes, opRes] = await Promise.all([
        api(`/vendors/${vendorId}`),
        api(`/vendors/${vendorId}/vehicle-type-costs`),
        api(`/vendors/${vendorId}/vehicles`),
        api(`/vendors/${vendorId}/local-pricebook`),
        api(`/vendors/${vendorId}/outstation-pricebook`),
      ]);

      const v = vRes.vendor;
      setVendorMarginPercent(String(v.vendor_margin_percent || 0));
      setVendorMarginGstType(v.vendor_margin_gst_type || "included");
      setVendorMarginGstPercent(String(v.vendor_margin_gst_percentage || 0));

      setDriverCosts(dcRes as any[]);
      setVehicles(vehRes as any[]);
      setLocalPricebook(lpRes as any[]);
      setOutstationPricebook(opRes as any[]);
    } catch (e) {
      console.error("Failed to fetch pricebook data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [vtRes, gpRes] = await Promise.all([
        api("/dropdowns/vehicle-types"),
        api("/dropdowns/gst-percentages"),
      ]);
      setVehicleTypeOptions(vtRes as Option[]);
      setGstPercentOptions(gpRes as Option[]);
    } catch (e) {
      console.error("Failed to fetch dropdowns", e);
    }
  };

  const handleUpdateMargin = async () => {
    if (!vendorId) return;
    setSaving(true);
    try {
      await api(`/vendors/${vendorId}`, {
        method: "PATCH",
        body: JSON.stringify({
          vendor_margin_percent: Number(vendorMarginPercent),
          vendor_margin_gst_type: vendorMarginGstType,
          vendor_margin_gst_percentage: Number(vendorMarginGstPercent),
        }),
      });
      // Refresh
      await fetchData();
    } catch (e) {
      console.error("Failed to update margin", e);
    } finally {
      setSaving(false);
    }
  };

  const branchLabel = "Branch #1 - Unjhb"; // matches screenshot, can be wired later

  const gradientButton =
    "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600";

  const handleLocalKmChange = (
    field: keyof typeof localKmForm,
    value: string
  ) => {
    setLocalKmForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOutKmChange = (field: keyof typeof outKmForm, value: string) => {
    setOutKmForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocalKmSave = () => {
    // TODO: wire to backend
    setLocalKmOpen(false);
  };

  const handleOutKmSave = () => {
    // TODO: wire to backend
    setOutKmOpen(false);
  };

  const renderPricebookGrid = (type: "local" | "outstation") => {
    if (vehicles.length === 0) {
      return (
        <>
          <p className="mb-2 text-sm font-semibold text-pink-600">
            {branchLabel}
          </p>
          <p className="text-sm text-gray-500">
            No vehicles found for this branch.
          </p>
        </>
      );
    }

    const pbData = type === "local" ? localPricebook : outstationPricebook;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                Vehicle Name
              </th>
              {Array.from({ length: 31 }, (_, i) => (
                <th
                  key={i + 1}
                  className="min-w-[60px] px-2 py-3 text-center font-semibold text-gray-700"
                >
                  Day {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => {
              const entry = pbData.find((p: any) => p.vehicle_id === vehicle.id);
              return (
                <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    {vehicle.vehicle_name}
                  </td>
                  {Array.from({ length: 31 }, (_, i) => {
                    const dayKey = `day_${i + 1}`;
                    const val = entry ? entry[dayKey] : "";
                    return (
                      <td key={i + 1} className="px-1 py-2">
                        <Input
                          className="h-8 w-full text-center text-xs"
                          value={val || ""}
                          onChange={(e) => {
                            // In a real app, we'd update the state here
                            // For now, we'll just show the value
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-pink-600">Vehicle Pricebook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {!vendorId && (
            <p className="text-sm text-red-500">
              Save Basic Info first before editing pricebook.
            </p>
          )}

          {/* ========== Vendor Margin Details ========== */}
          <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Vendor Margin Details
              </h2>
              <Button
                type="button"
                className={`${gradientButton} px-6`}
                disabled={!vendorId || saving}
                onClick={handleUpdateMargin}
              >
                {saving ? "Updating..." : "Update"}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Vendor Margin %</Label>
                <Input
                  value={vendorMarginPercent}
                  onChange={(e) => setVendorMarginPercent(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Vendor Margin GST Type</Label>
                <Select
                  value={vendorMarginGstType}
                  onValueChange={setVendorMarginGstType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose GST Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {gstTypes.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Vendor Margin GST Percentage</Label>
                <Select
                  value={vendorMarginGstPercent}
                  onValueChange={setVendorMarginGstPercent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose GST %" />
                  </SelectTrigger>
                  <SelectContent>
                    {gstPercentOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* ========== Driver Cost Details ========== */}
          <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Driver Cost Details
              </h2>
              <Button
                type="button"
                className={`${gradientButton} px-6`}
                disabled={!vendorId}
                onClick={() => {}} // This usually redirects to Step 5 or updates here
              >
                Update
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      VEHICLE TYPE
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      DRIVER COST(₹)
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      FOOD COST(₹)
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      ACCOMMODATION COST(₹)
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      EXTRA COST(₹)
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      MORNING CHARGE(₹)
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      EVENING CHARGE(₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {driverCosts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-sm text-gray-500"
                      >
                        No more records found.
                      </td>
                    </tr>
                  ) : (
                    driverCosts.map((dc) => (
                      <tr key={dc.v_type_id}>
                        <td className="px-4 py-3 border-b border-gray-100">
                          {vehicleTypeOptions.find(o => o.id === String(dc.vehicle_type_id))?.label || dc.vehicle_type_id}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100">{dc.driver_bhatta}</td>
                        <td className="px-4 py-3 border-b border-gray-100">{dc.food_cost}</td>
                        <td className="px-4 py-3 border-b border-gray-100">{dc.accommodation_cost}</td>
                        <td className="px-4 py-3 border-b border-gray-100">{dc.extra_cost}</td>
                        <td className="px-4 py-3 border-b border-gray-100">{dc.morning_charges}</td>
                        <td className="px-4 py-3 border-b border-gray-100">{dc.evening_charges}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ========== Vehicle Extra Cost Details ========== */}
          <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Vehicle Extra Cost Details
              </h2>
              <Button
                type="button"
                className={`${gradientButton} px-6`}
                disabled={!vendorId}
              >
                Update
              </Button>
            </div>

            {vehicles.length === 0 ? (
              <p className="text-sm text-gray-500">
                No vehicles found for this vendor.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">VEHICLE NAME</th>
                      <th className="px-4 py-3 text-left font-semibold">VEHICLE NO</th>
                      <th className="px-4 py-3 text-left font-semibold">EXTRA KM COST(₹)</th>
                      <th className="px-4 py-3 text-left font-semibold">EXTRA HR COST(₹)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {vehicles.map((v) => (
                      <tr key={v.vehicle_id}>
                        <td className="px-4 py-3 border-b border-gray-100">{v.vehicle_name}</td>
                        <td className="px-4 py-3 border-b border-gray-100">{v.vehicle_no}</td>
                        <td className="px-4 py-3 border-b border-gray-100">{v.extra_km_cost}</td>
                        <td className="px-4 py-3 border-b border-gray-100">{v.extra_hr_cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ========== Local Pricebook ========== */}
          <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Vehicle Rental Cost Details | Local Pricebook
              </h2>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  className="bg-purple-100 px-6 text-sm font-semibold text-purple-700 hover:bg-purple-200"
                  onClick={() => setLocalKmOpen(true)}
                  disabled={!vendorId}
                >
                  + Add KM Limit
                </Button>
                <div className="hidden items-center gap-2 sm:flex">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    className="h-10 w-32 text-xs"
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    className="h-10 w-32 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  className={`${gradientButton} px-6`}
                  disabled={!vendorId}
                >
                  Update
                </Button>
              </div>
            </div>

            {renderPricebookGrid("local")}
          </section>

          {/* ========== Outstation Pricebook ========== */}
          <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Vehicle Rental Cost Details | Outstation Pricebook
              </h2>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  className="bg-purple-100 px-6 text-sm font-semibold text-purple-700 hover:bg-purple-200"
                  onClick={() => setOutKmOpen(true)}
                  disabled={!vendorId}
                >
                  + Add KM Limit
                </Button>
                <div className="hidden items-center gap-2 sm:flex">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    className="h-10 w-32 text-xs"
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    className="h-10 w-32 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  className={`${gradientButton} px-6`}
                  disabled={!vendorId}
                >
                  Update
                </Button>
              </div>
            </div>

            {renderPricebookGrid("outstation")}
          </section>

          {/* Wizard navigation */}
          <div className="mt-4 flex justify-between">
            <Button variant="outline" type="button" onClick={onBack}>
              Back
            </Button>
            <Button
              type="button"
              onClick={onFinish}
              disabled={!vendorId}
              className={gradientButton}
            >
              Save & Finish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ========== Local KM Limit Modal ========== */}
      <Dialog open={localKmOpen} onOpenChange={setLocalKmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Local KM Limit</DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="space-y-1">
              <Label>
                Vehicle type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={localKmForm.vehicleType}
                onValueChange={(v) => handleLocalKmChange("vehicleType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Title"
                value={localKmForm.title}
                onChange={(e) => handleLocalKmChange("title", e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>
                  Hours <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter Hours"
                  value={localKmForm.hours}
                  onChange={(e) =>
                    handleLocalKmChange("hours", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Kilometer(KM) <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="KM Limit"
                  value={localKmForm.kmLimit}
                  onChange={(e) =>
                    handleLocalKmChange("kmLimit", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-between">
            <Button
              type="button"
              variant="outline"
              className="px-6"
              onClick={() => setLocalKmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={`${gradientButton} px-8`}
              onClick={handleLocalKmSave}
              disabled={!vendorId}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Outstation KM Limit Modal ========== */}
      <Dialog open={outKmOpen} onOpenChange={setOutKmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Outstation KM Limit</DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="space-y-1">
              <Label>
                Vehicle type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={outKmForm.vehicleType}
                onValueChange={(v) => handleOutKmChange("vehicleType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>
                Outstation KM Limit Title{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Outstation KM Limit Title"
                value={outKmForm.title}
                onChange={(e) => handleOutKmChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>
                Outstation KM Limit <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Outstation KM Limit"
                value={outKmForm.kmLimit}
                onChange={(e) =>
                  handleOutKmChange("kmLimit", e.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-between">
            <Button
              type="button"
              variant="outline"
              className="px-6"
              onClick={() => setOutKmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={`${gradientButton} px-8`}
              onClick={handleOutKmSave}
              disabled={!vendorId}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

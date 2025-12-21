// FILE: src/pages/vendor/steps/VendorStepVehicle.tsx

import React, { useEffect, useMemo, useState } from "react";
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
import { CarFront, Star } from "lucide-react";
import { api } from "@/lib/api";
import { Option } from "../vendorFormTypes";

type Props = {
  vendorId?: number;
  onBack: () => void;
  onNext: () => void;
};

type Branch = {
  id: number;
  name: string;
  vehicleCount: number;
};

type VehicleRow = {
  id: number;
  regNo: string;
  vehicleType: string;
  fcExpiryDate: string;
  status: number;
  statusLabel: string;
};

export const VendorStepVehicle: React.FC<Props> = ({
  vendorId,
  onBack,
  onNext,
}) => {
  /** ---------------- BRANCH + TABLE STATE ---------------- */
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [vehicleRows, setVehicleRows] = useState<VehicleRow[]>([]);
  const [search, setSearch] = useState("");
  const [isVehicleListOpen, setIsVehicleListOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dropdowns
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<Option[]>([]);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [stateOptions, setStateOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId),
    [branches, selectedBranchId]
  );

  useEffect(() => {
    if (vendorId) {
      fetchBranches();
      fetchVehicles();
      fetchDropdowns();
    }
  }, [vendorId]);

  const fetchBranches = async () => {
    try {
      const data = await api(`/vendors/${vendorId}`);
      const mapped = (data as any).branches.map((b: any) => ({
        id: b.vendor_branch_id,
        name: b.branch_name,
        vehicleCount: 0, // We'll update this if needed
      }));
      setBranches(mapped);
      if (mapped.length > 0 && !selectedBranchId) {
        setSelectedBranchId(mapped[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch branches", e);
    }
  };

  const fetchVehicles = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const data = (await api(`/vendors/${vendorId}/vehicles`)) as any[];
      const mapped = data.map((v: any) => ({
        id: v.vehicle_id,
        regNo: v.registration_number || "",
        vehicleType: String(v.vehicle_type_id || ""),
        fcExpiryDate: v.vehicle_fc_expiry_date ? v.vehicle_fc_expiry_date.split('T')[0] : "",
        status: v.status,
        statusLabel: v.status === 1 ? "Active" : "Inactive",
        branchId: v.vendor_branch_id,
        _full: v, // Store full object for editing
      }));
      setVehicleRows(mapped);
    } catch (e) {
      console.error("Failed to fetch vehicles", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [vtRes, cRes] = await Promise.all([
        api("/dropdowns/vehicle-types"),
        api("/dropdowns/countries"),
      ]);
      setVehicleTypeOptions(vtRes as Option[]);
      setCountryOptions(cRes as Option[]);
    } catch (e) {
      console.error("Failed to fetch dropdowns", e);
    }
  };

  const filteredRows = useMemo(() => {
    let rows = vehicleRows;
    if (selectedBranchId) {
      rows = rows.filter((r: any) => r.branchId === selectedBranchId);
    }
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.regNo.toLowerCase().includes(q) ||
        r.vehicleType.toLowerCase().includes(q)
    );
  }, [vehicleRows, search, selectedBranchId]);

  /** ---------------- ADD VEHICLE FORM TOGGLE ---------------- */
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);

  /** ---------------- VEHICLE FORM STATE ---------------- */
  const emptyVehicleForm = {
    vehicleType: "",
    registrationNumber: "",
    registrationDate: "",
    engineNumber: "",
    ownerName: "",
    ownerContactNumber: "",
    ownerEmailId: "",
    ownerAddress: "",
    ownerPincode: "",
    country: "",
    vehicleOrigin: "",
    state: "",
    city: "",
    chassisNumber: "",
    vehicleExpiryDate: "",
    fuelType: "",
    extraKmCharge: "",
    earlyMorningCharges: "",
    eveningCharges: "",
    vehicleVideoUrl: "",
    insurancePolicyNumber: "",
    insuranceStartDate: "",
    insuranceEndDate: "",
    insuranceContactNumber: "",
    rtoCode: "",
  };

  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);

  useEffect(() => {
    if (vehicleForm.country) {
      api(`/dropdowns/states?countryId=${vehicleForm.country}`).then((res) =>
        setStateOptions(res as Option[])
      );
    }
  }, [vehicleForm.country]);

  useEffect(() => {
    if (vehicleForm.state) {
      api(`/dropdowns/cities?stateId=${vehicleForm.state}`).then((res) =>
        setCityOptions(res as Option[])
      );
    }
  }, [vehicleForm.state]);

  const handleFieldChange = (
    field: keyof typeof vehicleForm,
    value: string
  ) => {
    setVehicleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveVehicle = async () => {
    if (!vendorId || !selectedBranchId) return;
    setSaving(true);
    try {
      const payload = {
        vendor_branch_id: selectedBranchId,
        vehicle_type_id: Number(vehicleForm.vehicleType),
        registration_number: vehicleForm.registrationNumber,
        registration_date: vehicleForm.registrationDate ? new Date(vehicleForm.registrationDate) : null,
        engine_number: vehicleForm.engineNumber,
        owner_name: vehicleForm.ownerName,
        owner_contact_no: vehicleForm.ownerContactNumber,
        owner_email_id: vehicleForm.ownerEmailId,
        owner_address: vehicleForm.ownerAddress,
        owner_pincode: vehicleForm.ownerPincode,
        owner_country: Number(vehicleForm.country),
        owner_state: vehicleForm.state,
        owner_city: vehicleForm.city,
        chassis_number: vehicleForm.chassisNumber,
        vehicle_fc_expiry_date: vehicleForm.vehicleExpiryDate ? new Date(vehicleForm.vehicleExpiryDate) : null,
        fuel_type: Number(vehicleForm.fuelType),
        extra_km_charge: Number(vehicleForm.extraKmCharge),
        early_morning_charges: Number(vehicleForm.earlyMorningCharges),
        evening_charges: Number(vehicleForm.eveningCharges),
        vehicle_video_url: vehicleForm.vehicleVideoUrl,
        insurance_policy_number: vehicleForm.insurancePolicyNumber,
        insurance_start_date: vehicleForm.insuranceStartDate ? new Date(vehicleForm.insuranceStartDate) : null,
        insurance_end_date: vehicleForm.insuranceEndDate ? new Date(vehicleForm.insuranceEndDate) : null,
        insurance_contact_no: vehicleForm.insuranceContactNumber,
        RTO_code: vehicleForm.rtoCode,
      };

      if (editingVehicleId) {
        await api(`/vendors/vehicles/${editingVehicleId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/vendors/${vendorId}/vehicles`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      
      await fetchVehicles();
      setIsAddMode(false);
      setIsVehicleListOpen(true);
      setEditingVehicleId(null);
      setVehicleForm(emptyVehicleForm);
    } catch (e) {
      console.error("Failed to save vehicle", e);
    } finally {
      setSaving(false);
    }
  };

  const handleEditVehicle = (row: VehicleRow) => {
    const v = (row as any)._full;
    if (!v) return;

    setEditingVehicleId(v.vehicle_id);
    setVehicleForm({
      vehicleType: String(v.vehicle_type_id || ""),
      registrationNumber: v.registration_number || "",
      registrationDate: v.registration_date ? v.registration_date.split('T')[0] : "",
      engineNumber: v.engine_number || "",
      ownerName: v.owner_name || "",
      ownerContactNumber: v.owner_contact_no || "",
      ownerEmailId: v.owner_email_id || "",
      ownerAddress: v.owner_address || "",
      ownerPincode: v.owner_pincode || "",
      country: String(v.owner_country || ""),
      vehicleOrigin: "", // Not in schema?
      state: v.owner_state || "",
      city: v.owner_city || "",
      chassisNumber: v.chassis_number || "",
      vehicleExpiryDate: v.vehicle_fc_expiry_date ? v.vehicle_fc_expiry_date.split('T')[0] : "",
      fuelType: String(v.fuel_type || ""),
      extraKmCharge: String(v.extra_km_charge || ""),
      earlyMorningCharges: String(v.early_morning_charges || ""),
      eveningCharges: String(v.evening_charges || ""),
      vehicleVideoUrl: v.vehicle_video_url || "",
      insurancePolicyNumber: v.insurance_policy_number || "",
      insuranceStartDate: v.insurance_start_date ? v.insurance_start_date.split('T')[0] : "",
      insuranceEndDate: v.insurance_end_date ? v.insurance_end_date.split('T')[0] : "",
      insuranceContactNumber: v.insurance_contact_no || "",
      rtoCode: v.RTO_code || "",
    });
    setIsAddMode(true);
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await api(`/vendors/vehicles/${id}`, { method: "DELETE" });
      await fetchVehicles();
    } catch (e) {
      console.error("Failed to delete vehicle", e);
    }
  };

  /** ---------------- RENDER HELPERS ---------------- */

  const renderBranchList = () => (
    <div className="space-y-3">
      <h2 className="text-pink-600 text-lg font-semibold">List of Branch</h2>

      {branches.length === 0 ? (
        <p className="text-sm text-gray-500">No branches found for this vendor.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {branches.map((branch) => {
            const initial = branch.name.charAt(0).toUpperCase();
            const isActive = branch.id === selectedBranch?.id;

            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => {
                  setSelectedBranchId(branch.id);
                  setIsAddMode(false);
                  setIsVehicleListOpen(true); // 👉 clicking branch opens vehicle list
                }}
                className={`flex items-center justify-between rounded-3xl border px-6 py-3 text-left shadow-sm transition 
                ${
                  isActive
                    ? "border-purple-300 ring-1 ring-purple-200 bg-white"
                    : "border-purple-200 bg-white hover:border-purple-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-lg font-semibold text-pink-600">
                    {initial}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {branch.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1">
                    <CarFront className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-700">
                      {branch.vehicleCount}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">▾</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderVehicleList = () => (
    <div className="mt-8 space-y-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-700">
          Vehicle List in{" "}
          <span className="font-semibold text-pink-600">
            {selectedBranch?.name}
          </span>
        </span>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {/* CLOSE only hides the vehicle list and returns to “only branch” view */}
          <Button
            type="button"
            variant="outline"
            className="bg-red-50 text-red-500 border-red-200 px-6"
            onClick={() => {
              setIsVehicleListOpen(false);
              setIsAddMode(false);
            }}
          >
            Close
          </Button>
          <Button
            type="button"
            className="bg-purple-500 text-white hover:bg-purple-600 px-6"
            onClick={() => setIsAddMode(true)}
            disabled={!vendorId}
          >
            + Add vehicle
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
          >
            Copy
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs text-green-600 border-green-300"
          >
            Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
          >
            CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs text-red-500 border-red-300"
          >
            PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 text-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Search:</span>
          <Input
            className="h-8 w-52 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              {[
                "S.NO",
                "ACTION",
                "VEHICLE REG. NO",
                "VEHICLE TYPE",
                "FC EXPIRY DATE",
                "STATUS",
                "STATUS LABEL",
              ].map((col) => (
                <th
                  key={col}
                  className="border-b border-gray-200 px-4 py-3 text-left font-semibold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredRows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-sm text-gray-500"
                  colSpan={7}
                >
                  No data available in table
                </td>
              </tr>
            )}
            {filteredRows.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="border-b border-gray-100 px-4 py-3">
                  {index + 1}
                </td>
                <td className="border-b border-gray-100 px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-600"
                      onClick={() => handleEditVehicle(row)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600"
                      onClick={() => handleDeleteVehicle(row.id)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
                <td className="border-b border-gray-100 px-4 py-3">
                  {row.regNo}
                </td>
                <td className="border-b border-gray-100 px-4 py-3">
                  {vehicleTypeOptions.find(o => o.id === row.vehicleType)?.label || row.vehicleType}
                </td>
                <td className="border-b border-gray-100 px-4 py-3">
                  {row.fcExpiryDate}
                </td>
                <td className="border-b border-gray-100 px-4 py-3">
                  {row.status}
                </td>
                <td className="border-b border-gray-100 px-4 py-3">
                  {row.statusLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 text-xs text-gray-500 sm:flex-row sm:items-center">
        <span>
          Showing 0 to {filteredRows.length} of {vehicleRows.length} entries
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-4 text-xs"
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-4 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSectionDivider = (title: string) => (
    <div className="my-8 flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />
      <div className="flex items-center gap-1 text-pink-500">
        <Star className="h-4 w-4 fill-pink-500" />
        <span className="text-sm font-semibold">{title}</span>
        <Star className="h-4 w-4 fill-pink-500" />
      </div>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );

  const renderAddVehicleForm = () => (
    <div className="mt-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Add Vehicle for{" "}
            <span className="text-pink-600">{selectedBranch?.name}</span>
          </h2>
          <p className="mt-2 text-sm font-semibold text-pink-600">
            Vehicle Basic Info
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="bg-gray-100 px-6"
          onClick={() => {
            setIsAddMode(false);
            setIsVehicleListOpen(true);
          }}
        >
          Back to list
        </Button>
      </div>

      {/* ------- BASIC INFO GRID ------- */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* row 1 */}
        <div className="space-y-1">
          <Label>
            Vehicle Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={vehicleForm.vehicleType}
            onValueChange={(v) => handleFieldChange("vehicleType", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypeOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>
            Registration Number <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Registration Number"
            value={vehicleForm.registrationNumber}
            onChange={(e) =>
              handleFieldChange("registrationNumber", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            Registration Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={vehicleForm.registrationDate}
            onChange={(e) =>
              handleFieldChange("registrationDate", e.target.value)
            }
          />
        </div>

        {/* row 2 */}
        <div className="space-y-1">
          <Label>
            Engine Number <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Engine Number"
            value={vehicleForm.engineNumber}
            onChange={(e) =>
              handleFieldChange("engineNumber", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            Owner Name <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Owner Name"
            value={vehicleForm.ownerName}
            onChange={(e) => handleFieldChange("ownerName", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>
            Owner Contact Number <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Owner Contact Number"
            value={vehicleForm.ownerContactNumber}
            onChange={(e) =>
              handleFieldChange("ownerContactNumber", e.target.value)
            }
          />
        </div>

        {/* row 3 */}
        <div className="space-y-1">
          <Label>Owner Email ID</Label>
          <Input
            placeholder="Owner Email ID"
            value={vehicleForm.ownerEmailId}
            onChange={(e) =>
              handleFieldChange("ownerEmailId", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            Owner Address <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Owner Address"
            value={vehicleForm.ownerAddress}
            onChange={(e) =>
              handleFieldChange("ownerAddress", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            Owner Pincode <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Owner Pincode"
            value={vehicleForm.ownerPincode}
            onChange={(e) =>
              handleFieldChange("ownerPincode", e.target.value)
            }
          />
        </div>

        {/* row 4 */}
        <div className="space-y-1">
          <Label>
            Country <span className="text-red-500">*</span>
          </Label>
          <Select
            value={vehicleForm.country}
            onValueChange={(v) => handleFieldChange("country", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose Country" />
            </SelectTrigger>
            <SelectContent>
              {countryOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>
            Vehicle Origin <span className="text-red-500">*</span>
          </Label>
          <Select
            value={vehicleForm.vehicleOrigin}
            onValueChange={(v) => handleFieldChange("vehicleOrigin", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose Vehicle Origin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Own</SelectItem>
              <SelectItem value="2">Attached</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>
            State <span className="text-red-500">*</span>
          </Label>
          <Select
            value={vehicleForm.state}
            onValueChange={(v) => handleFieldChange("state", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose State" />
            </SelectTrigger>
            <SelectContent>
              {stateOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* row 5 */}
        <div className="space-y-1">
          <Label>
            City <span className="text-red-500">*</span>
          </Label>
          <Select
            value={vehicleForm.city}
            onValueChange={(v) => handleFieldChange("city", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose City" />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>
            Chassis Number <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Chassis Number"
            value={vehicleForm.chassisNumber}
            onChange={(e) =>
              handleFieldChange("chassisNumber", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            Vehicle Expiry Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={vehicleForm.vehicleExpiryDate}
            onChange={(e) =>
              handleFieldChange("vehicleExpiryDate", e.target.value)
            }
          />
        </div>

        {/* row 6 */}
        <div className="space-y-1">
          <Label>
            Fuel Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={vehicleForm.fuelType}
            onValueChange={(v) => handleFieldChange("fuelType", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose Any One" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Diesel</SelectItem>
              <SelectItem value="2">Petrol</SelectItem>
              <SelectItem value="3">CNG</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>
            Extra KM Charge (₹) <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Extra KM Charge"
            value={vehicleForm.extraKmCharge}
            onChange={(e) =>
              handleFieldChange("extraKmCharge", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            Early Morning Charges (₹)(Before 6 AM){" "}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Early Morning Charges"
            value={vehicleForm.earlyMorningCharges}
            onChange={(e) =>
              handleFieldChange("earlyMorningCharges", e.target.value)
            }
          />
        </div>

        {/* row 7 */}
        <div className="space-y-1">
          <Label>
            Evening Charges (₹)(After 8 PM){" "}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Evening Charges"
            value={vehicleForm.eveningCharges}
            onChange={(e) =>
              handleFieldChange("eveningCharges", e.target.value)
            }
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>
            Vehicle Video URL <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Enter Video url"
            value={vehicleForm.vehicleVideoUrl}
            onChange={(e) =>
              handleFieldChange("vehicleVideoUrl", e.target.value)
            }
          />
        </div>
      </div>

      {renderSectionDivider("Insurance & FC Details")}

      {/* INSURANCE & FC DETAILS */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label>
            Insurance Policy Number <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Insurance Policy Number"
            value={vehicleForm.insurancePolicyNumber}
            onChange={(e) =>
              handleFieldChange("insurancePolicyNumber", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            Insurance Start Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={vehicleForm.insuranceStartDate}
            onChange={(e) =>
              handleFieldChange("insuranceStartDate", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            Insurance End Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={vehicleForm.insuranceEndDate}
            onChange={(e) =>
              handleFieldChange("insuranceEndDate", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            Insurance Contact Number <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Insurance Contact Number"
            value={vehicleForm.insuranceContactNumber}
            onChange={(e) =>
              handleFieldChange("insuranceContactNumber", e.target.value)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>
            RTO Code <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="RTO Code"
            value={vehicleForm.rtoCode}
            onChange={(e) => handleFieldChange("rtoCode", e.target.value)}
          />
        </div>
      </div>

      {renderSectionDivider("Upload")}

      {/* UPLOAD AREA */}
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
          <span className="text-4xl text-gray-300">📄</span>
        </div>
        <p className="text-sm font-medium text-gray-500">No Documents Found</p>
        <Button
          type="button"
          className="mt-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 px-6"
        >
          + Upload File
        </Button>
      </div>

      {/* FORM BOTTOM BUTTONS */}
      <div className="mt-6 flex justify-between">
        <Button
          type="button"
          variant="outline"
          className="bg-gray-100 px-8"
          onClick={() => {
            setIsAddMode(false);
            setIsVehicleListOpen(true);
          }}
        >
          Back
        </Button>
        <Button
          type="button"
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 px-10"
          onClick={handleSaveVehicle}
          disabled={saving || !vendorId}
        >
          {saving ? "Saving..." : editingVehicleId ? "Update Vehicle" : "Save Vehicle"}
        </Button>
      </div>
    </div>
  );

  /** ---------------- MAIN RENDER ---------------- */

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-pink-600">Vehicle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!vendorId && (
          <p className="text-sm text-red-500">
            Save Basic Info first before managing vehicles.
          </p>
        )}

        {/* LIST VIEW vs ADD FORM */}
        {!isAddMode ? (
          <>
            {renderBranchList()}

            {/* 👉 Vehicle list only visible when branch is clicked */}
            {selectedBranch && isVehicleListOpen && renderVehicleList()}

            {/* wizard nav visible only in list/branch mode */}
            <div className="mt-8 flex justify-between">
              <Button variant="outline" type="button" onClick={onBack}>
                Back
              </Button>
              <Button
                type="button"
                onClick={onNext}
                disabled={!vendorId}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
              >
                Save &amp; Next
              </Button>
            </div>
          </>
        ) : (
          renderAddVehicleForm()
        )}
      </CardContent>
    </Card>
  );
};

import React, { useState } from "react";
import { toast } from "sonner";
import { ItineraryService } from "../services/itinerary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export interface ItineraryVehicleRow {
  vendorName?: string | null;
  branchName?: string | null;
  vehicleOrigin?: string | null;
  totalQty?: string | null;
  totalAmount?: number | string | null;
  rentalCharges?: number | string | null;
  tollCharges?: number | string | null;
  parkingCharges?: number | string | null;
  driverCharges?: number | string | null;
  permitCharges?: number | string | null;
  before6amDriver?: number | string | null;
  after8pmDriver?: number | string | null;
  before6amVendor?: number | string | null;
  after8pmVendor?: number | string | null;
  imageUrl?: string | null;
  dayLabel?: string | null;
  fromLabel?: string | null;
  toLabel?: string | null;
  packageLabel?: string | null;
  col1Distance?: string | null;
  col1Duration?: string | null;
  col2Distance?: string | null;
  col2Duration?: string | null;
  col3Distance?: string | null;
  col3Duration?: string | null;
  vendorEligibleId?: number;
  vehicleTypeId?: number;
  isAssigned?: boolean;
}

const formatCurrencyINR = (value: number | string | undefined | null) => {
  const n =
    typeof value === "number" ? value : parseFloat((value as string) || "0");
  if (Number.isNaN(n)) return "₹ 0.00";
  return `₹ ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const safe = (v?: string | null) => v || "";

export type VehicleListProps = {
  vehicleTypeLabel: string;
  vehicles: ItineraryVehicleRow[];
  itineraryPlanId?: number;
  onRefresh?: () => void;
};

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicleTypeLabel,
  vehicles,
  itineraryPlanId,
  onRefresh,
}) => {
  const [expandedVendorIndex, setExpandedVendorIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    // Find the first assigned vendor
    const assignedIndex = vehicles.findIndex(v => v.isAssigned);
    return assignedIndex >= 0 ? assignedIndex : null;
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingVendorSelection, setPendingVendorSelection] = useState<{
    index: number;
    vendorEligibleId: number;
    vehicleTypeId: number;
    vendorName: string;
  } | null>(null);
  const [isUpdatingVehicle, setIsUpdatingVehicle] = useState(false);

  const handleRowClick = (index: number) => {
    setExpandedVendorIndex((prev) => (prev === index ? null : index));
  };

  const handleRadioChange = (index: number) => {
    const vendor = vehicles[index];
    
    console.log("handleRadioChange called", { 
      index, 
      vendor, 
      itineraryPlanId,
      vendorEligibleId: vendor?.vendorEligibleId,
      vehicleTypeId: vendor?.vehicleTypeId
    });

    if (!vendor || !itineraryPlanId || !vendor.vendorEligibleId || !vendor.vehicleTypeId) {
      console.error("Missing required vendor data", { vendor, itineraryPlanId });
      toast.error("Missing required vendor data");
      return;
    }

    setPendingVendorSelection({
      index,
      vendorEligibleId: vendor.vendorEligibleId,
      vehicleTypeId: vendor.vehicleTypeId,
      vendorName: vendor.vendorName || "Unknown Vendor",
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmSelection = async () => {
    if (!pendingVendorSelection || !itineraryPlanId) return;

    setIsUpdatingVehicle(true);
    try {
      await ItineraryService.selectVehicleVendor(
        itineraryPlanId,
        pendingVendorSelection.vehicleTypeId,
        pendingVendorSelection.vendorEligibleId
      );

      toast.success("Vehicle vendor changed successfully. Please update the amount.");
      setSelectedIndex(pendingVendorSelection.index);
      setShowConfirmDialog(false);
      setPendingVendorSelection(null);
      setExpandedVendorIndex(null);

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to select vehicle vendor:", error);
      toast.error("Failed to update vehicle vendor");
    } finally {
      setIsUpdatingVehicle(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mt-1">
      <h5 className="text-base font-bold uppercase mb-4">
        VEHICLE LIST FOR{" "}
        <span className="text-purple-600">"{vehicleTypeLabel}"</span>
      </h5>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-600 uppercase text-xs w-12">#</th>
              <th className="text-left py-3 px-2 font-semibold text-gray-600 uppercase text-xs">VENDOR NAME</th>
              <th className="text-left py-3 px-2 font-semibold text-gray-600 uppercase text-xs">BRANCH NAME</th>
              <th className="text-left py-3 px-2 font-semibold text-gray-600 uppercase text-xs">VEHICLE ORIGIN</th>
              <th className="text-left py-3 px-2 font-semibold text-gray-600 uppercase text-xs">TOTAL QTY</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-600 uppercase text-xs">TOTAL AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v, index) => {
              const isExpanded = expandedVendorIndex === index;
              const radioId = `vehicle_${index}`;

              const qty = parseInt(v.totalQty || "0", 10) || 0;
              const totalAmtNum =
                typeof v.totalAmount === "number"
                  ? v.totalAmount
                  : parseFloat(v.totalAmount || "0") || 0;

              const parseN = (val: number | string | undefined | null) =>
                typeof val === "number"
                  ? val
                  : parseFloat((val as string) || "0") || 0;

              const rental = parseN(v.rentalCharges ?? v.totalAmount);
              const toll = parseN(v.tollCharges);
              const parking = parseN(v.parkingCharges);
              const driver = parseN(v.driverCharges);
              const permit = parseN(v.permitCharges);
              const b6d = parseN(v.before6amDriver);
              const a8d = parseN(v.after8pmDriver);
              const b6v = parseN(v.before6amVendor);
              const a8v = parseN(v.after8pmVendor);
              const grandTotal = rental + toll + parking + driver + permit + b6d + a8d + b6v + a8v;

              return (
                <React.Fragment key={index}>
                  {/* Main Row */}
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(index)}
                  >
                    <td className="py-3 px-2">
                      <input
                        type="radio"
                        id={radioId}
                        name="selected_vehicle"
                        checked={selectedIndex === index}
                        onChange={() => handleRadioChange(index)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                    </td>
                    <td className="py-3 px-2 text-gray-800">{safe(v.vendorName)}</td>
                    <td className="py-3 px-2 text-gray-800">{safe(v.branchName)}</td>
                    <td className="py-3 px-2 text-gray-800">{safe(v.vehicleOrigin)}</td>
                    <td className="py-3 px-2 text-gray-800">
                      {qty} x {formatCurrencyINR(totalAmtNum)}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-gray-800">
                      {formatCurrencyINR(totalAmtNum)}
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <div className="flex flex-wrap gap-6 p-4 bg-white">
                          {/* Left: Vehicle Image */}
                          <div className="w-[280px] flex-shrink-0">
                            <div className="relative rounded-lg overflow-hidden">
                              <img
                                src={v.imageUrl || "https://www.b2b.dvi.co.in/head/uploads/no-photo.png"}
                                alt="Vehicle"
                                className="w-full h-[180px] object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900/90 to-purple-600/70 text-white p-3">
                                <div className="text-xs mb-1">
                                  {safe(v.dayLabel) || "Day-1 | 05 Dec 2025 | Outstation"}
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold truncate">
                                  <span className="truncate">{safe(v.fromLabel) || "CHENNAI IN..."}</span>
                                  <span>➔</span>
                                  <span className="truncate">{safe(v.toLabel) || "CHENNAI C..."}</span>
                                </div>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-700">
                              {safe(v.packageLabel) || "Outstation - 250KM"}
                            </p>
                          </div>

                          {/* Middle: Distance Columns */}
                          <div className="flex gap-8 items-start pt-2">
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-800">
                                {safe(v.col1Distance) || "30.22 KM"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {safe(v.col1Duration) || "0 Min"}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-800">
                                {safe(v.col2Distance) || "0.00 KM"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {safe(v.col2Duration) || "0 Min"}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-800">
                                {safe(v.col3Distance) || "30.22 KM"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {safe(v.col3Duration) || "0 Min"}
                              </div>
                            </div>
                          </div>

                          {/* Right: Charges Breakdown */}
                          <div className="flex-1 min-w-[280px]">
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Rental Charges</span>
                                <span className="text-gray-800">{formatCurrencyINR(rental)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Toll Charges</span>
                                <span className="text-gray-800">{formatCurrencyINR(toll)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Parking Charges</span>
                                <span className="text-gray-800">{formatCurrencyINR(parking)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Driver Charges</span>
                                <span className="text-gray-800">{formatCurrencyINR(driver)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Permit Charges</span>
                                <span className="text-gray-800">{formatCurrencyINR(permit)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Before 6AM Charges for Driver</span>
                                <span className="text-gray-800">{formatCurrencyINR(b6d)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Before 6AM Charges for Vendor</span>
                                <span className="text-gray-800">{formatCurrencyINR(b6v)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">After 8PM Charges for Driver</span>
                                <span className="text-gray-800">{formatCurrencyINR(a8d)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">After 8PM Charges for Vendor</span>
                                <span className="text-gray-800">{formatCurrencyINR(a8v)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
                                <span className="text-gray-800">Total Amount</span>
                                <span className="text-gray-900">{formatCurrencyINR(grandTotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <DialogTitle className="text-lg">Confirm Vendor Selection</DialogTitle>
            </div>
            <DialogDescription className="pt-4">
              Are you sure you want to select <strong>{pendingVendorSelection?.vendorName}</strong> as the vendor for <strong>{vehicleTypeLabel}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingVendorSelection(null);
              }}
              disabled={isUpdatingVehicle}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSelection}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isUpdatingVehicle}
            >
              {isUpdatingVehicle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

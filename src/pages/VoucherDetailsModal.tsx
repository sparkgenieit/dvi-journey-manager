import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItineraryService } from "@/services/itinerary";
import { Loader2, Printer, MapPin, Calendar, Car, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoucherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryPlanId: number;
}

export const VoucherDetailsModal: React.FC<VoucherDetailsModalProps> = ({
  isOpen,
  onClose,
  itineraryPlanId,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && itineraryPlanId) {
      fetchData();
    }
  }, [isOpen, itineraryPlanId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await ItineraryService.getVoucherDetails(itineraryPlanId);
      setData(res);
    } catch (error) {
      console.error("Error fetching voucher details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Service Voucher</span>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#d546ab]" />
          </div>
        ) : data ? (
          <div className="p-8 bg-white text-black print:p-0">
            <div className="text-center mb-8 border-b pb-6">
              <h1 className="text-3xl font-bold text-[#d546ab]">SERVICE VOUCHER</h1>
              <p className="text-gray-500 mt-1">Quote ID: {data.quoteId}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase text-gray-400">Guest Information</h3>
                <p className="text-lg font-bold">{data.adults} Adults, {data.children} Children, {data.infants} Infants</p>
                <p className="text-sm text-gray-600">Date Range: {data.dateRange}</p>
              </div>
              <div className="space-y-2 text-right">
                <h3 className="text-sm font-bold uppercase text-gray-400">Accommodation Summary</h3>
                <p className="text-sm">Rooms: {data.roomCount}</p>
                <p className="text-sm">Extra Beds: {data.extraBed}</p>
              </div>
            </div>

            {/* Hotels Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#4a4260]">
                <Building2 className="h-5 w-5 text-[#d546ab]" />
                Hotel Accommodations
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Location</th>
                      <th className="py-3 px-4 text-left">Hotel</th>
                      <th className="py-3 px-4 text-left">Room Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.days.filter((d: any) => d.hotel).map((day: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-3 px-4">{day.date}</td>
                        <td className="py-3 px-4">{day.location}</td>
                        <td className="py-3 px-4 font-semibold">{day.hotel.name}</td>
                        <td className="py-3 px-4">{day.hotel.roomType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicles Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#4a4260]">
                <Car className="h-5 w-5 text-[#d546ab]" />
                Transportation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.vehicles.map((v: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                    <p className="font-bold text-[#d546ab]">{v.vendorName}</p>
                    <p className="text-sm font-semibold">{v.totalQty} x {v.packageLabel || 'Vehicle'}</p>
                    <p className="text-xs text-gray-500 mt-1">Origin: {v.vehicleOrigin}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 pt-8 border-t text-center text-xs text-gray-400">
              <p>Doview Holidays India Pvt Ltd - Your Travel Partner</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            Failed to load voucher details.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItineraryService } from "@/services/itinerary";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PluckCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryPlanId: number;
}

export const PluckCardModal: React.FC<PluckCardModalProps> = ({
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
      const res = await ItineraryService.getPluckCardData(itineraryPlanId);
      setData(res);
    } catch (error) {
      console.error("Error fetching pluck card data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Pluck Card (Welcome PDF)</span>
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
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white text-black print:border-0 print:p-0">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-[#d546ab] mb-2">WELCOME</h1>
              <div className="w-24 h-1 bg-[#d546ab] mx-auto"></div>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Guest Name</p>
                <p className="text-3xl font-bold">{data.guestName}</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="text-center border-r border-gray-100">
                  <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Arrival</p>
                  <p className="font-semibold">{data.arrivalLocation}</p>
                  <p className="text-sm">{data.arrivalDateTime ? new Date(data.arrivalDateTime).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Departure</p>
                  <p className="font-semibold">{data.departureLocation}</p>
                  <p className="text-sm">{data.departureDateTime ? new Date(data.departureDateTime).toLocaleString() : 'N/A'}</p>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Contact Number</p>
                <p className="text-xl font-semibold">{data.contactNo}</p>
              </div>

              {data.flightDetails && (
                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Flight Details</p>
                  <p className="text-md italic">{data.flightDetails}</p>
                </div>
              )}
            </div>

            <div className="mt-12 text-center text-gray-400 text-xs">
              <p>Doview Holidays India Pvt Ltd</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            Failed to load pluck card data.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

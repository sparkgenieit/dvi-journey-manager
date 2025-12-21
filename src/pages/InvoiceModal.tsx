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

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryPlanId: number;
  type?: 'tax' | 'proforma';
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  itineraryPlanId,
  type = 'tax',
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
      const res = await ItineraryService.getInvoiceData(itineraryPlanId);
      setData(res);
    } catch (error) {
      console.error("Error fetching invoice data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{type === 'tax' ? 'Tax Invoice' : 'Proforma Invoice'}</span>
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
            <div className="flex justify-between mb-8 border-b pb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#d546ab]">{data.company?.company_name || 'Doview Holidays India Pvt Ltd'}</h1>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {data.company?.address}
                </p>
                <p className="text-sm font-semibold mt-2">GSTIN: {data.company?.gst_no}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold uppercase text-gray-400">Invoice</h2>
                <p className="text-sm">No: INV-{data.itinerary?.itinerary_quote_ID}</p>
                <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xs uppercase font-bold text-gray-400 mb-2">Bill To:</h3>
                <p className="font-bold">{data.agent?.agent_name}</p>
                <p className="text-sm text-gray-600">{data.agent?.agent_address}</p>
                <p className="text-sm">GSTIN: {data.agent?.agent_gst_no || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase font-bold text-gray-400 mb-2">Guest Details:</h3>
                <p className="font-bold">{data.guest?.customer_name}</p>
                <p className="text-sm">Contact: {data.guest?.customer_contact_no}</p>
                <p className="text-sm">Itinerary: {data.itinerary?.itinerary_quote_ID}</p>
              </div>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="bg-gray-50 border-y">
                  <th className="py-3 px-4 text-left text-sm font-bold">Description</th>
                  <th className="py-3 px-4 text-right text-sm font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-4">
                    <p className="font-semibold">Tour Package Charges</p>
                    <p className="text-xs text-gray-500">
                      {data.itinerary?.arrival_location} to {data.itinerary?.departure_location}
                      ({new Date(data.itinerary?.trip_start_date_and_time).toLocaleDateString()} - {new Date(data.itinerary?.trip_end_date_and_time).toLocaleDateString()})
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold">
                    ₹ {Number(data.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-3 px-4 text-right font-bold">Total Amount</td>
                  <td className="py-3 px-4 text-right font-bold text-lg">
                    ₹ {Number(data.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-12 pt-8 border-t text-center text-xs text-gray-400">
              <p>This is a computer generated invoice and does not require a signature.</p>
              <p className="mt-1">Thank you for choosing {data.company?.company_name || 'Doview Holidays'}!</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            Failed to load invoice data.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

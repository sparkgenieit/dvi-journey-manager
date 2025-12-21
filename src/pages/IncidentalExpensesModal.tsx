import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ItineraryService } from "@/services/itinerary";
import { Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface IncidentalExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryPlanId: number;
}

export const IncidentalExpensesModal: React.FC<IncidentalExpensesModalProps> = ({
  isOpen,
  onClose,
  itineraryPlanId,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableData, setAvailableData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    componentType: '',
    componentId: '',
    amount: '',
    reason: '',
  });
  
  const [availableMargin, setAvailableMargin] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && itineraryPlanId) {
      fetchInitialData();
    }
  }, [isOpen, itineraryPlanId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [components, historyData] = await Promise.all([
        ItineraryService.getIncidentalAvailableComponents(itineraryPlanId),
        ItineraryService.getIncidentalHistory(itineraryPlanId),
      ]);
      setAvailableData(components);
      setHistory(historyData);
    } catch (error) {
      console.error("Error fetching incidental data:", error);
      toast.error("Failed to load incidental expenses data");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = async (value: string) => {
    setFormData({ ...formData, componentType: value, componentId: '', amount: '' });
    setAvailableMargin(null);
    
    // If it's Guide, Hotspot, or Activity, we can fetch margin immediately as they share the pool
    if (['1', '2', '3'].includes(value)) {
      try {
        const res = await ItineraryService.getIncidentalAvailableMargin(itineraryPlanId, Number(value));
        setAvailableMargin(res.total_avail_cost);
      } catch (error) {
        console.error("Error fetching margin:", error);
      }
    }
  };

  const handleComponentChange = async (value: string) => {
    setFormData({ ...formData, componentId: value, amount: '' });
    
    // For Hotel and Vendor, margin depends on the specific component
    if (['4', '5'].includes(formData.componentType)) {
      try {
        const res = await ItineraryService.getIncidentalAvailableMargin(itineraryPlanId, Number(formData.componentType), Number(value));
        setAvailableMargin(res.total_avail_cost);
      } catch (error) {
        console.error("Error fetching margin:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.componentType || !formData.componentId || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    if (availableMargin !== null && Number(formData.amount) > availableMargin) {
      toast.error(`Amount cannot exceed available margin (₹${availableMargin})`);
      return;
    }

    setSubmitting(true);
    try {
      await ItineraryService.addIncidentalExpense({
        itineraryPlanId,
        componentType: Number(formData.componentType),
        componentId: Number(formData.componentId),
        amount: Number(formData.amount),
        reason: formData.reason,
        createdBy: 1, // TODO: Get from auth context
      });
      toast.success("Incidental expense added successfully");
      setFormData({ componentType: '', componentId: '', amount: '', reason: '' });
      setAvailableMargin(null);
      fetchInitialData();
    } catch (error) {
      console.error("Error adding incidental expense:", error);
      toast.error("Failed to add incidental expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    try {
      await ItineraryService.deleteIncidentalHistory(id);
      toast.success("Record deleted successfully");
      fetchInitialData();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const getComponentOptions = () => {
    if (!availableData) return [];
    switch (formData.componentType) {
      case '1': return availableData.guides;
      case '2': return availableData.hotspots;
      case '3': return availableData.activities;
      case '4': return availableData.hotels;
      case '5': return availableData.vendors;
      default: return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Incidental Expenses</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#d546ab]" />
          </div>
        ) : (
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-gray-50">
              <div className="space-y-2">
                <Label>Component Type <span className="text-danger">*</span></Label>
                <Select value={formData.componentType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Component Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableData?.availableTypes.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Item <span className="text-danger">*</span></Label>
                <Select 
                  value={formData.componentId} 
                  onValueChange={handleComponentChange}
                  disabled={!formData.componentType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Item" />
                  </SelectTrigger>
                  <SelectContent>
                    {getComponentOptions().map((item: any) => (
                      <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount <span className="text-danger">*</span> {availableMargin !== null && <span className="text-xs text-gray-500">(Available: ₹{availableMargin})</span>}</Label>
                <Input 
                  type="number" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea 
                  value={formData.reason} 
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Enter reason"
                  rows={1}
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" className="bg-[#fd7e14] hover:bg-[#e67212]" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add Expense
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Incidental Expenses History</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="py-2 px-4 text-left">Date</th>
                      <th className="py-2 px-4 text-left">Type</th>
                      <th className="py-2 px-4 text-left">Amount</th>
                      <th className="py-2 px-4 text-left">Reason</th>
                      <th className="py-2 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-500">No history found</td>
                      </tr>
                    ) : (
                      history.map((item) => (
                        <tr key={item.confirmed_itinerary_incidental_expenses_history_ID} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{new Date(item.createdon).toLocaleDateString()}</td>
                          <td className="py-2 px-4">
                            {item.component_type === 1 ? 'Guide' : 
                             item.component_type === 2 ? 'Hotspot' : 
                             item.component_type === 3 ? 'Activity' : 
                             item.component_type === 4 ? 'Hotel' : 'Vendor'}
                          </td>
                          <td className="py-2 px-4 font-medium">₹{item.incidental_amount}</td>
                          <td className="py-2 px-4 text-gray-600">{item.reason || 'N/A'}</td>
                          <td className="py-2 px-4 text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(item.confirmed_itinerary_incidental_expenses_history_ID)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

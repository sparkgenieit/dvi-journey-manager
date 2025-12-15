// FILE: src/pages/itineraries/HotelList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type {
  ItineraryHotelRow,
  ItineraryHotelTab,
} from "./ItineraryDetails";
import { ItineraryService } from "@/services/itinerary";

type HotelListProps = {
  hotels: ItineraryHotelRow[];
  hotelTabs: ItineraryHotelTab[];
  hotelRatesVisible: boolean;
  // Optional: in case you later wire an API to persist the toggle
  onToggleHotelRates?: (visible: boolean) => void;
  // Callback to refresh parent data after hotel update
  onRefresh?: () => void;
  // Callback when hotel group type (recommendation tab) changes
  onGroupTypeChange?: (groupType: number) => void;
};

// Shape of each room item coming from /itineraries/hotel_room_details
type RoomTypeOption = {
  roomTypeId: number;
  roomTypeTitle: string;
};

type HotelRoomDetail = {
  itineraryPlanId?: number;
  itineraryRouteId?: number;
  itineraryPlanHotelRoomDetailsId?: number;
  hotelId?: number;
  hotelName?: string;
  hotelCategory?: number | null;
  roomTypeId?: number;
  roomTypeName?: string;
  availableRoomTypes?: RoomTypeOption[];
  noOfRooms?: number;
  adultCount?: number;
  childWithBed?: number;
  childWithoutBed?: number;
  extraBedCount?: number;
  perNightAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  [key: string]: any; // keep flexible – we only use a few fields
};

const formatCurrency = (value: number | undefined | null): string => {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "₹ 0.00";
  return (
    "₹ " +
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

export const HotelList: React.FC<HotelListProps> = ({
  hotels,
  hotelTabs,
  hotelRatesVisible,
  onToggleHotelRates,
  onRefresh,
  onGroupTypeChange,
}) => {
  // quoteId from route: /itinerary-details/:id
  const { id: quoteId } = useParams<{ id: string }>();

  // Active tab = current group_type from backend
  const [activeGroupType, setActiveGroupType] = useState<number | null>(null);
  // Local "Display Rates" state driven by backend flag
  const [showRates, setShowRates] = useState<boolean>(hotelRatesVisible);

  // Expanded hotel row key & loaded rooms
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [loadingRowKey, setLoadingRowKey] = useState<string | null>(null);
  const [roomDetails, setRoomDetails] = useState<HotelRoomDetail[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);

  // Form state for each room card: key = itineraryPlanHotelRoomDetailsId or unique identifier
  const [roomFormData, setRoomFormData] = useState<Record<string, {
    roomTypeId: number;
    mealAll: boolean;
    mealBreakfast: boolean;
    mealLunch: boolean;
    mealDinner: boolean;
  }>>({});

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingHotelAction, setPendingHotelAction] = useState<{
    room: HotelRoomDetail;
    isReplacing: boolean;
    previousHotelName: string;
    newHotelName: string;
    routeDate: string;
  } | null>(null);

  // Initialise active tab from backend groups
  useEffect(() => {
    if (!activeGroupType && hotelTabs && hotelTabs.length > 0) {
      const initialGroupType = hotelTabs[0].groupType;
      setActiveGroupType(initialGroupType);
      // Notify parent of initial group type
      if (onGroupTypeChange) {
        onGroupTypeChange(initialGroupType);
      }
    }
  }, [activeGroupType, hotelTabs, onGroupTypeChange]);

  // Keep local switch in sync if backend changes
  useEffect(() => {
    setShowRates(hotelRatesVisible);
  }, [hotelRatesVisible]);

  // Current group's total (GRAND_TOTAL_OF_THE_HOTEL_CHARGES)
  const currentTabTotal = useMemo(() => {
    if (!hotelTabs || !hotelTabs.length || activeGroupType == null) return 0;
    const tab = hotelTabs.find((t) => t.groupType === activeGroupType);
    return tab ? tab.totalAmount : 0;
  }, [hotelTabs, activeGroupType]);

  // Filter hotel rows by groupType (tab)
  const currentHotelRows = useMemo(() => {
    if (!hotels || !hotels.length) return [];
    if (activeGroupType == null) return hotels;
    return hotels.filter((h) => h.groupType === activeGroupType);
  }, [hotels, activeGroupType]);

  // ---------- CLICK HANDLER: LOAD ROOM DETAILS & EXPAND ROW ----------
  const handleRowClick = async (hotel: ItineraryHotelRow, idx: number) => {
    const rowKey = `${hotel.groupType}-${idx}`;

    console.log('=== Hotel Row Clicked ===');
    console.log('Hotel:', hotel);
    console.log('itineraryRouteId:', hotel.itineraryRouteId);

    // Collapse if already open
    if (expandedRowKey === rowKey) {
      setExpandedRowKey(null);
      setRoomDetails([]);
      setSelectedHotelId(null);
      return;
    }

    if (!quoteId) {
      console.warn("Missing quoteId in route params");
      return;
    }

    const itineraryRouteId = hotel.itineraryRouteId;

    setLoadingRowKey(rowKey);
    setSelectedHotelId(hotel.hotelId); // Store the selected hotel ID from the row

    try {
      const resp = await ItineraryService.getHotelRoomDetails(quoteId);
      console.log('Raw API response:', resp);

      // Support both shapes: resp.rooms OR resp.data.rooms
      let allRooms: any[] = Array.isArray((resp as any)?.rooms)
        ? (resp as any).rooms
        : Array.isArray((resp as any)?.data?.rooms)
        ? (resp as any).data.rooms
        : [];

      console.log('All rooms from API:', allRooms.length);
      if (allRooms.length > 0) {
        console.log('Sample room:', allRooms[0]);
      }
      console.log('Filtering for routeId:', itineraryRouteId);

      // Filter rooms for this specific route
      if (itineraryRouteId) {
        allRooms = allRooms.filter(
          (r: any) => r.itineraryRouteId === itineraryRouteId
        );
      }

      console.log('Filtered rooms count:', allRooms.length);
      if (allRooms.length > 0) {
        console.log('Filtered rooms:', allRooms);
      }

      // Map API response fields to component expected fields
      const mappedRooms: HotelRoomDetail[] = allRooms.map((r: any) => ({
        itineraryPlanId: r.itineraryPlanId,
        itineraryRouteId: r.itineraryRouteId,
        itineraryPlanHotelRoomDetailsId: r.itineraryPlanHotelRoomDetailsId,
        hotelId: r.hotelId,
        hotelName: r.hotelName,
        hotelCategory: r.hotelCategory,
        roomTypeId: r.roomTypeId,
        roomTypeName: r.roomTypeName,
        availableRoomTypes: r.availableRoomTypes || [],
        noOfRooms: 1, // Default to 1 if not provided
        adultCount: r.totalAdult || 0,
        childWithBed: r.totalChildWithBed || 0,
        childWithoutBed: r.totalChildWithoutBed || 0,
        extraBedCount: r.totalExtraBed || 0,
        perNightAmount: r.pricePerNight || 0,
        taxAmount: (r.pricePerNight || 0) * (r.gstPercentage || 0) / 100,
        totalAmount: (r.pricePerNight || 0) * (1 + (r.gstPercentage || 0) / 100),
      }));

      console.log('Mapped rooms:', mappedRooms);

      setRoomDetails(mappedRooms);
      setExpandedRowKey(rowKey);

      // Initialize form data for each room with default values
      const initialFormData: Record<string, any> = {};
      mappedRooms.forEach((room) => {
        const roomKey = room.itineraryPlanHotelRoomDetailsId?.toString() || 
          `temp-${room.itineraryRouteId}-${room.hotelId}`;
        initialFormData[roomKey] = {
          roomTypeId: room.roomTypeId || (room.availableRoomTypes?.[0]?.roomTypeId ?? 0),
          mealAll: false,
          mealBreakfast: false,
          mealLunch: false,
          mealDinner: false,
        };
      });
      setRoomFormData(initialFormData);
    } catch (err) {
      console.error("Error loading hotel room details", err);
      setRoomDetails([]);
      setExpandedRowKey(rowKey); // still expand but show "No room details"
    } finally {
      setLoadingRowKey(null);
    }
  };

  // ---------- HANDLER: CHOOSE/UPDATE HOTEL ----------
  const handleChooseOrUpdateHotel = async (room: HotelRoomDetail) => {
    const roomKey = room.itineraryPlanHotelRoomDetailsId?.toString() || 
      `temp-${room.itineraryRouteId}-${room.hotelId}`;
    
    const formData = roomFormData[roomKey];
    if (!formData || !room.itineraryPlanId || !room.itineraryRouteId || !room.hotelId) {
      console.error("Missing required data for hotel selection");
      return;
    }

    const isReplacing = room.hotelId !== selectedHotelId;
    const currentHotel = hotels.find(h => h.itineraryRouteId === room.itineraryRouteId);
    const routeDate = currentHotel?.day || "";

    // Show confirmation dialog
    setPendingHotelAction({
      room,
      isReplacing,
      previousHotelName: currentHotel?.hotelName || "",
      newHotelName: room.hotelName || "",
      routeDate,
    });
    setShowConfirmDialog(true);
  };

  // ---------- HANDLER: CONFIRM HOTEL SELECTION ----------
  const handleConfirmHotelSelection = async () => {
    if (!pendingHotelAction) return;

    const { room, isReplacing } = pendingHotelAction;
    const roomKey = room.itineraryPlanHotelRoomDetailsId?.toString() || 
      `temp-${room.itineraryRouteId}-${room.hotelId}`;
    const formData = roomFormData[roomKey];

    try {
      await ItineraryService.selectHotel(
        room.itineraryPlanId!,
        room.itineraryRouteId!,
        room.hotelId!,
        formData.roomTypeId,
        {
          all: formData.mealAll,
          breakfast: formData.mealBreakfast,
          lunch: formData.mealLunch,
          dinner: formData.mealDinner,
        }
      );

      setShowConfirmDialog(false);
      setPendingHotelAction(null);

      toast.success("Successfully Hotel Updated !!!", {
        description: isReplacing 
          ? `Hotel changed to ${room.hotelName}` 
          : "Hotel details updated",
      });
      
      // Refresh data without page reload
      if (onRefresh) {
        onRefresh();
      }

      // Collapse the expanded row after selection
      setExpandedRowKey(null);
      setRoomDetails([]);
      setRoomFormData({});
      
      // Update selected hotel ID if it changed
      if (isReplacing && room.hotelId) {
        setSelectedHotelId(room.hotelId);
      }
    } catch (err) {
      console.error("Error selecting/updating hotel:", err);
      setShowConfirmDialog(false);
      setPendingHotelAction(null);
      toast.error("Failed to update hotel", {
        description: "Please try again",
      });
    }
  };

  // ---------- HANDLER: UPDATE FORM DATA ----------
  const updateRoomFormData = (roomKey: string, field: string, value: any) => {
    setRoomFormData(prev => ({
      ...prev,
      [roomKey]: {
        ...prev[roomKey],
        [field]: value,
      }
    }));
  };

  // ---------- RENDER ----------
  return (
    <Card className="border-none shadow-none bg-white">
      <CardContent className="pt-6">
        {/* Header + Display Rates toggle */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#4a4260]">HOTEL LIST</h2>

          {/* Simple toggle using Button (no extra component imports) */}
          <Button
            variant="link"
            className="text-[#d546ab] hover:text-[#c03d9f] px-0"
            onClick={() => {
              const next = !showRates;
              setShowRates(next);
              if (onToggleHotelRates) {
                onToggleHotelRates(next);
              }
            }}
          >
            {showRates ? "Hide Rates" : "Display Rates"}
          </Button>
        </div>

        {/* Hotel Tabs – based on real backend groups */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {hotelTabs && hotelTabs.length > 0 ? (
            hotelTabs.map((tab) => {
              const isActive = tab.groupType === activeGroupType;
              return (
                <Button
                  key={tab.groupType}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveGroupType(tab.groupType);
                    setExpandedRowKey(null);
                    setRoomDetails([]);
                    // Notify parent that group type changed
                    if (onGroupTypeChange) {
                      onGroupTypeChange(tab.groupType);
                    }
                  }}
                  className={
                    isActive
                      ? "bg-[#d546ab] hover:bg-[#c03d9f] text-white whitespace-nowrap"
                      : "border-[#e5d9f2] text-[#4a4260] whitespace-nowrap"
                  }
                >
                  {tab.label} ({formatCurrency(tab.totalAmount)})
                </Button>
              );
            })
          ) : (
            <span className="text-sm text-gray-500">No hotel groups</span>
          )}
        </div>

        {/* Hotel Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-[#f8f5fc]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                  DAY
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                  DESTINATION
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                  HOTEL NAME - CATEGORY
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                  HOTEL ROOM TYPE
                </th>
                {showRates && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    PRICE
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                  MEAL PLAN
                </th>
              </tr>
            </thead>
            <tbody>
              {currentHotelRows.map((hotel, idx) => {
                const rowKey = `${hotel.groupType}-${idx}`;
                const isExpanded = expandedRowKey === rowKey;
                const rowTotal =
                  (hotel.totalHotelCost ?? 0) +
                  (hotel.totalHotelTaxAmount ?? 0);

                return (
                  <React.Fragment key={rowKey}>
                    {/* MAIN ROW */}
                    <tr
                      className="border-t cursor-pointer hover:bg-[#f8f5fc]"
                      onClick={() => handleRowClick(hotel, idx)}
                    >
                      <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                        {hotel.day}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                        {hotel.destination}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                        {hotel.hotelName
                          ? hotel.category
                            ? `${hotel.hotelName} -${hotel.category}*`
                            : hotel.hotelName
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                        {hotel.roomType || "-"}
                      </td>
                      {showRates && (
                        <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                          {formatCurrency(rowTotal)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                        {hotel.mealPlan || "-"}
                      </td>
                    </tr>

                    {/* EXPANDED ROW WITH ROOM CARDS */}
                    {isExpanded && (
                      <tr className="bg-[#fdf6ff] border-t">
                        <td
                          colSpan={showRates ? 6 : 5}
                          className="px-4 py-3 text-sm text-[#4a4260]"
                        >
                          {loadingRowKey === rowKey ? (
                            <div className="text-center py-4 text-[#6c6c6c]">
                              Loading room details…
                            </div>
                          ) : roomDetails.length === 0 ? (
                            <div className="text-center py-4 text-[#6c6c6c]">
                              No room details available for this day.
                            </div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {roomDetails.map((room) => {
                                const roomKey = room.itineraryPlanHotelRoomDetailsId?.toString() || 
                                  `temp-${room.itineraryRouteId}-${room.hotelId}`;
                                const formData = roomFormData[roomKey] || {
                                  roomTypeId: room.roomTypeId || (room.availableRoomTypes?.[0]?.roomTypeId ?? 0),
                                  mealAll: false,
                                  mealBreakfast: false,
                                  mealLunch: false,
                                  mealDinner: false,
                                };

                                return (
                                <div
                                  key={
                                    room.itineraryPlanHotelRoomDetailsId ??
                                    `${room.itineraryRouteId}-${room.roomTypeName}-${room.totalAmount}`
                                  }
                                  className="bg-white rounded-lg shadow-md border border-[#e5d9f2] overflow-hidden"
                                >
                                  {/* Hotel Image/Header */}
                                  <div className="relative h-40 bg-gradient-to-r from-[#7c3aed] to-[#a855f7]">
                                    <div className="absolute inset-0 flex flex-col justify-end p-3 bg-black/30">
                                      <h3 className="text-white font-semibold text-sm">
                                        {room.hotelName || hotel.hotelName}
                                      </h3>
                                      <p className="text-white/90 text-xs">
                                        Category: {room.hotelCategory ?? hotel.category}*
                                      </p>
                                    </div>
                                  </div>

                                  <div className="p-4">
                                    {/* Check-in/Check-out times */}
                                    <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#f3e8ff] flex items-center justify-center">
                                          <span className="text-[#7c3aed] text-xs">📥</span>
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-[#4a4260]">02:00 PM</p>
                                          <p className="text-xs text-gray-500">Check In</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#f3e8ff] flex items-center justify-center">
                                          <span className="text-[#7c3aed] text-xs">📤</span>
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-[#4a4260]">12:00 PM</p>
                                          <p className="text-xs text-gray-500">Check Out</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Room Type Dropdown */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-medium text-[#4a4260] mb-1">
                                        Room Type
                                      </label>
                                      <select 
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
                                        value={formData.roomTypeId}
                                        onChange={(e) => updateRoomFormData(roomKey, 'roomTypeId', Number(e.target.value))}
                                      >
                                        {room.availableRoomTypes && room.availableRoomTypes.length > 0 ? (
                                          room.availableRoomTypes.map((rt) => (
                                            <option key={rt.roomTypeId} value={rt.roomTypeId}>
                                              {rt.roomTypeTitle}
                                            </option>
                                          ))
                                        ) : (
                                          <option value="">{room.roomTypeName || "No room types available"}</option>
                                        )}
                                      </select>
                                    </div>

                                    {/* Meal Plan Checkboxes */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-medium text-[#4a4260] mb-2">
                                        Meal
                                      </label>
                                      <div className="grid grid-cols-2 gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 text-[#7c3aed] border-gray-300 rounded focus:ring-[#7c3aed]"
                                            checked={formData.mealAll}
                                            onChange={(e) => {
                                              const checked = e.target.checked;
                                              updateRoomFormData(roomKey, 'mealAll', checked);
                                              if (checked) {
                                                updateRoomFormData(roomKey, 'mealBreakfast', true);
                                                updateRoomFormData(roomKey, 'mealLunch', true);
                                                updateRoomFormData(roomKey, 'mealDinner', true);
                                              }
                                            }}
                                          />
                                          <span className="text-sm text-gray-700">All</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 text-[#7c3aed] border-gray-300 rounded focus:ring-[#7c3aed]"
                                            checked={formData.mealBreakfast}
                                            onChange={(e) => updateRoomFormData(roomKey, 'mealBreakfast', e.target.checked)}
                                          />
                                          <span className="text-sm text-gray-700">Breakfast</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 text-[#7c3aed] border-gray-300 rounded focus:ring-[#7c3aed]"
                                            checked={formData.mealLunch}
                                            onChange={(e) => updateRoomFormData(roomKey, 'mealLunch', e.target.checked)}
                                          />
                                          <span className="text-sm text-gray-700">Lunch</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 text-[#7c3aed] border-gray-300 rounded focus:ring-[#7c3aed]"
                                            checked={formData.mealDinner}
                                            onChange={(e) => updateRoomFormData(roomKey, 'mealDinner', e.target.checked)}
                                          />
                                          <span className="text-sm text-gray-700">Dinner</span>
                                        </label>
                                      </div>
                                    </div>

                                    {/* Price Summary */}
                                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Rooms:</span>
                                        <span className="font-medium">{room.noOfRooms ?? 1}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Per night:</span>
                                        <span className="font-medium">{formatCurrency(room.perNightAmount)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Tax:</span>
                                        <span className="font-medium">{formatCurrency(room.taxAmount)}</span>
                                      </div>
                                      <div className="flex justify-between pt-1 border-t">
                                        <span className="font-semibold">Total:</span>
                                        <span className="font-semibold text-[#7c3aed]">
                                          {formatCurrency(room.totalAmount)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Choose/Update Button - Conditional based on selection status */}
                                    <button
                                      className="w-full py-2 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium rounded-md transition-colors text-sm"
                                      onClick={() => handleChooseOrUpdateHotel(room)}
                                    >
                                      {room.hotelId === selectedHotelId ? "Update" : "Choose"}
                                    </button>
                                  </div>
                                </div>
                              );})}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Hotel Total row for active group */}
              <tr className="border-t bg-[#fdf6ff]">
                <td
                  colSpan={showRates ? 4 : 3}
                  className="px-4 py-3 text-sm font-medium text-[#4a4260] text-right"
                >
                  Hotel Total :
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[#4a4260]">
                  {formatCurrency(currentTabTotal)}
                </td>
                {!showRates && (
                  <td className="px-4 py-3 text-sm font-semibold text-[#4a4260]" />
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <DialogTitle className="text-center">
              {pendingHotelAction?.isReplacing
                ? `Confirm Hotel Modification for ${pendingHotelAction?.routeDate}?`
                : "Confirm Hotel Update"}
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              {pendingHotelAction?.isReplacing ? (
                <>
                  Are you sure you want to modify the hotel from{" "}
                  <strong>{pendingHotelAction?.previousHotelName}</strong> to{" "}
                  <strong>{pendingHotelAction?.newHotelName}</strong> for{" "}
                  <strong>{pendingHotelAction?.routeDate}</strong>?
                </>
              ) : (
                <>Are you sure you want to update the hotel details?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingHotelAction(null);
              }}
            >
              Close
            </Button>
            <Button type="button" onClick={handleConfirmHotelSelection}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

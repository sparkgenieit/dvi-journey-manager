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
import { AlertTriangle, Loader2 } from "lucide-react";
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
  quoteId: string; // ✅ Required: Quote ID from parent
  planId: number; // ✅ Required: Plan ID for hotel selection
  // Optional: in case you later wire an API to persist the toggle
  onToggleHotelRates?: (visible: boolean) => void;
  // Callback to refresh parent data after hotel update
  onRefresh?: () => void;
  // Callback when hotel group type (recommendation tab) changes
  onGroupTypeChange?: (groupType: number) => void;
  // ✅ Callback to get save function reference (called once on mount)
  onGetSaveFunction?: (saveFn: () => Promise<boolean>) => void;
  // ✅ NEW: Read-only mode for confirmed itinerary
  readOnly?: boolean;
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
  pricePerNight?: number; // ✅ Price from TBO API
  taxAmount?: number;
  totalAmount?: number;
  groupType?: number; // ✅ Tier/category from TBO API
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
  quoteId, // ✅ Receive quoteId from parent
  planId, // ✅ Receive planId from parent
  onToggleHotelRates,
  onRefresh,
  onGroupTypeChange,
  onGetSaveFunction,
  readOnly = false, // ✅ NEW: Default to edit mode
}) => {
  // ✅ Track which hotels were explicitly selected by user (key: "routeId-groupType")
  const [selectedHotels, setSelectedHotels] = useState<Map<string, number>>(new Map() as Map<string, number>);

  // ✅ Track unsaved hotel selections (for batch save on confirm)
  const [unsavedSelections, setUnsavedSelections] = useState<Map<string, HotelRoomDetail>>(new Map());

  // ✅ Local copy of hotels that can be updated immediately
  const [localHotels, setLocalHotels] = useState<ItineraryHotelRow[]>(hotels);

  // Active tab = current group_type from backend
  const [activeGroupType, setActiveGroupType] = useState<number | null>(null);
  // Local "Display Rates" state driven by backend flag
  const [showRates, setShowRates] = useState<boolean>(hotelRatesVisible);

  // Expanded hotel row key & loaded rooms
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [loadingRowKey, setLoadingRowKey] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [roomDetails, setRoomDetails] = useState<HotelRoomDetail[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [isUpdatingHotel, setIsUpdatingHotel] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // ✅ Track sync operation

  // Cache for hotel room details by quoteId
  const [roomDetailsCache, setRoomDetailsCache] = useState<Record<string, HotelRoomDetail[]>>({});

  // ✅ Sync local hotels with prop changes
  useEffect(() => {
    setLocalHotels(hotels);
  }, [hotels]);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingHotelAction, setPendingHotelAction] = useState<{
    room: HotelRoomDetail;
    isReplacing: boolean;
    previousHotelName: string;
    newHotelName: string;
    routeDate: string;
    groupType?: number; // ✅ NEW: The groupType (tier) of the selected hotel
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

  // Reset expanded row and loading state when hotels data changes (after selection)
  useEffect(() => {
    setExpandedRowKey(null);
    setRoomDetails([]);
    setLoadingRowKey(null);
    setSelectedHotelId(null);
  }, [hotels]);

  // Current group's total (GRAND_TOTAL_OF_THE_HOTEL_CHARGES)
  const currentTabTotal = useMemo(() => {
    if (!hotelTabs || !hotelTabs.length || activeGroupType == null) return 0;
    const tab = hotelTabs.find((t) => t.groupType === activeGroupType);
    return tab ? tab.totalAmount : 0;
  }, [hotelTabs, activeGroupType]);

  // Filter hotel rows by groupType (tab) and show either SELECTED or LOWEST-PRICED hotel per day/route
  const currentHotelRows = useMemo(() => {
    if (!localHotels || !localHotels.length) return [];
    
    // Filter by active group type
    const filtered = activeGroupType == null 
      ? localHotels 
      : localHotels.filter((h) => h.groupType === activeGroupType);
    
    // Group hotels by route
    const hotelsByRoute = new Map<number, ItineraryHotelRow[]>();
    
    filtered.forEach(hotel => {
      const routeId = hotel.itineraryRouteId;
      if (!hotelsByRoute.has(routeId)) {
        hotelsByRoute.set(routeId, []);
      }
      hotelsByRoute.get(routeId)!.push(hotel);
    });
    
    // For each route, select either the explicitly chosen hotel or the cheapest one
    const displayHotels: ItineraryHotelRow[] = [];
    hotelsByRoute.forEach((hotels, routeId) => {
      const selectionKey = `${routeId}-${activeGroupType}`;
      const selectedHotelId = selectedHotels.get(selectionKey);
      
      // If user explicitly selected a hotel, show that one
      if (selectedHotelId) {
        const selectedHotel = hotels.find(h => h.hotelId === selectedHotelId);
        if (selectedHotel) {
          displayHotels.push(selectedHotel);
          return;
        }
      }
      
      // Otherwise, show the cheapest hotel
      const sortedByPrice = [...hotels].sort((a, b) => 
        (a.totalHotelCost || 0) - (b.totalHotelCost || 0)
      );
      displayHotels.push(sortedByPrice[0]);
    });
    
    return displayHotels;
  }, [localHotels, activeGroupType, selectedHotels]);

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

    // Collapse any currently expanded row before loading new one
    if (expandedRowKey !== null) {
      setExpandedRowKey(null);
      setRoomDetails([]);
    }

    const itineraryRouteId = hotel.itineraryRouteId;
    setSelectedHotelId(hotel.hotelId);
    
    // ✅ Filter from localHotels - NO API CALL
    const hotelsForRoute = localHotels
      .filter((h: any) => 
        h.itineraryRouteId === itineraryRouteId && 
        h.groupType === hotel.groupType
      )
      .map((h: any) => ({
        ...h,
        itineraryPlanId: planId,
        hotelCategory: h.category,
        pricePerNight: h.totalHotelCost,
        perNightAmount: h.totalHotelCost,
        taxAmount: h.totalHotelTaxAmount || 0,
        totalAmount: h.totalHotelCost + (h.totalHotelTaxAmount || 0),
        noOfRooms: h.noOfRooms || 1,
        roomTypeName: h.roomType,
        availableRoomTypes: h.roomType ? [{
          roomTypeId: 1,
          roomTypeTitle: h.roomType
        }] : [],
      }));

    // ✅ Deduplicate by hotelId to prevent duplicate cards
    const uniqueHotels = Array.from(
      new Map(hotelsForRoute.map(h => [h.hotelId, h])).values()
    );

    console.log('✅ Filtered from local state:', uniqueHotels.length, 'hotels');
    
    if (uniqueHotels.length > 0) {
      setRoomDetails(uniqueHotels);
      setExpandedRowKey(rowKey);
    } else {
      toast.warning('No hotels found for this route and tier');
    }
  };

  // ---------- HELPER: NORMALIZE API ROOM RESPONSE TO UI SHAPE ----------
  const normalizeRoom = (r: any): HotelRoomDetail => {
    const perNightAmount = Number(r.perNightAmount ?? r.pricePerNight ?? 0);
    const nights = Number(r.numberOfNights ?? 1);
    const taxAmount = Number(r.taxAmount ?? 0);
    const totalAmount = Number(
      r.totalAmount ?? r.totalPrice ?? (perNightAmount * nights + taxAmount)
    );

    return {
      ...r,
      itineraryPlanId: Number(r.itineraryPlanId ?? planId),
      itineraryRouteId: Number(r.itineraryRouteId),
      hotelId: Number(r.hotelId),
      hotelName: r.hotelName ?? "",
      hotelCategory: r.hotelCategory ?? r.category ?? null,
      groupType: Number(r.groupType ?? 1),
      perNightAmount,
      taxAmount,
      totalAmount,
      noOfRooms: Number(r.noOfRooms ?? 1),
      roomTypeName: r.roomTypeName ?? r.roomType ?? "",
      availableRoomTypes: Array.isArray(r.availableRoomTypes) ? r.availableRoomTypes : [],
    };
  };

  // ---------- HANDLER: SYNC FRESH HOTELS FOR ROUTE ----------
  const handleSyncRoute = async (routeId: number) => {
    if (!quoteId) return;

    // ✅ Check for unsaved changes and warn user
    if (unsavedSelections.size > 0) {
      const confirmed = window.confirm(
        `⚠️ You have ${unsavedSelections.size} unsaved hotel selection(s).\n\nSyncing will discard your unsaved changes and fetch fresh hotels from TBO.\n\nDo you want to continue?`
      );
      if (!confirmed) return;
      
      // Clear unsaved selections for this route
      setUnsavedSelections(prev => {
        const newMap = new Map(prev);
        // Remove selections for this specific route
        Array.from(newMap.keys()).forEach(key => {
          if (key.startsWith(`${routeId}-`)) {
            newMap.delete(key);
          }
        });
        return newMap;
      });
    }

    // Save current expanded state to restore it after sync
    const currentExpandedKey = expandedRowKey;
    
    // ✅ Show loader
    setIsSyncing(true);
    
    try {
      // ✅ Pass clearCache: true to force backend to bypass its memory cache
      const response = await ItineraryService.getHotelRoomDetails(quoteId, routeId, true);
      
      // ✅ API returns 'rooms' property, not 'roomDetails'
      const roomsRaw = response?.rooms || response?.roomDetails || [];
      const normalizedRooms: HotelRoomDetail[] = roomsRaw.map((r: any) => normalizeRoom(r));
      
      // ✅ Deduplicate by hotelId to prevent duplicate entries
      const uniqueRooms = Array.from(
        new Map(normalizedRooms.map((r: any) => [r.hotelId, r])).values()
      );
      
      if (uniqueRooms.length > 0) {
        // ✅ Update cache for ALL groupTypes for this route
        const groupedByTier = new Map<number, any[]>();
        uniqueRooms.forEach((room: any) => {
          if (!groupedByTier.has(room.groupType)) {
            groupedByTier.set(room.groupType, []);
          }
          groupedByTier.get(room.groupType)!.push(room);
        });
        
        // Update cache for each tier
        const newCache = { ...roomDetailsCache };
        groupedByTier.forEach((hotels, groupType) => {
          const cacheKey = `${routeId}-${groupType}`;
          newCache[cacheKey] = hotels;
        });
        setRoomDetailsCache(newCache);
        
        // If a row is currently expanded, update its display with fresh data
        if (currentExpandedKey) {
          const expandedHotel = currentHotelRows.find((h, idx) => 
            `${h.groupType}-${idx}` === currentExpandedKey
          );
          if (expandedHotel) {
            const hotelsForTier = uniqueRooms.filter((r: any) => r.groupType === expandedHotel.groupType);
            setRoomDetails(hotelsForTier);
          }
          setExpandedRowKey(currentExpandedKey);
        }
        
        toast.success(`Hotels refreshed from TBO (${uniqueRooms.length} options found)`);
      } else {
        toast.error('No hotels found for this route');
      }
    } catch (err) {
      console.error('Error syncing hotels:', err);
      toast.error('Failed to sync hotels');
    } finally {
      // ✅ Hide loader
      setIsSyncing(false);
    }
  };

  // ---------- HANDLER: CHOOSE/UPDATE HOTEL ----------
  const handleChooseOrUpdateHotel = async (room: HotelRoomDetail) => {
    console.log('🏨 Choose button clicked', room);
    
    if (!room.itineraryPlanId || !room.itineraryRouteId || !room.hotelId) {
      console.error('❌ Missing required fields:', {
        itineraryPlanId: room.itineraryPlanId,
        itineraryRouteId: room.itineraryRouteId,
        hotelId: room.hotelId
      });
      toast.error('Missing required hotel information');
      return;
    }

    const roomHotelId = Number(room.hotelId);
    const roomRouteId = Number(room.itineraryRouteId);
    
    const isReplacing = roomHotelId !== selectedHotelId;
    const currentHotel = localHotels.find(h => h.itineraryRouteId === roomRouteId);
    const routeDate = currentHotel?.day || "";

    // Show confirmation dialog
    setPendingHotelAction({
      room,
      isReplacing,
      previousHotelName: currentHotel?.hotelName || "",
      newHotelName: room.hotelName || "",
      routeDate,
      groupType: room.groupType ? Number(room.groupType) : undefined, // ✅ Use hotel's ORIGINAL groupType from TBO (maintains correct tier classification)
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmHotelSelection = async () => {
    if (!pendingHotelAction) return;

    const { room, isReplacing } = pendingHotelAction;

    // Validate required fields
    if (!room.itineraryPlanId || !room.itineraryRouteId || !room.hotelId) {
      toast.error("Missing required hotel information");
      return;
    }

    setIsUpdatingHotel(true);
    try {
      console.log("🏨 [HotelList] Storing hotel selection in state:", {
        hotelName: room.hotelName,
        hotelId: room.hotelId,
        groupType: pendingHotelAction.groupType,
        isReplacing,
      });
      
      // ✅ Store selection in state (NO DB SAVE - will save on confirm quotation)
      const selectionKey = `${room.itineraryRouteId}-${pendingHotelAction.groupType}`;
      
      // Mark as unsaved selection
      setUnsavedSelections(prev => {
        const newMap = new Map(prev);
        newMap.set(selectionKey, room);
        return newMap;
      });
      
      // Mark this hotel as explicitly selected for this route+tier
      setSelectedHotels(prev => {
        const newMap = new Map(prev);
        newMap.set(selectionKey, Number(room.hotelId!));
        return newMap;
      });
      
      // ✅ DO NOT mutate localHotels - selectedHotels map already handles which hotel shows in table
      // localHotels must remain the full option list so expanded view shows all cards

      setShowConfirmDialog(false);
      setPendingHotelAction(null);
      
      // ✅ Keep expanded row open and update selectedHotelId to show correct button state
      setSelectedHotelId(Number(room.hotelId));
      
      toast.success("Hotel selected! 👍", {
        description: `${room.hotelName} - Changes will be saved when you confirm the quotation`,
      });
      
      // ✅ Switch to the hotel's tier tab automatically (show where it was saved)
      if (pendingHotelAction?.groupType !== undefined && pendingHotelAction.groupType !== activeGroupType) {
        setActiveGroupType(pendingHotelAction.groupType);
        if (onGroupTypeChange) {
          onGroupTypeChange(pendingHotelAction.groupType);
        }
        console.log(`🔄 [HotelList] Switched to hotel's tier tab (groupType: ${pendingHotelAction.groupType})`);
      }
    } catch (err) {
      console.error("❌ [HotelList] Error selecting hotel:", err);
      setShowConfirmDialog(false);
      setPendingHotelAction(null);
      toast.error("Failed to select hotel", {
        description: "Please try again",
      });
    } finally {
      setIsUpdatingHotel(false);
    }
  };

  // ---------- FUNCTION: SAVE ALL HOTEL SELECTIONS TO DB ----------
  const saveAllHotelSelections = async () => {
    if (unsavedSelections.size === 0) {
      toast.info("No unsaved hotel selections to save");
      return true;
    }

    console.log(`💾 Saving ${unsavedSelections.size} hotel selections to database...`);
    
    const savePromises: Promise<any>[] = [];
    
    unsavedSelections.forEach((room, selectionKey) => {
      const defaultRoomTypeId = Number(room.availableRoomTypes?.[0]?.roomTypeId ?? 1);
      
      const promise = ItineraryService.selectHotel(
        Number(room.itineraryPlanId),
        Number(room.itineraryRouteId),
        Number(room.hotelId),
        defaultRoomTypeId,
        {
          all: false,
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        Number(room.groupType ?? 1)
      );
      
      savePromises.push(promise);
    });

    try {
      await Promise.all(savePromises);
      console.log("✅ All hotel selections saved successfully");
      
      // Clear unsaved selections
      setUnsavedSelections(new Map());
      
      toast.success(`✅ ${savePromises.length} hotel selection(s) saved successfully!`);
      return true;
    } catch (error) {
      console.error("❌ Error saving hotel selections:", error);
      toast.error("Failed to save some hotel selections");
      return false;
    }
  };

  // Expose save function to parent via callback
  React.useEffect(() => {
    if (onGetSaveFunction) {
      onGetSaveFunction(saveAllHotelSelections);
    }
  }, [onGetSaveFunction]);


  // ---------- RENDER ----------
  return (
    <Card className="border-none shadow-none bg-white relative">
      {/* Loading Overlay with Circular Progress */}
      {loadingRowKey !== null && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-lg p-8 shadow-lg flex flex-col items-center gap-4">
            {/* Circular Progress */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Background circle */}
              <svg className="absolute w-24 h-24" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5d9f2"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="8"
                  strokeDasharray={`${(loadingProgress / 100) * 282.7} 282.7`}
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "50px 50px" }}
                />
              </svg>
              {/* Percentage text */}
              <div className="text-center z-10">
                <p className="text-2xl font-bold text-[#7c3aed]">{Math.round(loadingProgress)}%</p>
              </div>
            </div>
            <p className="text-sm font-medium text-[#4a4260]">Loading hotel details...</p>
            <p className="text-xs text-gray-500">This may take up to 30 seconds</p>
          </div>
        </div>
      )}
      <CardContent className="pt-2">
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

        {/* ✅ Unsaved Changes Indicator */}
        {unsavedSelections.size > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <span className="text-amber-600 font-medium">⚠️ {unsavedSelections.size} unsaved hotel selection(s)</span>
            <span className="text-amber-600 text-sm">- Changes will be saved when you confirm the quotation</span>
          </div>
        )}

        {/* Hotel Tabs – based on real backend groups */}
        {/* ✅ IN READ-ONLY MODE: Hide tabs, show only selected hotel tier */}
        {!readOnly && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {hotelTabs && hotelTabs.length > 0 ? (
              hotelTabs.map((tab) => {
                const isActive = tab.groupType === activeGroupType;
                return (
                  <Button
                    key={tab.groupType}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    disabled={loadingRowKey !== null}
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
                        ? "bg-[#d546ab] hover:bg-[#c03d9f] text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        : "border-[#e5d9f2] text-[#4a4260] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}

        {/* Read-only mode: Show selected tier info */}
        {readOnly && activeGroupType !== null && (
          <div className="mb-4 p-3 bg-[#f8f5fc] border border-[#e5d9f2] rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-[#4a4260]">
                {hotelTabs.find(t => t.groupType === activeGroupType)?.label}
              </h4>
              <span className="text-[#d546ab] font-bold">
                {formatCurrency(hotelTabs.find(t => t.groupType === activeGroupType)?.totalAmount)}
              </span>
            </div>
          </div>
        )}

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
                    {/* ✅ IN READ-ONLY MODE: Make row non-clickable */}
                    <tr
                      className={`border-t ${
                        !readOnly && loadingRowKey === null ? "cursor-pointer hover:bg-[#f8f5fc]" : readOnly ? "cursor-default" : "cursor-not-allowed opacity-50"
                      }`}
                      onClick={() => {
                        // Only allow clicking if not in read-only mode and not loading
                        if (!readOnly && loadingRowKey === null) {
                          handleRowClick(hotel, idx);
                        }
                      }}
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
                            <>
                              {/* Sync Button */}
                              <div className="flex justify-end mb-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSyncRoute(Number(hotel.itineraryRouteId))}
                                  disabled={isSyncing}
                                  className="border-[#7c3aed] text-[#7c3aed] hover:bg-[#f3e8ff] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSyncing ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Syncing from TBO...
                                    </>
                                  ) : (
                                    <>🔄 Sync Fresh Hotels</>
                                  )}
                                </Button>
                              </div>
                              
                              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {roomDetails.map((hotel) => {
                                const roomKey = `hotel-${hotel.hotelId}`;

                                return (
                                <div
                                  key={roomKey}
                                  className="bg-white rounded-lg shadow-md border border-[#e5d9f2] overflow-hidden"
                                >
                                  {/* Hotel Image/Header */}
                                  <div className="relative h-40 bg-gradient-to-r from-[#7c3aed] to-[#a855f7]">
                                    <div className="absolute inset-0 flex flex-col justify-end p-3 bg-black/30">
                                      <h3 className="text-white font-semibold text-sm">
                                        {hotel.hotelName}
                                      </h3>
                                      <p className="text-white/90 text-xs">
                                        Category: {hotel.hotelCategory}*
                                      </p>
                                    </div>
                                  </div>

                                  <div className="p-4">{/* Check-in/Check-out times */}
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

                                    {/* Room Type Display (Fixed, not selectable) */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-medium text-[#4a4260] mb-1">
                                        Room Type
                                      </label>
                                      <p className="text-sm text-[#4a4260] font-medium">
                                        {hotel.availableRoomTypes && hotel.availableRoomTypes.length > 0 
                                          ? hotel.availableRoomTypes[0].roomTypeTitle 
                                          : "Not Available"}
                                      </p>
                                    </div>

                                    {/* Price Summary */}
                                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Rooms:</span>
                                        <span className="font-medium">{hotel.noOfRooms ?? 1}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Per night:</span>
                                        <span className="font-medium">{formatCurrency(hotel.perNightAmount)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Tax:</span>
                                        <span className="font-medium">{formatCurrency(hotel.taxAmount)}</span>
                                      </div>
                                      <div className="flex justify-between pt-1 border-t">
                                        <span className="font-semibold">Total:</span>
                                        <span className="font-semibold text-[#7c3aed]">
                                          {formatCurrency(hotel.totalAmount)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Choose/Update Button - Conditional based on selection status */}
                                    <button
                                      className="w-full py-2 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium rounded-md transition-colors text-sm"
                                      onClick={() => handleChooseOrUpdateHotel(hotel)}
                                    >
                                      {hotel.hotelId === selectedHotelId ? "Update" : "Choose"}
                                    </button>
                                  </div>
                                </div>
                              );})}
                            </div>
                            </>
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
              disabled={isUpdatingHotel}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleConfirmHotelSelection}
              disabled={isUpdatingHotel}
            >
              {isUpdatingHotel ? (
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
    </Card>
  );
};

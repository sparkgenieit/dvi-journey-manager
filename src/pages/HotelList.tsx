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
import { AlertTriangle, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import type {
  ItineraryHotelRow,
  ItineraryHotelTab,
} from "./ItineraryDetails";
import { ItineraryService } from "@/services/itinerary";
import { HotelRoomSelectionModal } from "@/components/hotels/HotelRoomSelectionModal";
import { useHotelVoucherStatus } from "@/services/useHotelVoucherStatus";

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
  // ✅ NEW: Callback to open hotel voucher modal
  onCreateVoucher?: (hotelData: {
    hotelId: number;
    hotelName: string;
    hotelEmail: string;
    hotelStateCity: string;
    routeDates: string[];
    dayNumbers: number[];
    hotelDetailsIds: number[];
  }) => void;
  // ✅ NEW: Callback when total selected hotel amount changes
  onTotalChange?: (totalAmount: number) => void;
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
  onCreateVoucher, // ✅ NEW: Callback for voucher creation
  onTotalChange, // ✅ NEW: Callback for total amount changes
}) => {
  // ✅ Track selected hotel PER GROUP TYPE and PER ROUTE
  // Structure: selectedByGroup[groupType][routeId] = selected hotel row
  // This ensures each groupType has its own independent selections
  const [selectedByGroup, setSelectedByGroup] = useState<Record<number, Record<number, ItineraryHotelRow>>>({});

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

  // ✅ Sync local hotels with prop changes and auto-select hotels for ALL groupTypes
  useEffect(() => {
    setLocalHotels(hotels);
    
    if (hotels.length === 0) return;
    
    // Auto-select cheapest hotel per route for EACH groupType
    setSelectedByGroup(prev => {
      const newSelected = { ...prev };
      
      // Group hotels by groupType, then by routeId
      const hotelsByGroupAndRoute: Record<number, Record<number, ItineraryHotelRow[]>> = {};
      
      hotels.forEach(h => {
        if (!hotelsByGroupAndRoute[h.groupType]) {
          hotelsByGroupAndRoute[h.groupType] = {};
        }
        if (!hotelsByGroupAndRoute[h.groupType][h.itineraryRouteId]) {
          hotelsByGroupAndRoute[h.groupType][h.itineraryRouteId] = [];
        }
        hotelsByGroupAndRoute[h.groupType][h.itineraryRouteId].push(h);
      });
      
      // For each groupType and each route, auto-select cheapest if not already selected
      Object.entries(hotelsByGroupAndRoute).forEach(([groupTypeStr, routeMap]) => {
        const groupType = Number(groupTypeStr);
        
        if (!newSelected[groupType]) {
          newSelected[groupType] = {};
        }
        
        Object.entries(routeMap).forEach(([routeIdStr, hotelOptions]) => {
          const routeId = Number(routeIdStr);
          
          // Only auto-select if not already selected for this groupType + route
          if (!newSelected[groupType][routeId]) {
            // Find cheapest hotel by (totalHotelCost + totalHotelTaxAmount)
            const sortedByPrice = [...hotelOptions].sort((a, b) => {
              const priceA = (a.totalHotelCost || 0) + (a.totalHotelTaxAmount || 0);
              const priceB = (b.totalHotelCost || 0) + (b.totalHotelTaxAmount || 0);
              return priceA - priceB;
            });
            
            const cheapest = sortedByPrice[0];
            if (cheapest) {
              newSelected[groupType][routeId] = cheapest;
              // ✅ Do NOT mark auto-selected hotels as "unsaved"
              // Only user-initiated changes via "Choose/Update" should be marked unsaved
            }
          }
        });
      });
      
      return newSelected;
    });
  }, [hotels, planId]);

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

  // Room selection modal state
  const [roomSelectionModal, setRoomSelectionModal] = useState<{
    open: boolean;
    itinerary_plan_hotel_details_ID: number;
    itinerary_plan_id: number;
    itinerary_route_id: number;
    hotel_id: number;
    group_type: number;
    hotel_name: string;
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

  // ✅ Get selected hotels for a specific groupType
  const getSelectedHotelsForGroup = (groupType: number): ItineraryHotelRow[] => {
    if (!selectedByGroup[groupType]) return [];
    return Object.values(selectedByGroup[groupType]);
  };

  // ✅ Calculate total for a specific groupType (sum of selected hotels)
  const getGroupTotal = (groupType: number): number => {
    const selectedHotels = getSelectedHotelsForGroup(groupType);
    return selectedHotels.reduce((sum, h) => 
      sum + (h.totalHotelCost || 0) + (h.totalHotelTaxAmount || 0), 0
    );
  };

  // ✅ Get active tab total
  const getActiveTabTotal = (): number => {
    if (activeGroupType === null) return 0;
    return getGroupTotal(activeGroupType);
  };

  // ✅ Get overall total (sum of active groupType only, as per requirements)
  const getOverallSelectedHotelTotal = (): number => {
    return getActiveTabTotal();
  };

  // Current group's total for display
  const currentTabTotal = useMemo(() => {
    return getActiveTabTotal();
  }, [activeGroupType, selectedByGroup]);

  // Filter hotel rows by groupType (tab) and show SELECTED hotel per route
  const currentHotelRows = useMemo(() => {
    if (!localHotels || !localHotels.length || activeGroupType === null) return [];
    
    // Get all unique routes for this groupType
    const routesInGroup = new Set<number>();
    localHotels
      .filter(h => h.groupType === activeGroupType)
      .forEach(h => routesInGroup.add(h.itineraryRouteId));
    
    // For each route, show the selected hotel for this groupType
    const displayHotels: ItineraryHotelRow[] = [];
    const selectedForGroup = selectedByGroup[activeGroupType] || {};
    
    routesInGroup.forEach(routeId => {
      const selectedHotel = selectedForGroup[routeId];
      if (selectedHotel) {
        displayHotels.push(selectedHotel);
      }
    });
    
    // Sort by day order if available
    return displayHotels.sort((a, b) => {
      const dayA = parseInt(a.day?.replace(/\D/g, '') || '0');
      const dayB = parseInt(b.day?.replace(/\D/g, '') || '0');
      return dayA - dayB;
    });
  }, [localHotels, activeGroupType, selectedByGroup]);

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
    
    // ✅ BLOCK sync when in read-only mode (confirmed itinerary)
    if (readOnly) {
      console.log('⛔ [HotelList] Blocked handleSyncRoute - read-only mode');
      return;
    }

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
    
    // ✅ BLOCK hotel selection when in read-only mode (confirmed itinerary)
    if (readOnly) {
      console.log('⛔ [HotelList] Blocked handleChooseOrUpdateHotel - read-only mode');
      return;
    }
    
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
      
      // ✅ Store selection by groupType and routeId
      const routeId = Number(room.itineraryRouteId);
      const groupType = pendingHotelAction.groupType || activeGroupType || 1;
      
      // Find the full hotel row from localHotels
      const selectedHotel = localHotels.find(h => 
        h.hotelId === room.hotelId && 
        h.itineraryRouteId === routeId &&
        h.groupType === groupType
      );
      
      if (!selectedHotel) {
        console.error('❌ Could not find hotel in localHotels');
        toast.error('Failed to select hotel');
        return;
      }
      
      // Update selectedByGroup[groupType][routeId]
      setSelectedByGroup(prev => {
        const newSelected = { ...prev };
        if (!newSelected[groupType]) {
          newSelected[groupType] = {};
        }
        newSelected[groupType][routeId] = selectedHotel;
        return newSelected;
      });
      
      // Mark as unsaved selection for backend save
      const selectionKey = `${routeId}-${groupType}`;
      setUnsavedSelections(prev => {
        const newMap = new Map(prev);
        newMap.set(selectionKey, room);
        return newMap;
      });
      
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

  // ✅ Notify parent when active group total changes (active groupType only)
  React.useEffect(() => {
    if (onTotalChange && activeGroupType !== null) {
      const total = getActiveTabTotal();
      onTotalChange(total);
    }
  }, [activeGroupType, selectedByGroup, onTotalChange]);


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
          {/* ✅ Read-only mode: Show simple "Hotel Details (₹ total)" like PHP */}
          {readOnly ? (
            <h2 className="text-lg font-semibold text-[#4a4260]">
              Hotel Details ({formatCurrency(getOverallSelectedHotelTotal())})
            </h2>
          ) : (
            <h2 className="text-lg font-semibold text-[#4a4260]">HOTEL LIST</h2>
          )}

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
        {/* ✅ IN READ-ONLY MODE: Hide tabs completely, no group type display */}
        {!readOnly && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {hotelTabs && hotelTabs.length > 0 ? (
              hotelTabs.map((tab) => {
                const isActive = tab.groupType === activeGroupType;
                // ✅ Show sum of SELECTED hotels for this groupType (1 per route)
                const tabTotal = getGroupTotal(tab.groupType);
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
                    {tab.label} ({formatCurrency(tabTotal)})
                  </Button>
                );
              })
            ) : (
              <span className="text-sm text-gray-500">No hotel groups</span>
            )}
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
                      <td className="px-4 py-3 text-sm text-[#6c6c6c] flex items-center justify-between">
                        <span>{hotel.mealPlan || "-"}</span>
                        {readOnly && onCreateVoucher && hotel.hotelId && hotel.hotelName && (
                          (() => {
                            const status = useHotelVoucherStatus(planId, hotel.hotelId!);
                            if (status === 'cancelled') {
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-2 border-[#d546ab] text-[#d546ab] bg-gray-200 text-gray-400 cursor-not-allowed text-xs"
                                  disabled
                                >
                                  Cancelled
                                </Button>
                              );
                            }
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="ml-2 border-[#d546ab] text-[#d546ab] hover:bg-[#fdf6ff] text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCreateVoucher({
                                    hotelId: hotel.hotelId!,
                                    hotelName: hotel.hotelName!,
                                    hotelEmail: '',
                                    hotelStateCity: hotel.destination || '',
                                    routeDates: [hotel.date || ''],
                                    dayNumbers: [parseInt(hotel.day?.replace('Day ', '') || '0')],
                                    hotelDetailsIds: [hotel.itineraryPlanHotelDetailsId || 0]
                                  });
                                }}
                              >
                                Cancel Voucher
                              </Button>
                            );
                          })()
                        )}
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

                                    {/* Room Type Display with Edit Button */}
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-medium text-[#4a4260]">
                                          Room Type
                                        </label>
                                        {!readOnly && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full bg-[#d546ab]/10 hover:bg-[#d546ab]/20 text-[#d546ab]"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              
                                              // Ensure group_type is valid (1-4)
                                              const groupType = hotel.groupType || activeGroupType || 1;
                                              
                                              console.log('Opening room selection modal:', {
                                                hotel_id: hotel.hotelId,
                                                group_type: groupType,
                                                hotel_name: hotel.hotelName,
                                              });
                                              
                                              setRoomSelectionModal({
                                                open: true,
                                                itinerary_plan_hotel_details_ID: hotel.itineraryPlanHotelDetailsId || 0,
                                                itinerary_plan_id: planId,
                                                itinerary_route_id: hotel.itineraryRouteId || 0,
                                                hotel_id: hotel.hotelId || 0,
                                                group_type: groupType,
                                                hotel_name: hotel.hotelName || '',
                                              });
                                            }}
                                            title="Select room categories"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
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
                                      {(() => {
                                        const groupType = activeGroupType || 1;
                                        const routeId = Number(hotel.itineraryRouteId);
                                        const selected = selectedByGroup[groupType]?.[routeId];
                                        return selected?.hotelId === hotel.hotelId ? "Update" : "Choose";
                                      })()}
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

      {/* Hotel Room Selection Modal */}
      {roomSelectionModal && (
        <HotelRoomSelectionModal
          open={roomSelectionModal.open}
          onOpenChange={(open) => {
            if (!open) {
              setRoomSelectionModal(null);
            }
          }}
          itinerary_plan_hotel_details_ID={roomSelectionModal.itinerary_plan_hotel_details_ID}
          itinerary_plan_id={roomSelectionModal.itinerary_plan_id}
          itinerary_route_id={roomSelectionModal.itinerary_route_id}
          hotel_id={roomSelectionModal.hotel_id}
          group_type={roomSelectionModal.group_type}
          hotel_name={roomSelectionModal.hotel_name}
          onSuccess={() => {
            toast.success('Room categories updated successfully');
            // Note: Room selection doesn't affect hotel list, no refresh needed
          }}
        />
      )}
    </Card>
  );
};

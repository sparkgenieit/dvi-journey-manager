// FILE: src/pages/itineraries/ItineraryDetails.tsx

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Clock, MapPin, Car, Calendar, Plus, Trash2, ArrowRight, Ticket, Bell, Building2, Timer, FileText, CreditCard, Receipt } from "lucide-react";
import { ItineraryService } from "@/services/itinerary";
import { api } from "@/lib/api";
import { VehicleList } from "./VehicleList";
import { HotelList } from "./HotelList";
import { VoucherDetailsModal } from "./VoucherDetailsModal";
import { PluckCardModal } from "./PluckCardModal";
import { InvoiceModal } from "./InvoiceModal";
import { IncidentalExpensesModal } from "./IncidentalExpensesModal";
import { toast } from "sonner";

// --------- Types aligned with CURRENT API RESPONSE ---------

type StartSegment = {
  type: "start";
  title: string;
  timeRange: string; // "12:00 AM - 12:00 AM"
};

type TravelSegment = {
  type: "travel";
  from: string;
  to: string;
  timeRange: string; // "06:30 AM - 06:45 AM"
  distance: string;
  duration: string; // "15 Min"
  note?: string | null;
};

type BreakSegment = {
  type: "break";
  location: string;
  duration: string; // "1 Hour 30 Min"
  timeRange: string; // "12:00 PM - 01:30 PM"
};

type Activity = {
  id: number;
  activityId: number;
  title: string;
  description: string;
  amount: number;
  startTime: string | null;
  endTime: string | null;
  duration: string | null;
  image: string | null;
};

type AttractionSegment = {
  type: "attraction";
  name: string;
  description: string;
  visitTime: string; // "06:45 AM - 08:45 AM"
  duration: string; // "2 Hours"
  amount: number | null; // Entry cost
  image: string | null;
  videoUrl?: string | null;
  planOwnWay?: boolean;
  activities?: Activity[];
  hotspotId?: number;
  routeHotspotId?: number;
  locationId?: number | null;
};

type HotspotSegment = {
  type: "hotspot";
  text: string;
  locationId?: number;
};

type CheckinSegment = {
  type: "checkin";
  hotelName: string;
  hotelAddress: string;
  time: string | null; // "06:00 PM"
};

type ReturnSegment = {
  type: "return";
  time: string; // "08:00 PM"
  note?: string | null;
};

type ItinerarySegment =
  | StartSegment
  | TravelSegment
  | BreakSegment
  | AttractionSegment
  | HotspotSegment
  | CheckinSegment
  | ReturnSegment;

type ViaRouteItem = {
  id: number;
  name: string;
};

type ItineraryDay = {
  id: number;
  dayNumber: number;
  date: string; // ISO
  departure: string | null;
  arrival: string | null;
  distance: string;
  startTime: string; // "12:00 PM"
  endTime: string; // "08:00 PM"
  viaRoutes?: ViaRouteItem[];
  segments: ItinerarySegment[];
};

// --------- HOTELS (matches backend DTO) ---------

export type ItineraryHotelRow = {
  groupType: number;
  itineraryRouteId: number;
  day: string;
  destination: string;
  hotelId: number;
  hotelName: string;
  category: number | string;
  roomType: string;
  mealPlan: string;
  totalHotelCost: number;
  totalHotelTaxAmount: number;
};

export type ItineraryHotelTab = {
  groupType: number;
  label: string;
  totalAmount: number;
};

// --------- VEHICLES ---------

type VehicleCostBreakdownItem = {
  label: string;
  amount: string | number;
};

export type ItineraryVehicleRow = {
  vendorName: string | null;
  branchName: string | null;
  vehicleOrigin: string | null;
  totalQty: string;
  totalAmount: string;

  // per-vehicle charges (optional; fill from API)
  rentalCharges?: number | string;
  tollCharges?: number | string;
  parkingCharges?: number | string;
  driverCharges?: number | string;
  permitCharges?: number | string;
  before6amDriver?: number | string;
  before6amVendor?: number | string;
  after8pmDriver?: number | string;
  after8pmVendor?: number | string;
  breakdown?: VehicleCostBreakdownItem[];

  // UI fields for the image + distance row
  dayLabel?: string; // "Day-1 | 28 Nov 2025 | Outstation"
  fromLabel?: string; // "CHENNAI INTERNATIONAL AIRPORT"
  toLabel?: string; // "CHENNAI"
  packageLabel?: string; // "Outstation - 250KM"
  col1Distance?: string; // "30.22 KM"
  col1Duration?: string; // "0 Min"
  col2Distance?: string; // "0.00 KM"
  col2Duration?: string; // "0 Min"
  col3Distance?: string; // "30.22 KM"
  col3Duration?: string; // "0 Min"
  imageUrl?: string | null; // vehicle image if you ever have it
};

type PackageIncludes = {
  description: string | null;
  houseBoatNote: string | null;
  rateNote: string | null;
};

type CostBreakdown = {
  // Hotel costs
  totalRoomCost?: number | null;
  roomCostPerPerson?: number | null;
  hotelPaxCount?: number | null;
  totalAmenitiesCost?: number | null;
  extraBedCost?: number | null;
  childWithBedCost?: number | null;
  childWithoutBedCost?: number | null;
  totalHotelAmount?: number | null;
  
  // Vehicle costs
  totalVehicleCost: number | null;
  totalVehicleAmount: number | null;
  totalVehicleQty?: number | null;
  
  // Activity/Guide costs
  totalGuideCost?: number | null;
  totalHotspotCost?: number | null;
  totalActivityCost?: number | null;
  
  // Final calculations
  additionalMargin: number | null;
  totalAmount: number | null;
  couponDiscount: number | null;
  agentMargin: number | null;
  totalRoundOff: number | null;
  netPayable: number | null;
  companyName: string | null;
};

// ----------------- Main API response types -----------------

type ItineraryDetailsResponse = {
  // planId for routing back to create-itinerary
  planId?: number;
  isConfirmed?: boolean;
  quoteId: string;
  dateRange: string;
  roomCount: number;
  extraBed: number;
  childWithBed: number;
  childWithoutBed: number;
  adults: number;
  children: number;
  infants: number;
  overallCost: string | number; // API is giving "15000.00"

  days: ItineraryDay[];

  // VEHICLES
  vehicles: ItineraryVehicleRow[];

  packageIncludes: PackageIncludes;
  costBreakdown: CostBreakdown;
};

// response shape from /itineraries/hotel_details/:quoteId
type ItineraryHotelDetailsResponse = {
  hotelRatesVisible: boolean;
  hotelTabs: ItineraryHotelTab[];
  hotels: ItineraryHotelRow[];
};

// ----------------- Helper functions -----------------

const formatHeaderDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ----------------- Main Component -----------------

export const ItineraryDetails: React.FC = () => {
  const { id: quoteId } = useParams();
  const [itinerary, setItinerary] = useState<ItineraryDetailsResponse | null>(
    null
  );
  const [hotelDetails, setHotelDetails] =
    useState<ItineraryHotelDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Delete hotspot modal state
  const [deleteHotspotModal, setDeleteHotspotModal] = useState<{
    open: boolean;
    planId: number | null;
    routeId: number | null;
    hotspotId: number | null;
    hotspotName: string;
  }>({
    open: false,
    planId: null,
    routeId: null,
    hotspotId: null,
    hotspotName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Add activity modal state
  type AvailableActivity = {
    id: number;
    title: string;
    description: string;
    costAdult: number;
    costChild: number;
    costForeignAdult: number;
    costForeignChild: number;
    duration: string | null;
  };

  const [addActivityModal, setAddActivityModal] = useState<{
    open: boolean;
    planId: number | null;
    routeId: number | null;
    routeHotspotId: number | null;
    hotspotId: number | null;
    hotspotName: string;
  }>({
    open: false,
    planId: null,
    routeId: null,
    routeHotspotId: null,
    hotspotId: null,
    hotspotName: "",
  });
  const [availableActivities, setAvailableActivities] = useState<AvailableActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Delete activity modal state
  const [deleteActivityModal, setDeleteActivityModal] = useState<{
    open: boolean;
    planId: number | null;
    routeId: number | null;
    activityId: number | null;
    activityName: string;
  }>({
    open: false,
    planId: null,
    routeId: null,
    activityId: null,
    activityName: "",
  });
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  // Add hotspot modal state
  type AvailableHotspot = {
    id: number;
    name: string;
    amount: number;
    description: string;
    timeSpend: number;
    locationMap: string | null;
  };

  const [addHotspotModal, setAddHotspotModal] = useState<{
    open: boolean;
    planId: number | null;
    routeId: number | null;
    locationId: number | null;
    locationName: string;
  }>({
    open: false,
    planId: null,
    routeId: null,
    locationId: null,
    locationName: "",
  });
  const [availableHotspots, setAvailableHotspots] = useState<AvailableHotspot[]>([]);
  const [loadingHotspots, setLoadingHotspots] = useState(false);
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [hotspotSearchQuery, setHotspotSearchQuery] = useState("");

  // Filter hotspots based on search query
  const filteredHotspots = availableHotspots.filter(
    (h) =>
      h.name.toLowerCase().includes(hotspotSearchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(hotspotSearchQuery.toLowerCase())
  );

  // Hotel selection modal state
  type AvailableHotel = {
    id: number;
    name: string;
    address: string;
    category: string;
    checkIn: string;
    checkOut: string;
    distance: string;
  };

  const [hotelSelectionModal, setHotelSelectionModal] = useState<{
    open: boolean;
    planId: number | null;
    routeId: number | null;
    routeDate: string;
  }>({
    open: false,
    planId: null,
    routeId: null,
    routeDate: "",
  });
  const [availableHotels, setAvailableHotels] = useState<AvailableHotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [isSelectingHotel, setIsSelectingHotel] = useState(false);
  const [hotelSearchQuery, setHotelSearchQuery] = useState("");
  const [selectedMealPlan, setSelectedMealPlan] = useState({
    all: false,
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  // Filter hotels based on search query
  const filteredHotels = availableHotels.filter(
    (h) =>
      h.name.toLowerCase().includes(hotelSearchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(hotelSearchQuery.toLowerCase())
  );

  // Gallery modal state
  const [galleryModal, setGalleryModal] = useState<{
    open: boolean;
    images: string[];
    title: string;
  }>({
    open: false,
    images: [],
    title: "",
  });

  // Video modal state
  const [videoModal, setVideoModal] = useState<{
    open: boolean;
    videoUrl: string;
    title: string;
  }>({
    open: false,
    videoUrl: "",
    title: "",
  });

  // Clipboard/Share modal state
  const [clipboardModal, setClipboardModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [clipboardType, setClipboardType] = useState<'recommended' | 'highlights' | 'para'>('recommended');
  const [selectedHotels, setSelectedHotels] = useState<{[key: string]: boolean}>({});

  // Confirm Quotation modal state
  const [confirmQuotationModal, setConfirmQuotationModal] = useState(false);
  const [voucherModal, setVoucherModal] = useState(false);
  const [pluckCardModal, setPluckCardModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'tax' | 'proforma'>('tax');
  const [incidentalModal, setIncidentalModal] = useState(false);
  const [isConfirmingQuotation, setIsConfirmingQuotation] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>('');
  const [agentInfo, setAgentInfo] = useState<{
    quotation_no: string;
    agent_name: string;
    agent_id?: number;
  } | null>(null);
  const [guestDetails, setGuestDetails] = useState({
    salutation: 'Mr',
    name: '',
    contactNo: '',
    age: '',
    alternativeContactNo: '',
    emailId: '',
    arrivalDateTime: '',
    arrivalPlace: '',
    arrivalFlightDetails: '',
    departureDateTime: '',
    departurePlace: '',
    departureFlightDetails: '',
  });
  const [additionalAdults, setAdditionalAdults] = useState<Array<{ name: string; age: string }>>([]);
  const [additionalChildren, setAdditionalChildren] = useState<Array<{ name: string; age: string }>>([]);
  const [additionalInfants, setAdditionalInfants] = useState<Array<{ name: string; age: string }>>([]);

  // Refresh hotel data after hotel update
  const refreshHotelData = async () => {
    if (!quoteId) return;
    
    try {
      const [detailsRes, hotelRes] = await Promise.all([
        ItineraryService.getDetails(quoteId),
        ItineraryService.getHotelDetails(quoteId),
      ]);
      setItinerary(detailsRes as ItineraryDetailsResponse);
      setHotelDetails(hotelRes as ItineraryHotelDetailsResponse);
    } catch (e: any) {
      console.error("Failed to refresh hotel data", e);
    }
  };

  const refreshVehicleData = async () => {
    if (!quoteId) return;
    
    try {
      const detailsRes = await ItineraryService.getDetails(quoteId);
      setItinerary(detailsRes as ItineraryDetailsResponse);
    } catch (e: any) {
      console.error("Failed to refresh vehicle data", e);
    }
  };

  const handleHotelGroupTypeChange = async (groupType: number) => {
    if (!quoteId) return;
    
    console.log("Hotel group type changed to:", groupType);
    
    try {
      // Refetch hotel data for the new group type
      const hotelRes = await ItineraryService.getHotelDetails(quoteId);
      setHotelDetails(hotelRes as ItineraryHotelDetailsResponse);
      
      // Refetch overall itinerary with the selected group type to update costs
      const detailsRes = await ItineraryService.getDetails(quoteId, groupType);
      setItinerary(detailsRes as ItineraryDetailsResponse);
    } catch (e: any) {
      console.error("Failed to update data for group type change", e);
    }
  };

  useEffect(() => {
    if (!quoteId) {
      setError("Missing quote id in URL");
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
      setError(null);

        const [detailsRes, hotelRes] = await Promise.all([
          ItineraryService.getDetails(quoteId),
          ItineraryService.getHotelDetails(quoteId),
        ]);

        setItinerary(detailsRes as ItineraryDetailsResponse);
        setHotelDetails(hotelRes as ItineraryHotelDetailsResponse);
      } catch (e: any) {
        console.error("Failed to load itinerary details", e);
        setError("Failed to load itinerary details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [quoteId]);

  const handleDeleteHotspot = async () => {
    if (!deleteHotspotModal.planId || !deleteHotspotModal.routeId || !deleteHotspotModal.hotspotId) {
      return;
    }

    setIsDeleting(true);
    try {
      await ItineraryService.deleteHotspot(
        deleteHotspotModal.planId,
        deleteHotspotModal.routeId,
        deleteHotspotModal.hotspotId
      );
      
      toast.success("Hotspot deleted successfully");
      
      // Close modal
      setDeleteHotspotModal({
        open: false,
        planId: null,
        routeId: null,
        hotspotId: null,
        hotspotName: "",
      });
      
      // Reload itinerary data
      if (quoteId) {
        const [detailsRes, hotelRes] = await Promise.all([
          ItineraryService.getDetails(quoteId),
          ItineraryService.getHotelDetails(quoteId),
        ]);
        setItinerary(detailsRes as ItineraryDetailsResponse);
        setHotelDetails(hotelRes as ItineraryHotelDetailsResponse);
      }
    } catch (e: any) {
      console.error("Failed to delete hotspot", e);
      toast.error(e?.message || "Failed to delete hotspot");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteHotspotModal = (
    planId: number,
    routeId: number,
    hotspotId: number,
    hotspotName: string
  ) => {
    setDeleteHotspotModal({
      open: true,
      planId,
      routeId,
      hotspotId,
      hotspotName,
    });
  };

  const openAddActivityModal = async (
    planId: number,
    routeId: number,
    routeHotspotId: number,
    hotspotId: number,
    hotspotName: string
  ) => {
    setAddActivityModal({
      open: true,
      planId,
      routeId,
      routeHotspotId,
      hotspotId,
      hotspotName,
    });

    // Fetch available activities
    setLoadingActivities(true);
    try {
      const activities = await ItineraryService.getAvailableActivities(hotspotId);
      setAvailableActivities(activities as AvailableActivity[]);
    } catch (e: any) {
      console.error("Failed to load activities", e);
      toast.error(e?.message || "Failed to load activities");
      setAvailableActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleAddActivity = async (activityId: number, amount: number) => {
    if (!addActivityModal.planId || !addActivityModal.routeId || !addActivityModal.routeHotspotId || !addActivityModal.hotspotId) {
      return;
    }

    setIsAddingActivity(true);
    try {
      await ItineraryService.addActivity({
        planId: addActivityModal.planId,
        routeId: addActivityModal.routeId,
        routeHotspotId: addActivityModal.routeHotspotId,
        hotspotId: addActivityModal.hotspotId,
        activityId,
        amount,
      });

      toast.success("Activity added successfully");

      // Close modal
      setAddActivityModal({
        open: false,
        planId: null,
        routeId: null,
        routeHotspotId: null,
        hotspotId: null,
        hotspotName: "",
      });

      // Reload itinerary data
      if (quoteId) {
        const [detailsRes, hotelRes] = await Promise.all([
          ItineraryService.getDetails(quoteId),
          ItineraryService.getHotelDetails(quoteId),
        ]);
        setItinerary(detailsRes as ItineraryDetailsResponse);
        setHotelDetails(hotelRes as ItineraryHotelDetailsResponse);
      }
    } catch (e: any) {
      console.error("Failed to add activity", e);
      toast.error(e?.message || "Failed to add activity");
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!deleteActivityModal.planId || !deleteActivityModal.routeId || !deleteActivityModal.activityId) {
      return;
    }

    setIsDeletingActivity(true);
    try {
      await ItineraryService.deleteActivity(
        deleteActivityModal.planId,
        deleteActivityModal.routeId,
        deleteActivityModal.activityId
      );

      toast.success("Activity deleted successfully");

      // Close modal
      setDeleteActivityModal({
        open: false,
        planId: null,
        routeId: null,
        activityId: null,
        activityName: "",
      });

      // Reload itinerary data
      if (quoteId) {
        const [detailsRes, hotelRes] = await Promise.all([
          ItineraryService.getDetails(quoteId),
          ItineraryService.getHotelDetails(quoteId),
        ]);
        setItinerary(detailsRes as ItineraryDetailsResponse);
        setHotelDetails(hotelRes as ItineraryHotelDetailsResponse);
      }
    } catch (e: any) {
      console.error("Failed to delete activity", e);
      toast.error(e?.message || "Failed to delete activity");
    } finally {
      setIsDeletingActivity(false);
    }
  };

  const openDeleteActivityModal = (
    planId: number,
    routeId: number,
    activityId: number,
    activityName: string
  ) => {
    setDeleteActivityModal({
      open: true,
      planId,
      routeId,
      activityId,
      activityName,
    });
  };

  const openAddHotspotModal = async (
    planId: number,
    routeId: number,
    locationId: number,
    locationName: string
  ) => {
    setAddHotspotModal({
      open: true,
      planId,
      routeId,
      locationId,
      locationName,
    });

    // Fetch available hotspots for this location
    setLoadingHotspots(true);
    try {
      const hotspots = await ItineraryService.getAvailableHotspots(locationId);
      setAvailableHotspots(hotspots as AvailableHotspot[]);
    } catch (e: any) {
      console.error("Failed to fetch available hotspots", e);
      toast.error(e?.message || "Failed to load available hotspots");
    } finally {
      setLoadingHotspots(false);
    }
  };

  const handleAddHotspot = async (hotspotId: number) => {
    if (!addHotspotModal.planId || !addHotspotModal.routeId) {
      return;
    }

    setIsAddingHotspot(true);
    try {
      await ItineraryService.addHotspot(
        addHotspotModal.planId,
        addHotspotModal.routeId,
        hotspotId
      );

      toast.success("Hotspot added successfully");

      // Close modal
      setAddHotspotModal({
        open: false,
        planId: null,
        routeId: null,
        locationId: null,
        locationName: "",
      });
      setHotspotSearchQuery("");

      // Reload itinerary data
      if (quoteId) {
        const [detailsRes, hotelRes] = await Promise.all([
          ItineraryService.getDetails(quoteId),
          ItineraryService.getHotelDetails(quoteId),
        ]);
        setItinerary(detailsRes as ItineraryDetailsResponse);
        setHotelDetails(hotelRes as ItineraryHotelDetailsResponse);
      }
    } catch (e: any) {
      console.error("Failed to add hotspot", e);
      toast.error(e?.message || "Failed to add hotspot");
    } finally {
      setIsAddingHotspot(false);
    }
  };

  const openGalleryModal = (images: string[], title: string) => {
    setGalleryModal({
      open: true,
      images: images.filter(img => img && img.trim() !== ''),
      title,
    });
  };

  const openHotelSelectionModal = async (
    planId: number,
    routeId: number,
    routeDate: string
  ) => {
    setHotelSelectionModal({
      open: true,
      planId,
      routeId,
      routeDate,
    });

    // Fetch available hotels for this route
    setLoadingHotels(true);
    try {
      const hotels = await ItineraryService.getAvailableHotels(routeId);
      setAvailableHotels(hotels as AvailableHotel[]);
    } catch (e: any) {
      console.error("Failed to fetch available hotels", e);
      toast.error(e?.message || "Failed to load available hotels");
    } finally {
      setLoadingHotels(false);
    }
  };

  const handleSelectHotel = async (hotelId: number, roomTypeId: number = 1) => {
    if (!hotelSelectionModal.planId || !hotelSelectionModal.routeId) {
      return;
    }

    setIsSelectingHotel(true);
    try {
      await ItineraryService.selectHotel(
        hotelSelectionModal.planId,
        hotelSelectionModal.routeId,
        hotelId,
        roomTypeId,
        selectedMealPlan
      );

      toast.success("Hotel selected successfully");

      // Close modal
      setHotelSelectionModal({
        open: false,
        planId: null,
        routeId: null,
        routeDate: "",
      });
      setHotelSearchQuery("");
      setSelectedMealPlan({ all: false, breakfast: false, lunch: false, dinner: false });

      // Reload itinerary data
      if (quoteId) {
        const [detailsRes, hotelRes] = await Promise.all([
          ItineraryService.getDetails(quoteId),
          ItineraryService.getHotelDetails(quoteId),
        ]);
        setItinerary(detailsRes as ItineraryDetailsResponse);
        setHotelDetails(hotelRes as ItineraryHotelDetailsResponse);
      }
    } catch (e: any) {
      console.error("Failed to select hotel", e);
      toast.error(e?.message || "Failed to select hotel");
    } finally {
      setIsSelectingHotel(false);
    }
  };

  const openVideoModal = (videoUrl: string, title: string) => {
    setVideoModal({
      open: true,
      videoUrl,
      title,
    });
  };

  const openConfirmQuotationModal = async () => {
    if (!itinerary?.planId) {
      toast.error('Plan ID not found');
      return;
    }

    setConfirmQuotationModal(true);

    try {
      // Fetch customer info form data
      const customerInfo = await ItineraryService.getCustomerInfoForm(itinerary.planId);
      setAgentInfo({
        quotation_no: customerInfo.quotation_no,
        agent_name: customerInfo.agent_name,
        agent_id: itinerary.planId, // We'll need to pass actual agent ID
      });
      setWalletBalance(customerInfo.wallet_balance);

      // Check wallet balance and get plan details
      const planDetails = await api(`itineraries/edit/${itinerary.planId}`, { method: 'GET' });
      if (planDetails?.plan?.agent_ID) {
        const walletData = await ItineraryService.checkWalletBalance(planDetails.plan.agent_ID);
        setWalletBalance(walletData.formatted_balance);
        setAgentInfo(prev => prev ? { ...prev, agent_id: planDetails.plan.agent_ID } : null);
      }

      // Prefill arrival and departure details from plan
      if (planDetails?.plan) {
        const plan = planDetails.plan;
        const formatDateTime = (dateTime: string) => {
          if (!dateTime) return '';
          const date = new Date(dateTime);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          const hours = date.getHours();
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          return `${day}-${month}-${year} ${displayHours}:${minutes} ${ampm}`;
        };

        setGuestDetails(prev => ({
          ...prev,
          arrivalDateTime: plan.trip_start_date_and_time ? formatDateTime(plan.trip_start_date_and_time) : '',
          arrivalPlace: plan.arrival_location || '',
          departureDateTime: plan.trip_end_date_and_time ? formatDateTime(plan.trip_end_date_and_time) : '',
          departurePlace: plan.departure_location || '',
        }));
      }
    } catch (e: any) {
      console.error('Failed to load customer info', e);
      toast.error(e?.message || 'Failed to load customer information');
    }
  };

  const handleConfirmQuotation = async () => {
    if (!itinerary?.planId || !agentInfo?.agent_id) {
      toast.error('Missing required information');
      return;
    }

    // Validate required fields - only name and contact number are mandatory
    if (!guestDetails.name || !guestDetails.contactNo) {
      toast.error('Please fill in guest name and contact number');
      return;
    }

    setIsConfirmingQuotation(true);

    try {
      await ItineraryService.confirmQuotation({
        itinerary_plan_ID: itinerary.planId,
        agent: agentInfo.agent_id,
        primary_guest_salutation: guestDetails.salutation,
        primary_guest_name: guestDetails.name,
        primary_guest_contact_no: guestDetails.contactNo,
        primary_guest_age: guestDetails.age,
        primary_guest_alternative_contact_no: guestDetails.alternativeContactNo,
        primary_guest_email_id: guestDetails.emailId,
        adult_name: additionalAdults.map(a => a.name),
        adult_age: additionalAdults.map(a => a.age),
        child_name: additionalChildren.map(c => c.name),
        child_age: additionalChildren.map(c => c.age),
        infant_name: additionalInfants.map(i => i.name),
        infant_age: additionalInfants.map(i => i.age),
        arrival_date_time: guestDetails.arrivalDateTime,
        arrival_place: guestDetails.arrivalPlace,
        arrival_flight_details: guestDetails.arrivalFlightDetails,
        departure_date_time: guestDetails.departureDateTime,
        departure_place: guestDetails.departurePlace,
        departure_flight_details: guestDetails.departureFlightDetails,
        price_confirmation_type: 'old',
        hotel_group_type: 'undefined',
      });

      toast.success('Quotation confirmed successfully!');
      setConfirmQuotationModal(false);

      // Refresh data to show confirmed status and links
      if (quoteId) {
        const detailsRes = await ItineraryService.getDetails(quoteId);
        setItinerary(detailsRes as ItineraryDetailsResponse);
      }

      // Reset form
      setGuestDetails({
        salutation: 'Mr',
        name: '',
        contactNo: '',
        age: '',
        alternativeContactNo: '',
        emailId: '',
        arrivalDateTime: '',
        arrivalPlace: '',
        arrivalFlightDetails: '',
        departureDateTime: '',
        departurePlace: '',
        departureFlightDetails: '',
      });
      setAdditionalAdults([]);
      setAdditionalChildren([]);
      setAdditionalInfants([]);
    } catch (e: any) {
      console.error('Failed to confirm quotation', e);
      toast.error(e?.message || 'Failed to confirm quotation');
    } finally {
      setIsConfirmingQuotation(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-full flex justify-center items-center py-16">
        <p className="text-sm text-[#6c6c6c]">Loading itinerary details…</p>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="w-full max-w-full flex flex-col items-center py-16 gap-4">
        <p className="text-sm text-red-600">
          {error || "Itinerary details not found"}
        </p>
        <Link to="/latest-itinerary">
          <Button
            variant="outline"
            className="border-[#d546ab] text-[#d546ab] hover:bg-[#fdf6ff]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Route List
          </Button>
        </Link>
      </div>
    );
  }

  const backToListHref = "/latest-itinerary";
  const modifyItineraryHref = itinerary.planId
    ? `/create-itinerary?id=${itinerary.planId}`
    : "#";

  return (
    <div className="w-full max-w-full space-y-6 pb-8">
      {/* Header Card */}
      <Card className="border-none shadow-none bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-xl font-semibold text-[#4a4260]">
              Tour Itinerary Plan
            </h1>
            <div className="flex flex-wrap gap-2">
              <Link to={backToListHref}>
                <Button
                  variant="outline"
                  className="border-[#d546ab] text-[#d546ab] hover:bg-[#fdf6ff]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to List
                </Button>
              </Link>

              {itinerary.isConfirmed && (
                <>
                  <Button 
                    variant="outline"
                    className="border-[#6f42c1] text-[#6f42c1] hover:bg-[#6f42c1] hover:text-white"
                    onClick={() => setPluckCardModal(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Download Pluck Card
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white"
                    onClick={() => setVoucherModal(true)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Voucher Details
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#fd7e14] text-[#fd7e14] hover:bg-[#fd7e14] hover:text-white"
                    onClick={() => setIncidentalModal(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Incidental Expenses
                  </Button>
                  <Link to={modifyItineraryHref}>
                    <Button 
                      variant="outline"
                      className="border-[#dc3545] text-[#dc3545] hover:bg-[#dc3545] hover:text-white"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Modify Itinerary
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    className="border-[#17a2b8] text-[#17a2b8] hover:bg-[#17a2b8] hover:text-white"
                    onClick={() => { setInvoiceType('tax'); setInvoiceModal(true); }}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Invoice Tax
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#fd7e14] text-[#fd7e14] hover:bg-[#fd7e14] hover:text-white"
                    onClick={() => { setInvoiceType('proforma'); setInvoiceModal(true); }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Invoice Performa
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quote Info */}
          <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#6c6c6c]" />
                <span className="font-medium text-[#4a4260]">
                  {itinerary.quoteId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#6c6c6c]" />
                <span className="text-[#6c6c6c]">{itinerary.dateRange}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#6c6c6c]">Overall Trip Cost :</p>
              <p className="text-2xl font-bold text-[#d546ab]">
                ₹ {itinerary.overallCost}
              </p>
            </div>
          </div>

          {/* Trip Details */}
          <div className="flex flex-wrap gap-4 text-sm text-[#6c6c6c] mb-4">
            <span>Room Count: {itinerary.roomCount}</span>
            <span>Extra Bed: {itinerary.extraBed}</span>
            <span>Child with bed: {itinerary.childWithBed}</span>
            <span>Child without bed: {itinerary.childWithoutbed}</span>
            <div className="ml-auto flex gap-4">
              <span>Adults: {itinerary.adults}</span>
              <span>Child: {itinerary.children}</span>
              <span>Infants: {itinerary.infants}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {!itinerary.isConfirmed && (
              <Button 
                className="bg-[#28a745] hover:bg-[#218838]"
                onClick={openConfirmQuotationModal}
              >
                <Bell className="mr-2 h-4 w-4" />
                Confirm Quotation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Itinerary */}
      {itinerary.days.map((day) => (
        <Card key={day.id} className="border border-[#e5d9f2] bg-white">
          <CardContent className="pt-4">
            {/* Day Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 p-3 bg-[#f8f5fc] rounded-lg border border-[#e5d9f2]">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-[#d546ab]" />
                <div>
                  <h3 className="font-semibold text-[#4a4260]">
                    DAY {day.dayNumber} - {formatHeaderDate(day.date)}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[#6c6c6c] flex-wrap">
                    <span className="font-medium">{day.departure}</span>
                    {day.viaRoutes && day.viaRoutes.length > 0 && (
                      <>
                        <ArrowRight className="h-4 w-4 text-[#d546ab] mx-1" />
                        <span className="text-[#4a4260]" title={day.viaRoutes.map(v => v.name).join(', ')}>
                          {day.viaRoutes.map(v => v.name).join(', ')}
                        </span>
                      </>
                    )}
                    <MapPin className="h-3 w-3 mx-1" />
                    <span className="font-medium">{day.arrival}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-[#d546ab] text-white px-3 py-1 rounded-full">
                  {day.distance}
                </span>
              </div>
            </div>

            {/* Time Range */}
            <div className="flex items-center gap-4 mb-6 ml-2">
              <span className="text-[#d546ab] font-semibold">
                {day.startTime}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#d546ab] to-transparent" />
              <span className="text-[#6c6c6c]">{day.endTime}</span>
            </div>

            {/* Segments */}
            <div className="space-y-4">
              {day.segments.map((segment, idx) => (
                <div key={idx} className="ml-8">
                  {segment.type === "start" && (
                    <div className="flex items-center gap-3 mb-4">
                      <Car className="h-5 w-5 text-[#6c6c6c]" />
                      <div>
                        <p className="font-medium text-[#4a4260]">
                          {segment.title}
                        </p>
                        <p className="text-sm text-[#6c6c6c]">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {segment.timeRange}
                        </p>
                      </div>
                    </div>
                  )}

                  {segment.type === "travel" && (
                    <div className="bg-[#e8f9fd] rounded-lg p-3 mb-3">
                      <div className="flex items-start gap-3">
                        <Car className="h-5 w-5 text-[#4ba3c3] mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-[#4a4260]">
                            <span className="font-medium">Travelling from</span>{" "}
                            <span className="text-[#d546ab]">
                              {segment.from}
                            </span>{" "}
                            <span className="font-medium">to</span>{" "}
                            <span className="text-[#d546ab]">{segment.to}</span>
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#6c6c6c]">
                            <span>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {segment.timeRange}
                            </span>
                            <span>
                              <MapPin className="inline h-3 w-3 mr-1" />
                              {segment.distance}
                            </span>
                            <span>⏱ {segment.duration}</span>
                          </div>
                          {segment.note && (
                            <p className="text-xs text-[#6c6c6c] mt-2">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {segment.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {segment.type === "attraction" && (
                    <>
                      <div className="bg-gradient-to-r from-[#faf5ff] to-[#f3e8ff] rounded-lg p-4 mb-3 border border-[#e5d9f2]">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <img
                            src={
                              segment.image ||
                              "https://placehold.co/120x120/e9d5f7/4a4260?text=Spot"
                            }
                            alt={segment.name}
                            className="w-full sm:w-32 h-32 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-[#4a4260] mb-2">
                                {segment.name}
                              </h4>
                              <button
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete Hotspot"
                                onClick={() =>
                                  openDeleteHotspotModal(
                                    itinerary.planId || 0,
                                    day.id,
                                    segment.routeHotspotId || 0,
                                    segment.name
                                  )
                                }
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                            <p className="text-sm text-[#6c6c6c] mb-3">
                              {segment.description}
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-[#6c6c6c]">
                              <span>
                                <Clock className="inline h-3 w-3 mr-1" />
                                {segment.visitTime}
                              </span>
                              {segment.amount && segment.amount > 0 && (
                                <span>
                                  <Ticket className="inline h-3 w-3 mr-1" />
                                  ₹ {segment.amount.toFixed(2)}
                                </span>
                              )}
                              <span>
                                <Clock className="inline h-3 w-3 mr-1" />
                                {segment.duration}
                              </span>
                              <button 
                                className="text-[#d546ab] hover:underline flex items-center"
                                onClick={() =>
                                  openAddActivityModal(
                                    itinerary.planId || 0,
                                    day.id,
                                    segment.routeHotspotId || 0,
                                    segment.hotspotId || 0,
                                    segment.name
                                  )
                                }
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Activity
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:ml-auto">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="View Gallery"
                              onClick={() =>
                                openGalleryModal(
                                  segment.image ? [segment.image] : [],
                                  segment.name
                                )
                              }
                            >
                              📷
                            </Button>
                            {segment.videoUrl && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="View Video"
                                onClick={() =>
                                  openVideoModal(segment.videoUrl || "", segment.name)
                                }
                              >
                                🎥
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Plan Own Way Alert */}
                      {segment.planOwnWay && (
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-red-500 rounded-full p-2">
                            <Bell className="h-4 w-4 text-white" />
                          </div>
                          <div className="bg-red-500 text-white px-4 py-2 rounded-lg flex-1">
                            <p className="text-sm font-medium m-0">
                              You have deviated from our suggestion and implement your approach.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Activities List */}
                      {segment.activities && segment.activities.length > 0 && (
                        <div className="ml-8 mt-2 border-t border-[#e5d9f2] pt-4">
                          <h5 className="font-semibold text-[#4a4260] mb-3">Activity</h5>
                          <div className="space-y-3">
                            {segment.activities.map((activity) => (
                              <div
                                key={activity.id}
                                className="border-l-2 border-dashed border-[#d546ab] pl-4"
                              >
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-[#e5d9f2]">
                                  <div className="flex flex-col sm:flex-row gap-4">
                                    <img
                                      src={
                                        activity.image ||
                                        "https://placehold.co/140x100/e9d5f7/4a4260?text=Activity"
                                      }
                                      alt={activity.title}
                                      className="w-full sm:w-36 h-24 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between">
                                        <h6 className="font-semibold text-[#4a4260] mb-2">
                                          {activity.title}
                                        </h6>
                                        <button
                                          className="text-red-500 hover:text-red-700 p-1"
                                          title="Delete Activity"
                                          onClick={() =>
                                            openDeleteActivityModal(
                                              itinerary.planId || 0,
                                              day.id,
                                              activity.id,
                                              activity.title
                                            )
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                      <p className="text-sm text-[#6c6c6c] mb-3">
                                        {activity.description}
                                      </p>
                                      <div className="flex flex-wrap gap-4 text-xs text-[#6c6c6c]">
                                        {activity.startTime && activity.endTime && (
                                          <span>
                                            <Clock className="inline h-3 w-3 mr-1" />
                                            {activity.startTime} - {activity.endTime}
                                          </span>
                                        )}
                                        {activity.amount > 0 && (
                                          <span>
                                            <Ticket className="inline h-3 w-3 mr-1" />
                                            ₹ {activity.amount.toFixed(2)}
                                          </span>
                                        )}
                                        {activity.duration && (
                                          <span>
                                            <Timer className="inline h-3 w-3 mr-1" />
                                            {activity.duration}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        title="View Activity Gallery"
                                        onClick={() =>
                                          openGalleryModal(
                                            activity.image ? [activity.image] : [],
                                            activity.title
                                          )
                                        }
                                      >
                                        📷
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {segment.type === "break" && (
                    <div className="bg-[#fff3cd] rounded-lg p-3 mb-3 border border-[#ffc107]">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-[#856404]" />
                        <div className="flex-1">
                          <p className="text-sm text-[#4a4260]">
                            <span className="font-medium">Expect a waiting time of approximately</span>{" "}
                            <span className="text-[#d546ab] font-semibold">{segment.duration}</span>{" "}
                            <span className="font-medium">at this location</span>{" "}
                            <span className="text-[#d546ab] font-semibold">({segment.location})</span>
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#6c6c6c]">
                            <span>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {segment.timeRange}
                            </span>
                            <span>⏱ {segment.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {segment.type === "checkin" && (
                    <div 
                      className="bg-[#e8f9fd] rounded-lg p-3 mb-3 border border-[#4ba3c3] cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openHotelSelectionModal(
                        itinerary.planId || 0,
                        day.id,
                        day.date
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-[#4ba3c3]" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#4a4260] mb-1">
                            Check-in to {segment.hotelName}
                          </p>
                          {segment.hotelAddress && (
                            <p className="text-xs text-[#6c6c6c] mb-2">
                              {segment.hotelAddress}
                            </p>
                          )}
                          {segment.time && (
                            <p className="text-xs text-[#6c6c6c]">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {segment.time}
                            </p>
                          )}
                          <p className="text-xs text-[#d546ab] mt-2">
                            Click to change hotelsss
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {segment.type === "hotspot" && (
                    <div className="flex items-center gap-2 mb-3 text-[#d546ab]">
                      <Plus className="h-4 w-4" />
                      <button 
                        className="text-sm hover:underline"
                        onClick={() =>
                          openAddHotspotModal(
                            itinerary.planId || 0,
                            day.id,
                            segment.locationId || 0,
                            day.arrival || "Location"
                          )
                        }
                      >
                        {segment.text}
                      </button>
                    </div>
                  )}

                  {segment.type === "return" && (
                    <div className="flex items-center gap-3 text-sm text-[#6c6c6c]">
                      <Car className="h-5 w-5" />
                      <div>
                        <p className="font-medium text-[#4a4260]">
                          Return to Origin and Relax
                        </p>
                        <p>
                          <Clock className="inline h-3 w-3 mr-1" />
                          {segment.time}
                          {segment.note && (
                            <span className="ml-2">🔘 {segment.note}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Guide Button */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#d546ab] border-[#d546ab] hover:bg-[#fdf6ff]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Hotel List (separate component) */}
      {hotelDetails && (
        <HotelList
          hotels={hotelDetails.hotels}
          hotelTabs={hotelDetails.hotelTabs}
          hotelRatesVisible={hotelDetails.hotelRatesVisible}
          onRefresh={refreshHotelData}
          onGroupTypeChange={handleHotelGroupTypeChange}
        />
      )}

      {/* Vehicle List (separate component) */}
      <VehicleList
        vehicleTypeLabel="Sedan"
        vehicles={itinerary.vehicles}
        itineraryPlanId={itinerary.planId}
        onRefresh={refreshVehicleData}
      />

      {/* Package Includes & Overall Cost */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Package Includes */}
        <Card className="border-none shadow-none bg-white">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-[#4a4260] mb-4">
              Package Includes
            </h2>
            <div className="space-y-3 text-sm text-[#6c6c6c]">
              <div>
                <p className="font-medium text-[#4a4260] mb-1">
                  Package Includes: (Inclusion)
                </p>
                <p>{itinerary.packageIncludes.description}</p>
              </div>
              <div>
                <p className="font-medium text-[#4a4260] mb-1">
                  If staying in the House boat At Alleppey/Kumarakom
                </p>
                <p className="whitespace-pre-line">
                  {itinerary.packageIncludes.houseBoatNote}
                </p>
              </div>
              <div>
                <p className="font-medium text-[#4a4260]">
                  {itinerary.packageIncludes.rateNote}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Cost */}
        <Card className="border-none shadow-none bg-gradient-to-br from-[#faf5ff] to-white">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-[#4a4260] mb-4">
              OVERALL COST
            </h2>
            <div className="space-y-2 text-sm">
              {/* Hotel Costs - Itemized */}
              {itinerary.costBreakdown.totalRoomCost !== undefined && itinerary.costBreakdown.totalRoomCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6c6c6c]">
                    Total Room Cost ({itinerary.costBreakdown.hotelPaxCount || 0} pax * ₹{itinerary.costBreakdown.roomCostPerPerson?.toFixed(2) || "0.00"})
                  </span>
                  <span className="text-[#4a4260]">
                    ₹ {itinerary.costBreakdown.totalRoomCost.toFixed(2)}
                  </span>
                </div>
              )}
              {itinerary.costBreakdown.totalAmenitiesCost !== undefined && itinerary.costBreakdown.totalAmenitiesCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6c6c6c]">Total Amenities Cost</span>
                  <span className="text-[#4a4260]">
                    ₹ {itinerary.costBreakdown.totalAmenitiesCost.toFixed(2)}
                  </span>
                </div>
              )}
              {itinerary.costBreakdown.extraBedCost !== undefined && itinerary.costBreakdown.extraBedCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6c6c6c]">Extra Bed Cost ({itinerary.extraBed || 0})</span>
                  <span className="text-[#4a4260]">
                    ₹ {itinerary.costBreakdown.extraBedCost.toFixed(2)}
                  </span>
                </div>
              )}
              {itinerary.costBreakdown.childWithBedCost !== undefined && itinerary.costBreakdown.childWithBedCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6c6c6c]">Child With Bed Cost ({itinerary.childWithBed || 0})</span>
                  <span className="text-[#4a4260]">
                    ₹ {itinerary.costBreakdown.childWithBedCost.toFixed(2)}
                  </span>
                </div>
              )}
              {itinerary.costBreakdown.childWithoutBedCost !== undefined && itinerary.costBreakdown.childWithoutBedCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6c6c6c]">Child Without Bed Cost ({itinerary.childWithoutBed || 0})</span>
                  <span className="text-[#4a4260]">
                    ₹ {itinerary.costBreakdown.childWithoutBedCost.toFixed(2)}
                  </span>
                </div>
              )}
              {itinerary.costBreakdown.totalHotelAmount !== undefined && itinerary.costBreakdown.totalHotelAmount > 0 && (
                <div className="flex justify-between font-semibold">
                  <span className="text-[#4a4260]">Total Hotel Amount</span>
                  <span className="text-[#4a4260]">
                    ₹ {itinerary.costBreakdown.totalHotelAmount.toFixed(2)}
                  </span>
                </div>
              )}
              
              {/* Vehicle Costs */}
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">Total Vehicle cost (₹)</span>
                <span className="text-[#4a4260]">
                  ₹ {itinerary.costBreakdown.totalVehicleCost?.toFixed(2) ?? "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">Total Vehicle Amount</span>
                <span className="text-[#4a4260]">
                  ₹ {itinerary.costBreakdown.totalVehicleAmount?.toFixed(2) ?? "0.00"}
                </span>
              </div>
              {itinerary.costBreakdown.totalVehicleQty !== undefined && itinerary.costBreakdown.totalVehicleQty > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6c6c6c]">Total Vehicle Quantity</span>
                  <span className="text-[#4a4260]">
                    {itinerary.costBreakdown.totalVehicleQty}
                  </span>
                </div>
              )}
              
              {/* Guide/Activity Costs */}
              {itinerary.costBreakdown.totalGuideCost !== undefined && itinerary.costBreakdown.totalGuideCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6c6c6c]">Total Guide Cost</span>
                  <span className="text-[#4a4260]">
                    ₹ {itinerary.costBreakdown.totalGuideCost.toFixed(2)}
                  </span>
                </div>
              )}
              {itinerary.costBreakdown.totalHotspotCost !== undefined && itinerary.costBreakdown.totalHotspotCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6c6c6c]">Total Hotspot Cost</span>
                  <span className="text-[#4a4260]">
                    ₹ {itinerary.costBreakdown.totalHotspotCost.toFixed(2)}
                  </span>
                </div>
              )}
              {itinerary.costBreakdown.totalActivityCost !== undefined && itinerary.costBreakdown.totalActivityCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6c6c6c]">Total Activity Cost</span>
                  <span className="text-[#4a4260]">
                    ₹ {itinerary.costBreakdown.totalActivityCost.toFixed(2)}
                  </span>
                </div>
              )}
              
              {/* Final Calculations */}
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">
                  Total Additional Margin (10%)
                </span>
                <span className="text-[#4a4260]">
                  ₹ {itinerary.costBreakdown.additionalMargin?.toFixed(2) ?? "0.00"}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-[#4a4260]">Total Amount</span>
                <span className="text-[#4a4260]">
                  ₹ {itinerary.costBreakdown.totalAmount?.toFixed(2) ?? "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-[#d546ab]">
                <span>Coupon Discount</span>
                <span>- ₹ {itinerary.costBreakdown.couponDiscount?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">Agent Margin</span>
                <span className="text-[#4a4260]">
                  ₹ {itinerary.costBreakdown.agentMargin?.toFixed(2) ?? "0.00"}
                </span>
              </div>
              
              {/* Agent Profit Input (for user level 4) */}
              <div className="flex justify-between items-center bg-[#faf5ff] p-2 rounded">
                <label htmlFor="agentProfit" className="text-[#6c6c6c] font-medium">
                  Agent Profit:
                </label>
                <input
                  type="number"
                  id="agentProfit"
                  placeholder="0.00"
                  className="w-32 px-2 py-1 text-sm border border-[#e5d9f2] rounded text-right"
                  defaultValue={0}
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">Total Round Off</span>
                <span className="text-[#4a4260]">
                  {itinerary.costBreakdown.totalRoundOff && itinerary.costBreakdown.totalRoundOff > 0 ? "+" : ""}
                  ₹ {itinerary.costBreakdown.totalRoundOff?.toFixed(2) ?? "0.00"}
                </span>
              </div>
              <div className="border-t-2 border-[#d546ab] pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[#4a4260]">
                    Net Payable to {itinerary.costBreakdown.companyName || "Doview Holidays India Pvt ltd"}
                  </span>
                  <span className="text-[#d546ab]">
                    ₹ {itinerary.costBreakdown.netPayable?.toFixed(2) ?? "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Clipboard Dropdown */}
        <div className="relative group">
          <Button className="bg-[#8b43d1] hover:bg-[#7c37c1]">
            Clipboard ▼
          </Button>
          <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <button
              className="w-full text-left px-4 py-2 hover:bg-[#f8f5fc] text-[#4a4260] flex items-center gap-2"
              onClick={() => {
                setClipboardType('recommended');
                setClipboardModal(true);
              }}
            >
              <span>📋</span> Copy Recommended
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-[#f8f5fc] text-[#4a4260] flex items-center gap-2"
              onClick={() => {
                setClipboardType('highlights');
                setClipboardModal(true);
              }}
            >
              <span>✨</span> Copy to Highlights
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-[#f8f5fc] text-[#4a4260] flex items-center gap-2 rounded-b-lg"
              onClick={() => {
                setClipboardType('para');
                setClipboardModal(true);
              }}
            >
              <span>📝</span> Copy to Para
            </button>
          </div>
        </div>

        <Link to="/create-itinerary">
          <Button className="bg-[#28a745] hover:bg-[#218838]">
            Create Itinerary
          </Button>
        </Link>
        
        <Button 
          className="bg-[#d546ab] hover:bg-[#c03d9f]"
          onClick={openConfirmQuotationModal}
        >
          <Bell className="mr-2 h-4 w-4" />
          Confirm Quotation
        </Button>

        {/* Share Dropdown */}
        <div className="relative group">
          <Button className="bg-[#17a2b8] hover:bg-[#138496]">
            Share ▼
          </Button>
          <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <button
              className="w-full text-left px-4 py-2 hover:bg-[#f8f5fc] text-[#4a4260] flex items-center gap-2"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard!");
              }}
            >
              <span>🔗</span> Copy Link
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-[#f8f5fc] text-[#4a4260] flex items-center gap-2"
              onClick={() => {
                const url = window.location.href;
                const message = `Check out this itinerary: ${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              }}
            >
              <span>💬</span> Share on WhatsApp
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-[#f8f5fc] text-[#4a4260] flex items-center gap-2 rounded-b-lg"
              onClick={() => setShareModal(true)}
            >
              <span>✉️</span> Share via Email
            </button>
          </div>
        </div>
      </div>

      {/* Delete Hotspot Modal */}
      <Dialog
        open={deleteHotspotModal.open}
        onOpenChange={(open) =>
          setDeleteHotspotModal({ ...deleteHotspotModal, open })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Hotspot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteHotspotModal.hotspotName}"? 
              This will also remove all associated activities.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteHotspotModal({
                  open: false,
                  planId: null,
                  routeId: null,
                  hotspotId: null,
                  hotspotName: "",
                })
              }
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteHotspot}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Activity Modal */}
      <Dialog
        open={addActivityModal.open}
        onOpenChange={(open) =>
          setAddActivityModal({ ...addActivityModal, open })
        }
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Activity to {addActivityModal.hotspotName}</DialogTitle>
            <DialogDescription>
              Select an activity to add to this hotspot
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {loadingActivities && (
              <p className="text-sm text-[#6c6c6c] text-center py-8">
                Loading activities...
              </p>
            )}

            {!loadingActivities && availableActivities.length === 0 && (
              <p className="text-sm text-[#6c6c6c] text-center py-8">
                No activities available for this hotspot
              </p>
            )}

            {!loadingActivities && availableActivities.length > 0 && (
              <div className="grid gap-3">
                {availableActivities.map((activity) => (
                  <Card key={activity.id} className="border border-[#e5d9f2]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#4a4260] mb-1">
                            {activity.title}
                          </h4>
                          <p className="text-sm text-[#6c6c6c] mb-2">
                            {activity.description}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-[#6c6c6c]">
                            {activity.costAdult > 0 && (
                              <span>Adult: ₹{activity.costAdult.toFixed(2)}</span>
                            )}
                            {activity.costChild > 0 && (
                              <span>Child: ₹{activity.costChild.toFixed(2)}</span>
                            )}
                            {activity.duration && (
                              <span>Duration: {activity.duration}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#d546ab] hover:bg-[#c03d9f]"
                          onClick={() => handleAddActivity(activity.id, activity.costAdult)}
                          disabled={isAddingActivity}
                        >
                          {isAddingActivity ? "Adding..." : "Add"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setAddActivityModal({
                  open: false,
                  planId: null,
                  routeId: null,
                  routeHotspotId: null,
                  hotspotId: null,
                  hotspotName: "",
                })
              }
              disabled={isAddingActivity}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Activity Modal */}
      <Dialog
        open={deleteActivityModal.open}
        onOpenChange={(open) =>
          setDeleteActivityModal({ ...deleteActivityModal, open })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteActivityModal.activityName}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteActivityModal({
                  open: false,
                  planId: null,
                  routeId: null,
                  activityId: null,
                  activityName: "",
                })
              }
              disabled={isDeletingActivity}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteActivity}
              disabled={isDeletingActivity}
            >
              {isDeletingActivity ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Hotspot Modal */}
      <Dialog
        open={addHotspotModal.open}
        onOpenChange={(open) =>
          setAddHotspotModal({ ...addHotspotModal, open })
        }
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle>Hotspot List</DialogTitle>
                <DialogDescription>
                  Select a hotspot to add to your itinerary
                </DialogDescription>
              </div>
              <input
                type="text"
                placeholder="Search Hotspot..."
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                value={hotspotSearchQuery}
                onChange={(e) => setHotspotSearchQuery(e.target.value)}
              />
            </div>
          </DialogHeader>
          <div className="py-4 flex-1 overflow-hidden">
            {loadingHotspots ? (
              <p className="text-sm text-[#6c6c6c] text-center py-8">
                Loading available hotspots...
              </p>
            ) : filteredHotspots.length === 0 ? (
              <p className="text-sm text-[#6c6c6c] text-center py-8">
                {hotspotSearchQuery ? "No hotspots match your search" : "No hotspots available for this location"}
              </p>
            ) : (
              <div className="overflow-y-auto h-[500px] pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredHotspots.map((hotspot) => (
                    <div
                      key={hotspot.id}
                      className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <div className="text-center">
                          <Building2 className="h-12 w-12 text-[#d546ab] mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No Photos Available</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-base text-[#4a4260] mb-2">
                          {hotspot.name}
                        </h4>
                        <p className="text-sm text-[#6c6c6c] mb-3 line-clamp-2">
                          {hotspot.description}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-[#6c6c6c] mb-3">
                          {hotspot.amount > 0 && (
                            <span>
                              <Ticket className="inline h-3 w-3 mr-1" />
                              ₹ {hotspot.amount.toFixed(2)}
                            </span>
                          )}
                          {hotspot.timeSpend > 0 && (
                            <span>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {hotspot.timeSpend} hrs
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-[#d546ab] hover:bg-[#b93a8f] text-white"
                          onClick={() => handleAddHotspot(hotspot.id)}
                          disabled={isAddingHotspot}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setAddHotspotModal({
                  open: false,
                  planId: null,
                  routeId: null,
                  locationId: null,
                  locationName: "",
                })
              }
              disabled={isAddingHotspot}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hotel Selection Modal */}
      <Dialog
        open={hotelSelectionModal.open}
        onOpenChange={(open) =>
          setHotelSelectionModal({ ...hotelSelectionModal, open })
        }
      >
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle>Available Hotels</DialogTitle>
                <DialogDescription>
                  Select a hotel for {hotelSelectionModal.routeDate}
                </DialogDescription>
              </div>
              <input
                type="text"
                placeholder="Search Hotel..."
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                value={hotelSearchQuery}
                onChange={(e) => setHotelSearchQuery(e.target.value)}
              />
            </div>
          </DialogHeader>
          <div className="py-4 flex-1 overflow-hidden">
            {loadingHotels ? (
              <p className="text-sm text-[#6c6c6c] text-center py-8">
                Loading available hotels...
              </p>
            ) : filteredHotels.length === 0 ? (
              <p className="text-sm text-[#6c6c6c] text-center py-8">
                {hotelSearchQuery ? "No hotels match your search" : "No hotels available within 20km"}
              </p>
            ) : (
              <div className="overflow-y-auto h-[500px] pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center relative">
                        <div className="text-center">
                          <Building2 className="h-12 w-12 text-[#4ba3c3] mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No Photos Available</p>
                        </div>
                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold text-[#4ba3c3]">
                          {hotel.distance} km
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-base text-[#4a4260] mb-1">
                          {hotel.name}
                        </h4>
                        <p className="text-xs text-[#6c6c6c] mb-2 line-clamp-2">
                          {hotel.address}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-[#6c6c6c] mb-3">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            Check-in: {hotel.checkIn}
                          </span>
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            Check-out: {hotel.checkOut}
                          </span>
                        </div>
                        
                        {/* Meal Plan Options */}
                        <div className="mb-3">
                          <p className="text-xs font-medium text-[#4a4260] mb-2">Meal Plan:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedMealPlan.all}
                                onChange={(e) => setSelectedMealPlan({
                                  all: e.target.checked,
                                  breakfast: e.target.checked,
                                  lunch: e.target.checked,
                                  dinner: e.target.checked,
                                })}
                              />
                              <span>All</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedMealPlan.breakfast}
                                onChange={(e) => setSelectedMealPlan({
                                  ...selectedMealPlan,
                                  breakfast: e.target.checked,
                                  all: false,
                                })}
                              />
                              <span>Breakfast</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedMealPlan.lunch}
                                onChange={(e) => setSelectedMealPlan({
                                  ...selectedMealPlan,
                                  lunch: e.target.checked,
                                  all: false,
                                })}
                              />
                              <span>Lunch</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedMealPlan.dinner}
                                onChange={(e) => setSelectedMealPlan({
                                  ...selectedMealPlan,
                                  dinner: e.target.checked,
                                  all: false,
                                })}
                              />
                              <span>Dinner</span>
                            </label>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-[#4ba3c3] hover:bg-[#3a8fa3] text-white"
                          onClick={() => handleSelectHotel(hotel.id)}
                          disabled={isSelectingHotel}
                        >
                          {isSelectingHotel ? "Selecting..." : "Choose Hotel"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHotelSelectionModal({
                  open: false,
                  planId: null,
                  routeId: null,
                  routeDate: "",
                });
                setHotelSearchQuery("");
                setSelectedMealPlan({ all: false, breakfast: false, lunch: false, dinner: false });
              }}
              disabled={isSelectingHotel}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <Dialog
        open={galleryModal.open}
        onOpenChange={(open) => setGalleryModal({ ...galleryModal, open })}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{galleryModal.title} - Gallery</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {galleryModal.images.length === 0 ? (
              <p className="text-sm text-[#6c6c6c] text-center py-8">
                No images available
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {galleryModal.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${galleryModal.title} ${idx + 1}`}
                    className="w-full h-auto rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setGalleryModal({ open: false, images: [], title: "" })
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog
        open={videoModal.open}
        onOpenChange={(open) => setVideoModal({ ...videoModal, open })}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{videoModal.title} - Video</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {videoModal.videoUrl ? (
              <div className="aspect-video">
                <iframe
                  src={videoModal.videoUrl}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={videoModal.title}
                />
              </div>
            ) : (
              <p className="text-sm text-[#6c6c6c] text-center py-8">
                No video available
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setVideoModal({ open: false, videoUrl: "", title: "" })
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clipboard Modal */}
      <Dialog open={clipboardModal} onOpenChange={setClipboardModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {clipboardType === 'recommended' && 'Copy Recommended Hotels'}
              {clipboardType === 'highlights' && 'Copy to Highlights'}
              {clipboardType === 'para' && 'Copy to Paragraph Format'}
            </DialogTitle>
            <DialogDescription>
              {clipboardType === 'recommended' && 'Select recommended hotels to include in clipboard'}
              {clipboardType === 'highlights' && 'Hotel information will be copied in highlight/bullet format'}
              {clipboardType === 'para' && 'Hotel information will be copied in paragraph format'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {!hotelDetails || !hotelDetails.tabs ? (
              <p className="text-sm text-[#6c6c6c] text-center py-8">
                No hotel information available
              </p>
            ) : (
              hotelDetails.tabs.map((tab) => (
                <div key={tab.groupType} className="border border-[#e5d9f2] rounded-lg p-3">
                  <h4 className="font-semibold text-[#4a4260] mb-2">{tab.label}</h4>
                  {hotelDetails.hotels
                    .filter((h) => h.groupType === tab.groupType)
                    .map((hotel, idx) => {
                      const hotelKey = `${tab.groupType}-${idx}`;
                      return (
                        <div key={idx} className="flex items-center gap-3 py-2">
                          <input
                            type="checkbox"
                            id={`hotel-${hotelKey}`}
                            className="h-4 w-4 cursor-pointer"
                            checked={selectedHotels[hotelKey] || false}
                            onChange={(e) => {
                              setSelectedHotels({
                                ...selectedHotels,
                                [hotelKey]: e.target.checked
                              });
                            }}
                          />
                          <label
                            htmlFor={`hotel-${hotelKey}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {hotel.hotelName} - {hotel.destination}
                          </label>
                        </div>
                      );
                    })}
                </div>
              ))
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setClipboardModal(false);
              setSelectedHotels({});
            }}>
              Cancel
            </Button>
            <Button
              className="bg-[#8b43d1] hover:bg-[#7c37c1]"
              onClick={() => {
                // Build clipboard text based on selected hotels and type
                let clipboardText = '';
                const selectedCount = Object.values(selectedHotels).filter(Boolean).length;
                
                if (selectedCount === 0) {
                  toast.error('Please select at least one hotel');
                  return;
                }

                if (!hotelDetails) return;

                hotelDetails.tabs.forEach((tab) => {
                  const tabHotels = hotelDetails.hotels.filter((h) => h.groupType === tab.groupType);
                  tabHotels.forEach((hotel, idx) => {
                    const hotelKey = `${tab.groupType}-${idx}`;
                    if (selectedHotels[hotelKey]) {
                      if (clipboardType === 'highlights') {
                        clipboardText += `• ${hotel.day} - ${hotel.hotelName}, ${hotel.destination}\n`;
                      } else if (clipboardType === 'para') {
                        clipboardText += `On ${hotel.day}, accommodation at ${hotel.hotelName} in ${hotel.destination}. `;
                      } else {
                        clipboardText += `${tab.label}: ${hotel.hotelName} - ${hotel.destination}\n`;
                      }
                    }
                  });
                });

                navigator.clipboard.writeText(clipboardText);
                toast.success('Copied to clipboard!');
                setClipboardModal(false);
                setSelectedHotels({});
              }}
            >
              Copy Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share via Email Modal */}
      <Dialog open={shareModal} onOpenChange={setShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share via Email</DialogTitle>
            <DialogDescription>
              Send itinerary details via email
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-[#4a4260] mb-2 block">
                Recipient Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                placeholder="email@example.com"
                id="share-email-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#4a4260] mb-2 block">
                Message (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                rows={4}
                placeholder="Add a personal message..."
                id="share-email-message"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShareModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#17a2b8] hover:bg-[#138496]"
              onClick={() => {
                const emailInput = document.getElementById('share-email-input') as HTMLInputElement;
                const messageInput = document.getElementById('share-email-message') as HTMLTextAreaElement;
                
                if (!emailInput?.value) {
                  toast.error('Please enter recipient email');
                  return;
                }

                const subject = encodeURIComponent(`Itinerary Details - ${quoteId}`);
                const body = encodeURIComponent(
                  `${messageInput?.value || 'Please find the itinerary details below:'}\n\n` +
                  `Itinerary Link: ${window.location.href}`
                );
                
                window.open(`mailto:${emailInput.value}?subject=${subject}&body=${body}`, '_blank');
                toast.success('Email client opened!');
                setShareModal(false);
              }}
            >
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Quotation Modal */}
      <Dialog open={confirmQuotationModal} onOpenChange={setConfirmQuotationModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Guest Details</DialogTitle>
            <DialogDescription>
              Enter primary guest information and travel details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quotation Details */}
            {agentInfo && (
              <div className="bg-[#f8f9fa] p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6c6c6c]">Quotation No:</span>
                  <span className="font-medium text-[#4a4260]">{agentInfo.quotation_no}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6c6c6c]">Agent Name:</span>
                  <span className="font-medium text-[#4a4260]">{agentInfo.agent_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6c6c6c]">Wallet Balance:</span>
                  <span className={`font-medium ${walletBalance.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                    {walletBalance}
                  </span>
                </div>
              </div>
            )}

            {/* Primary Guest Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-[#4a4260]">Primary Guest Details - Adult 1</h3>
              
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                    Salutation
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                    value={guestDetails.salutation}
                    onChange={(e) => setGuestDetails({...guestDetails, salutation: e.target.value})}
                  >
                    <option value="Mr">Mr</option>
                    <option value="Ms">Ms</option>
                    <option value="Mrs">Mrs</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                    placeholder="Enter the Name"
                    value={guestDetails.name}
                    onChange={(e) => setGuestDetails({...guestDetails, name: e.target.value})}
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                    Age
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                    placeholder="Enter the Age"
                    value={guestDetails.age}
                    onChange={(e) => setGuestDetails({...guestDetails, age: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                    Primary Contact No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                    placeholder="Enter the Contact No"
                    value={guestDetails.contactNo}
                    onChange={(e) => setGuestDetails({...guestDetails, contactNo: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                    Alternative Contact No.
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                    placeholder="Enter the Alternative Contact No"
                    value={guestDetails.alternativeContactNo}
                    onChange={(e) => setGuestDetails({...guestDetails, alternativeContactNo: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                  Email ID
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                  placeholder="Enter the Email ID"
                  value={guestDetails.emailId}
                  onChange={(e) => setGuestDetails({...guestDetails, emailId: e.target.value})}
                />
              </div>

              {/* Additional Adults */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#4a4260]">Additional Adults</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdditionalAdults([...additionalAdults, { name: '', age: '' }])}
                    className="h-8 px-2 text-xs border-[#e5d9f2] text-[#8b43d1] hover:bg-[#f8f4ff]"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Adult
                  </Button>
                </div>
                {additionalAdults.map((adult, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7">
                      <label className="text-[10px] font-medium text-[#4a4260] mb-1 block">
                        Adult {index + 2} Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 text-sm border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                        placeholder="Name"
                        value={adult.name}
                        onChange={(e) => {
                          const newAdults = [...additionalAdults];
                          newAdults[index].name = e.target.value;
                          setAdditionalAdults(newAdults);
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-medium text-[#4a4260] mb-1 block">
                        Age
                      </label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 text-sm border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                        placeholder="Age"
                        value={adult.age}
                        onChange={(e) => {
                          const newAdults = [...additionalAdults];
                          newAdults[index].age = e.target.value;
                          setAdditionalAdults(newAdults);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAdditionalAdults(additionalAdults.filter((_, i) => i !== index))}
                        className="h-9 w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Children */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#4a4260]">Children (5-12 years)</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdditionalChildren([...additionalChildren, { name: '', age: '' }])}
                    className="h-8 px-2 text-xs border-[#e5d9f2] text-[#8b43d1] hover:bg-[#f8f4ff]"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Child
                  </Button>
                </div>
                {additionalChildren.map((child, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7">
                      <label className="text-[10px] font-medium text-[#4a4260] mb-1 block">
                        Child {index + 1} Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 text-sm border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                        placeholder="Name"
                        value={child.name}
                        onChange={(e) => {
                          const newChildren = [...additionalChildren];
                          newChildren[index].name = e.target.value;
                          setAdditionalChildren(newChildren);
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-medium text-[#4a4260] mb-1 block">
                        Age
                      </label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 text-sm border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                        placeholder="Age"
                        value={child.age}
                        onChange={(e) => {
                          const newChildren = [...additionalChildren];
                          newChildren[index].age = e.target.value;
                          setAdditionalChildren(newChildren);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAdditionalChildren(additionalChildren.filter((_, i) => i !== index))}
                        className="h-9 w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Infants */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#4a4260]">Infants (Below 5 years)</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdditionalInfants([...additionalInfants, { name: '', age: '' }])}
                    className="h-8 px-2 text-xs border-[#e5d9f2] text-[#8b43d1] hover:bg-[#f8f4ff]"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Infant
                  </Button>
                </div>
                {additionalInfants.map((infant, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7">
                      <label className="text-[10px] font-medium text-[#4a4260] mb-1 block">
                        Infant {index + 1} Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 text-sm border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                        placeholder="Name"
                        value={infant.name}
                        onChange={(e) => {
                          const newInfants = [...additionalInfants];
                          newInfants[index].name = e.target.value;
                          setAdditionalInfants(newInfants);
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-medium text-[#4a4260] mb-1 block">
                        Age
                      </label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 text-sm border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                        placeholder="Age"
                        value={infant.age}
                        onChange={(e) => {
                          const newInfants = [...additionalInfants];
                          newInfants[index].age = e.target.value;
                          setAdditionalInfants(newInfants);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAdditionalInfants(additionalInfants.filter((_, i) => i !== index))}
                        className="h-9 w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrival Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-[#4a4260]">Arrival Details</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                    Date & Time
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                    placeholder="12-12-2025 9:00 AM"
                    value={guestDetails.arrivalDateTime}
                    onChange={(e) => setGuestDetails({...guestDetails, arrivalDateTime: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                    Arrival Place
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                    placeholder="Chennai International Airport"
                    value={guestDetails.arrivalPlace}
                    onChange={(e) => setGuestDetails({...guestDetails, arrivalPlace: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                  Flight Details
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                  rows={2}
                  placeholder="Enter the Flight Details"
                  value={guestDetails.arrivalFlightDetails}
                  onChange={(e) => setGuestDetails({...guestDetails, arrivalFlightDetails: e.target.value})}
                />
              </div>
            </div>

            {/* Departure Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-[#4a4260]">Departure Details</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                    Date & Time
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                    placeholder="19-12-2025 4:00 PM"
                    value={guestDetails.departureDateTime}
                    onChange={(e) => setGuestDetails({...guestDetails, departureDateTime: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                    Departure Place
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                    placeholder="Trivandrum, Domestic Airport"
                    value={guestDetails.departurePlace}
                    onChange={(e) => setGuestDetails({...guestDetails, departurePlace: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#4a4260] mb-1 block">
                  Flight Details
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                  rows={2}
                  placeholder="Enter the Flight Details"
                  value={guestDetails.departureFlightDetails}
                  onChange={(e) => setGuestDetails({...guestDetails, departureFlightDetails: e.target.value})}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmQuotationModal(false);
                setGuestDetails({
                  salutation: 'Mr',
                  name: '',
                  contactNo: '',
                  age: '',
                  alternativeContactNo: '',
                  emailId: '',
                  arrivalDateTime: '',
                  arrivalPlace: '',
                  arrivalFlightDetails: '',
                  departureDateTime: '',
                  departurePlace: '',
                  departureFlightDetails: '',
                });
                setAdditionalAdults([]);
                setAdditionalChildren([]);
                setAdditionalInfants([]);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#8b43d1] hover:bg-[#7c37c1]"
              onClick={handleConfirmQuotation}
              disabled={isConfirmingQuotation}
            >
              {isConfirmingQuotation ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {itinerary?.planId && (
        <>
          <VoucherDetailsModal 
            isOpen={voucherModal} 
            onClose={() => setVoucherModal(false)} 
            itineraryPlanId={itinerary.planId} 
          />
          <PluckCardModal 
            isOpen={pluckCardModal} 
            onClose={() => setPluckCardModal(false)} 
            itineraryPlanId={itinerary.planId} 
          />
          <InvoiceModal 
            isOpen={invoiceModal} 
            onClose={() => setInvoiceModal(false)} 
            itineraryPlanId={itinerary.planId} 
            type={invoiceType}
          />
          <IncidentalExpensesModal
            isOpen={incidentalModal}
            onClose={() => setIncidentalModal(false)}
            itineraryPlanId={itinerary.planId}
          />
        </>
      )}
    </div>
  );
};

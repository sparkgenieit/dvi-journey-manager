// REPLACE-WHOLE-FILE: src/services/itinerary.ts
import { api } from "@/lib/api";

export type ItinerarySaveType =
  | "itineary_basic_info"
  | "itineary_basic_info_with_optimized_route"
  | undefined;

type LatestItineraryParams = {
  page: number;            // 1-based
  pageSize: number;        // length
  search?: string;
  startDate?: string;      // "DD/MM/YYYY" (from filter)
  endDate?: string;        // "DD/MM/YYYY"
  sourceLocation?: string; // arrival_location
  destinationLocation?: string; // departure_location
  agentId?: number | null;
  staffId?: number | null;
};

export const ItineraryService = {
  async create(data: any, type?: ItinerarySaveType) {
    const url = type
      ? `itineraries/?type=${encodeURIComponent(type)}`
      : "itineraries";

    return api(url, {
      method: "POST",
      body: data,
    });
  },

  async update(id: number, data: any, type?: ItinerarySaveType) {
    const url = type
      ? `itineraries/${id}?type=${encodeURIComponent(type)}`
      : `itineraries/${id}`;

    return api(url, {
      method: "PUT",
      body: data,
    });
  },

  async getOne(id: number) {
    return api(`itineraries/edit/${id}`, {
      method: "GET",
    });
  },

  // ---------------------------------------------------------------------------
  // Latest itineraries listing (SP-free Prisma API)
  // Maps React pagination -> DataTables-style query params
  // ---------------------------------------------------------------------------
  async getLatest(params: LatestItineraryParams) {
    const { page, pageSize } = params;
    const start = (page - 1) * pageSize;
    const length = pageSize;

    const qs = new URLSearchParams();

    // DataTables-style params
    qs.set("draw", "1");
    qs.set("start", String(start));
    qs.set("length", String(length));

    if (params.search && params.search.trim()) {
      qs.set("search[value]", params.search.trim());
    }

    if (params.startDate) qs.set("start_date", params.startDate);
    if (params.endDate) qs.set("end_date", params.endDate);

    if (params.sourceLocation) {
      qs.set("source_location", params.sourceLocation);
    }
    if (params.destinationLocation) {
      qs.set("destination_location", params.destinationLocation);
    }

    if (params.agentId != null && params.agentId > 0) {
      qs.set("agent_id", String(params.agentId));
    }
    if (params.staffId != null && params.staffId > 0) {
      qs.set("staff_id", String(params.staffId));
    }

    const url = `itineraries/latest?${qs.toString()}`;

    return api(url, {
      method: "GET",
    });
  },

  async getDetails(quoteId: string, groupType?: number) {
    const url = groupType !== undefined 
      ? `itineraries/details/${encodeURIComponent(quoteId)}?groupType=${groupType}`
      : `itineraries/details/${encodeURIComponent(quoteId)}`;
    return api(url, {
      method: "GET",
    });
  },

  async getHotelDetails(quoteId: string) {
    return api(`itineraries/hotel_details/${encodeURIComponent(quoteId)}`, {
      method: "GET",
    });
  },
// inside ItineraryService
  async getHotelRoomDetails(quoteId: string) {
    const res = await api(`/itineraries/hotel_room_details/${quoteId}`);
    return res; // api() already returns the JSON response directly
  },

  async deleteHotspot(planId: number, routeId: number, hotspotId: number) {
    return api(`itineraries/hotspot/${planId}/${routeId}/${hotspotId}`, {
      method: "DELETE",
    });
  },

  async getAvailableActivities(hotspotId: number) {
    return api(`itineraries/activities/available/${hotspotId}`, {
      method: "GET",
    });
  },

  async addActivity(data: {
    planId: number;
    routeId: number;
    routeHotspotId: number;
    hotspotId: number;
    activityId: number;
    amount?: number;
    startTime?: string;
    endTime?: string;
    duration?: string;
  }) {
    return api(`itineraries/activities/add`, {
      method: "POST",
      body: data,
    });
  },

  async deleteActivity(planId: number, routeId: number, activityId: number) {
    return api(`itineraries/activities/${planId}/${routeId}/${activityId}`, {
      method: "DELETE",
    });
  },

  async getAvailableHotspots(locationId: number) {
    return api(`itineraries/hotspots/available/${locationId}`, {
      method: "GET",
    });
  },

  async addHotspot(planId: number, routeId: number, hotspotId: number) {
    return api("itineraries/hotspots/add", {
      method: "POST",
      body: { planId, routeId, hotspotId },
    });
  },

  async getAvailableHotels(routeId: number) {
    return api(`itineraries/hotels/available/${routeId}`, {
      method: "GET",
    });
  },

  async selectHotel(
    planId: number,
    routeId: number,
    hotelId: number,
    roomTypeId: number,
    mealPlan?: { all?: boolean; breakfast?: boolean; lunch?: boolean; dinner?: boolean }
  ) {
    return api("itineraries/hotels/select", {
      method: "POST",
      body: { planId, routeId, hotelId, roomTypeId, mealPlan },
    });
  },

  async selectVehicleVendor(
    planId: number,
    vehicleTypeId: number,
    vendorEligibleId: number
  ) {
    return api("itineraries/vehicles/select-vendor", {
      method: "POST",
      body: { planId, vehicleTypeId, vendorEligibleId },
    });
  },

  async getCustomerInfoForm(planId: number) {
    return api(`itineraries/customer-info/${planId}`, {
      method: "GET",
    });
  },

  async checkWalletBalance(agentId: number) {
    return api(`itineraries/wallet-balance/${agentId}`, {
      method: "GET",
    });
  },

  async confirmQuotation(data: {
    itinerary_plan_ID: number;
    agent: number;
    primary_guest_salutation: string;
    primary_guest_name: string;
    primary_guest_contact_no: string;
    primary_guest_age: string;
    primary_guest_alternative_contact_no?: string;
    primary_guest_email_id?: string;
    adult_name?: string[];
    adult_age?: string[];
    arrival_date_time: string;
    arrival_place: string;
    arrival_flight_details?: string;
    departure_date_time: string;
    departure_place: string;
    departure_flight_details?: string;
    price_confirmation_type: string;
    hotel_group_type?: string;
  }) {
    return api("itineraries/confirm-quotation", {
      method: "POST",
      body: data,
    });
  },

  async getConfirmedItineraries(params: {
    draw?: number;
    start?: number;
    length?: number;
    start_date?: string;
    end_date?: string;
    source_location?: string;
    destination_location?: string;
    agent_id?: number;
    staff_id?: number;
  }) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    return api(`itineraries/confirmed?${queryParams.toString()}`, {
      method: "GET",
    });
  },

};

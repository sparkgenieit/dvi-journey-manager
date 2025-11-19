// FILE: src/services/dailyMomentTracker.ts

// Trip type coming from backend
export type TripType = "Arrival" | "Departure" | "Ongoing";

// Raw backend DTO (DailyMomentRowDto from NestJS)
export type DailyMomentApiRow = {
  count: number;
  guest_name: string;
  quote_id: string | null;
  itinerary_plan_ID: number;
  itinerary_route_ID: number;
  route_date: string; // "dd-mm-yyyy"
  trip_type: TripType;
  location_name: string | null;
  next_visiting_location: string | null;
  arrival_flight_details: string | null;
  departure_flight_details: string | null;
  hotel_name: string | null;
  vehicle_type_title: string | null;
  vendor_name: string | null;
  meal_plan: string | null;
  vehicle_no: string | null;
  driver_name: string | null;
  driver_mobile: string | null;
  special_remarks: string | null;
  travel_expert_name: string | null;
  agent_name: string | null;
};

// Charges DTO (extra charges form via car icon)
export type DailyMomentCharge = {
  driver_charge_ID: number;
  itinerary_plan_ID: number;
  itinerary_route_ID: number;
  charge_type: string;
  charge_amount: number;
};

// Vite-style base URL (same pattern as accountsLedgerApi)
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "http://localhost:4000";

// 🔐 Helper: attach JWT from localStorage (same idea as other secured APIs)
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token =
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("access_token") ||
    window.localStorage.getItem("jwt");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch list of Daily Moments between fromDate and toDate.
 * fromDate / toDate are expected in DD-MM-YYYY format (same as PHP UI).
 */
export async function fetchDailyMoments(params: {
  fromDate: string; // DD-MM-YYYY
  toDate: string;   // DD-MM-YYYY
  itineraryPlanId?: number;
  agentId?: number;
}): Promise<DailyMomentApiRow[]> {
  const search = new URLSearchParams();

  if (params.fromDate.trim()) {
    search.set("fromDate", params.fromDate.trim());
  }
  if (params.toDate.trim()) {
    search.set("toDate", params.toDate.trim());
  }
  if (params.itineraryPlanId) {
    search.set("itineraryPlanId", String(params.itineraryPlanId));
  }
  if (params.agentId) {
    search.set("agentId", String(params.agentId));
  }

  // include global prefix /api/v1 from main.ts
  const url = `${API_BASE_URL}/api/v1/daily-moment-tracker?${search.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    console.error(
      "Failed to fetch daily moments",
      res.status,
      await safeReadText(res)
    );
    throw new Error("Failed to fetch daily moments");
  }

  const data = (await res.json()) as DailyMomentApiRow[];
  return data;
}

/**
 * Fetch extra charges for a given itinerary plan + route
 * (used by car icon popup).
 */
export async function fetchDailyMomentCharges(
  itineraryPlanId: number,
  itineraryRouteId: number
): Promise<DailyMomentCharge[]> {
  const search = new URLSearchParams();
  search.set("itineraryPlanId", String(itineraryPlanId));
  search.set("itineraryRouteId", String(itineraryRouteId));

  const url = `${API_BASE_URL}/api/v1/daily-moment-tracker/charges?${search.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    console.error(
      "Failed to fetch daily moment charges",
      res.status,
      await safeReadText(res)
    );
    throw new Error("Failed to fetch daily moment charges");
  }

  const data = (await res.json()) as DailyMomentCharge[];
  return data;
}

/**
 * Create / update an extra charge row for Daily Moment.
 * Matches UpsertDailyMomentChargeDto on the backend.
 */
export async function upsertDailyMomentCharge(payload: {
  driverChargeId?: number;
  itineraryPlanId: number;
  itineraryRouteId: number;
  chargeType: string;
  chargeAmount: number;
}): Promise<DailyMomentCharge> {
  const body = {
    driverChargeId: payload.driverChargeId ?? null,
    itineraryPlanId: payload.itineraryPlanId,
    itineraryRouteId: payload.itineraryRouteId,
    chargeType: payload.chargeType,
    chargeAmount: payload.chargeAmount,
  };

  const url = `${API_BASE_URL}/api/v1/daily-moment-tracker/charges`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(
      "Failed to save daily moment charge",
      res.status,
      await safeReadText(res)
    );
    throw new Error("Failed to save daily moment charge");
  }

  const data = (await res.json()) as DailyMomentCharge;
  return data;
}

// Small helper to safely read text for logging
async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

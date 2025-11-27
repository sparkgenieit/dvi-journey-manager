// REPLACE-WHOLE-FILE: src/services/vehicle-availability.ts

import { api } from "@/lib/api";

export type SimpleOption = { id: number; label: string };

export type VehicleAvailabilityRouteSegment = {
  locationName: string;
  nextVisitingLocation: string;
};

export type VehicleAvailabilityCell = {
  date: string; // YYYY-MM-DD
  itineraryPlanId: number | null;
  itineraryQuoteId: string | null;

  isWithinTrip: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInBetween: boolean;
  isToday: boolean;

  isVehicleAssigned: boolean;
  assignedVehicleId: number | null;

  hasDriver: boolean;
  driverId: number | null;

  routeSegments: VehicleAvailabilityRouteSegment[];
};

export type VehicleAvailabilityRow = {
  vendorId: number;
  vendorName: string;

  vehicleTypeId: number;
  vehicleTypeTitle: string;

  vehicleId: number;
  registrationNumber: string;

  cells: VehicleAvailabilityCell[];
};

export type VehicleAvailabilityResponse = {
  dates: string[];
  rows: VehicleAvailabilityRow[];
};

export type VehicleAvailabilityQuery = {
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  vendorId?: number;
  vehicleTypeId?: number;

  // UI filters (backend must support if you want server-side filtering)
  agentId?: number;
  locationId?: number;
};

function buildQueryString(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchVehicleAvailability(
  query: VehicleAvailabilityQuery,
): Promise<VehicleAvailabilityResponse> {
  return api(`/vehicle-availability${buildQueryString(query)}`, { auth: true });
}

export async function fetchVendors(): Promise<SimpleOption[]> {
  return api(`/vehicle-availability/vendors`, { auth: true });
}

export async function fetchVehicleTypes(): Promise<SimpleOption[]> {
  return api(`/vehicle-availability/vehicle-types`, { auth: true });
}

export async function fetchAgents(): Promise<SimpleOption[]> {
  return api(`/vehicle-availability/agents`, { auth: true });
}

export async function fetchLocations(): Promise<SimpleOption[]> {
  return api(`/vehicle-availability/locations`, { auth: true });
}

/**
 * Vendor Branch dropdown (used in Add Vehicle modal)
 * Backend endpoint must exist:
 *   GET /vehicle-availability/vendor-branches?vendorId=123
 */
export async function fetchVendorBranches(
  vendorId: number,
): Promise<SimpleOption[]> {
  return api(
    `/vehicle-availability/vendor-branches${buildQueryString({ vendorId })}`,
    { auth: true },
  );
}

// ------------------------------
// CREATE (Add New Vehicle/Driver)
// ------------------------------

export type CreateVehiclePayload = {
  vendorId: number;
  vehicleTypeId: number;
  registrationNumber: string;

  // extra fields for PHP-like modal (only works if backend supports them)
  vendor_branch_id?: number;
  vehicle_origin?: string;
  vehicle_expiry_date?: string; // YYYY-MM-DD
  insurance_start_date?: string; // YYYY-MM-DD
  insurance_end_date?: string; // YYYY-MM-DD
};

export async function createVehicle(payload: CreateVehiclePayload) {
  return api(`/vehicle-availability/vehicles`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export type CreateDriverPayload = {
  vendorId: number;
  vehicleTypeId: number;
  driverName: string;
  mobile: string;
};

export async function createDriver(payload: CreateDriverPayload) {
  return api(`/vehicle-availability/drivers`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

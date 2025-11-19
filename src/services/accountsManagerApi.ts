import { API_BASE_URL } from "@/lib/api";


const BASE_URL = `${API_BASE_URL}/accounts-manager`;

export type AccountsStatus = "all" | "paid" | "due";
export type AccountsComponentType =
  | "all"
  | "hotel"
  | "vehicle"
  | "guide"
  | "hotspot"
  | "activity";

export interface AccountsFilters {
  quoteId?: string;
  agent?: string;               // your current backend expects agent name substring
  status?: AccountsStatus;
  componentType?: AccountsComponentType;
  fromDate?: string;            // "DD/MM/YYYY"
  toDate?: string;              // "DD/MM/YYYY"
  search?: string;
}

export interface AccountsRow {
  id: number;
  headerId: number;
  quoteId: string;
  hotelName: string;
  amount: number;
  payout: number;
  payable: number;
  status: "paid" | "due";
  componentType: AccountsComponentType;
  agent: string;
  startDate: string; // "DD/MM/YYYY"
  endDate: string;   // "DD/MM/YYYY"
  routeDate?: string;
  vehicleId?: number;
  vendorId?: number;
}

export interface AccountsSummary {
  totalPayable: number;
  totalPaid: number;
  totalBalance: number;
  rowCount: number;
}

export interface QuoteOption {
  quoteId: string;
}

export interface AgentOption {
  id: number;
  name: string;
}

export interface PaymentModeOption {
  id: number;
  label: string;
}

export interface PayPayload {
  componentType: Exclude<AccountsComponentType, "all">;
  accountsItineraryDetailsId: number;
  componentDetailId: number;
  routeDate?: string;
  amount: number;
  modeOfPaymentId?: number;
  utrNumber?: string;
  processedBy?: string;
}

// Helpers
function buildQuery(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

// 1) Main list
export async function fetchAccountsList(
  filters: AccountsFilters,
): Promise<AccountsRow[]> {
  const qs = buildQuery(filters);
  const res = await fetch(`${BASE_URL}${qs}`);
  if (!res.ok) {
    throw new Error(`List failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// 2) Summary
export async function fetchAccountsSummary(
  filters: AccountsFilters,
): Promise<AccountsSummary> {
  const qs = buildQuery(filters);
  const res = await fetch(`${BASE_URL}/summary${qs}`);
  if (!res.ok) {
    throw new Error(`Summary failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// 3) Quote autocomplete
export async function searchQuotes(
  phrase: string,
): Promise<QuoteOption[]> {
  const qs = phrase ? `?q=${encodeURIComponent(phrase)}` : "";
  const res = await fetch(`${BASE_URL}/quotes${qs}`);
  if (!res.ok) {
    throw new Error(`Quote search failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// 4) Agent dropdown
export async function fetchAgents(): Promise<AgentOption[]> {
  const res = await fetch(`${BASE_URL}/agents`);
  if (!res.ok) {
    throw new Error(`Agents failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// 5) Payment modes
export async function fetchPaymentModes(): Promise<PaymentModeOption[]> {
  const res = await fetch(`${BASE_URL}/payment-modes`);
  if (!res.ok) {
    throw new Error(
      `Payment modes failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

// 6) Pay Now
export async function postPayment(payload: PayPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Pay failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
}

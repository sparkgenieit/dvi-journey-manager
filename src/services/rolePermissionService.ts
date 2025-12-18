// FILE: src/services/rolePermissionService.ts

import { getToken } from "@/lib/api";

export type RolePermissionListItem = {
  id: string;
  roleName: string;
  status: boolean;
};

export type RolePermissionPageRow = {
  pageKey: string;
  pageName: string;
  read: boolean;
  write: boolean;
  modify: boolean;
  full: boolean;
};

export type RolePermissionPayload = {
  roleName: string;
  pages: Array<{
    pageKey: string;
    pageName: string;
    read: boolean;
    write: boolean;
    modify: boolean;
    full: boolean;
  }>;
};

export type RolePermissionDetails = {
  id: string;
  roleName: string;
  status: boolean;
  pages: RolePermissionPayload["pages"];
};

const BASE = "/role-permissions";

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Fallback pages (so UI works even if pages endpoint isn't ready yet).
 * Replace/extend anytime.
 */
const FALLBACK_PAGES: RolePermissionPageRow[] = [
  { pageKey: "dashboard", pageName: "Dashboard", read: false, write: false, modify: false, full: false },
  { pageKey: "vendor_dashboard", pageName: "Vendor Dashboard", read: false, write: false, modify: false, full: false },
  { pageKey: "hotels", pageName: "Hotels", read: false, write: false, modify: false, full: false },
  { pageKey: "hotel_pricebook", pageName: "Hotel Pricebook", read: false, write: false, modify: false, full: false },
  { pageKey: "vehicle_pricebook", pageName: "Vehicle Pricebook", read: false, write: false, modify: false, full: false },
  { pageKey: "guide_pricebook", pageName: "Guide Pricebook", read: false, write: false, modify: false, full: false },
  { pageKey: "activity_pricebook", pageName: "Activity Pricebook", read: false, write: false, modify: false, full: false },
  { pageKey: "vendor", pageName: "Vendor", read: false, write: false, modify: false, full: false },
  { pageKey: "driver", pageName: "Driver", read: false, write: false, modify: false, full: false },
  { pageKey: "vehicle", pageName: "Vehicle", read: false, write: false, modify: false, full: false },
  { pageKey: "activity", pageName: "Activity", read: false, write: false, modify: false, full: false },
  { pageKey: "new_hotspot", pageName: "New Hotspot", read: false, write: false, modify: false, full: false },
  { pageKey: "guide", pageName: "Guide", read: false, write: false, modify: false, full: false },
  { pageKey: "hotel_category", pageName: "Hotel Category", read: false, write: false, modify: false, full: false },
  { pageKey: "vehicle_type", pageName: "Vehicle Type", read: false, write: false, modify: false, full: false },
  { pageKey: "inbuild_amenities", pageName: "Inbuild Amenities", read: false, write: false, modify: false, full: false },
  { pageKey: "language", pageName: "Language", read: false, write: false, modify: false, full: false },
  { pageKey: "gst_setting", pageName: "GST Setting", read: false, write: false, modify: false, full: false },
  { pageKey: "role_permission", pageName: "Role Permission", read: false, write: false, modify: false, full: false },
  { pageKey: "staff", pageName: "Staff", read: false, write: false, modify: false, full: false },
  { pageKey: "kilometer_limit", pageName: "Kilometer Limit", read: false, write: false, modify: false, full: false },
  { pageKey: "time_limit", pageName: "Time Limit", read: false, write: false, modify: false, full: false },
  { pageKey: "global_settings", pageName: "Global Settings", read: false, write: false, modify: false, full: false },
  { pageKey: "toll_charge", pageName: "Toll Charge", read: false, write: false, modify: false, full: false },
  { pageKey: "parking_charge", pageName: "Parking Charge", read: false, write: false, modify: false, full: false },
  { pageKey: "locations", pageName: "Locations", read: false, write: false, modify: false, full: false },
  { pageKey: "latest_itinerary", pageName: "Latest Itinerary", read: false, write: false, modify: false, full: false },
  { pageKey: "agent_subscription_plan", pageName: "Agent Subscription Plan", read: false, write: false, modify: false, full: false },
  { pageKey: "pricebook_export", pageName: "Pricebook Export", read: false, write: false, modify: false, full: false },
  { pageKey: "agent_configuration", pageName: "Agent Configuration", read: false, write: false, modify: false, full: false },
  { pageKey: "confirmed_itinerary", pageName: "Confirmed Itinerary", read: false, write: false, modify: false, full: false },
  { pageKey: "agent", pageName: "Agent", read: false, write: false, modify: false, full: false },
  { pageKey: "subscription_history", pageName: "Subscription History", read: false, write: false, modify: false, full: false },
  { pageKey: "wallet", pageName: "Wallet", read: false, write: false, modify: false, full: false },
  { pageKey: "cities", pageName: "Cities", read: false, write: false, modify: false, full: false },
  { pageKey: "vehicle_availability_chart", pageName: "Vehicle Availability Chart", read: false, write: false, modify: false, full: false },
  { pageKey: "dailymoment", pageName: "Dailymoment", read: false, write: false, modify: false, full: false },
  { pageKey: "accounts_manager", pageName: "Accounts Manager", read: false, write: false, modify: false, full: false },
  { pageKey: "accounts_manager_history", pageName: "Accounts Manager History", read: false, write: false, modify: false, full: false },
  { pageKey: "accounts_manager_date_history", pageName: "Accounts Manager Date History", read: false, write: false, modify: false, full: false },
  { pageKey: "dailymoment_tracker", pageName: "Dailymoment Tracker", read: false, write: false, modify: false, full: false },
  { pageKey: "admins_dashboard", pageName: "Admins Dashboard", read: false, write: false, modify: false, full: false },
  { pageKey: "accounts_manager_ledger", pageName: "Accounts Manager Ledger", read: false, write: false, modify: false, full: false },
];

export const rolePermissionService = {
  async list(): Promise<RolePermissionListItem[]> {
    // expects: [{ id, roleName, status }]
    return http<RolePermissionListItem[]>(BASE, {
      method: "GET",
      headers: authHeaders(),
    });
  },

  async getOne(id: string): Promise<RolePermissionDetails> {
    return http<RolePermissionDetails>(`${BASE}/${id}`, {
      method: "GET",
      headers: authHeaders(),
    });
  },

  async create(payload: RolePermissionPayload): Promise<{ id: string }> {
    return http<{ id: string }>(BASE, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: RolePermissionPayload): Promise<{ ok: true }> {
    return http<{ ok: true }>(`${BASE}/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async remove(id: string): Promise<{ ok: true }> {
    return http<{ ok: true }>(`${BASE}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  async updateStatus(id: string, status: boolean): Promise<{ ok: true }> {
    return http<{ ok: true }>(`${BASE}/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  async listPages(): Promise<RolePermissionPageRow[]> {
    // expects: [{ pageKey, pageName, read, write, modify, full }] OR plain list without flags
    try {
      const data = await http<any[]>(`${BASE}/pages`, {
        method: "GET",
        headers: authHeaders(),
      });

      // normalize shape
      return data.map((p, idx) => ({
        pageKey: String(p.pageKey ?? p.key ?? p.id ?? idx),
        pageName: String(p.pageName ?? p.name ?? "Unknown"),
        read: Boolean(p.read ?? false),
        write: Boolean(p.write ?? false),
        modify: Boolean(p.modify ?? false),
        full: Boolean(p.full ?? false),
      })) as RolePermissionPageRow[];
    } catch {
      return FALLBACK_PAGES;
    }
  },
};

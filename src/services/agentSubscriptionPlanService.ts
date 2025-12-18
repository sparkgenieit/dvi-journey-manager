// FILE: src/services/agentSubscriptionPlanService.ts

import { getToken } from "@/lib/api";

export type SubscriptionType = "Free" | "Paid";

export type AgentSubscriptionPlanListItem = {
  id: string;
  planTitle: string;
  itineraryCount: number;
  cost: number;
  joiningBonus: number;
  itineraryCost: number;
  validityDays: number;
  recommended: boolean;
  status: boolean;
};

export type AgentSubscriptionPlanDetails = AgentSubscriptionPlanListItem & {
  type: SubscriptionType;
  adminCount: number;
  staffCount: number;
  additionalChargePerStaff: number;
  notes: string; // HTML/string (CKEditor-like)
};

export type AgentSubscriptionPlanPayload = {
  planTitle: string;
  type: SubscriptionType;
  cost: number;
  itineraryCount: number;
  itineraryCost: number;
  joiningBonus: number;
  validityDays: number;
  adminCount: number;
  staffCount: number;
  additionalChargePerStaff: number;
  notes: string;
};

const BASE = "/agent-subscription-plans";

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

export const agentSubscriptionPlanService = {
  async list(): Promise<AgentSubscriptionPlanListItem[]> {
    return http<AgentSubscriptionPlanListItem[]>(BASE, {
      method: "GET",
      headers: authHeaders(),
    });
  },

  async getOne(id: string): Promise<AgentSubscriptionPlanDetails> {
    return http<AgentSubscriptionPlanDetails>(`${BASE}/${id}`, {
      method: "GET",
      headers: authHeaders(),
    });
  },

  async create(payload: AgentSubscriptionPlanPayload): Promise<{ id: string }> {
    return http<{ id: string }>(BASE, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: AgentSubscriptionPlanPayload): Promise<{ ok: true }> {
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

  async updateRecommended(id: string, recommended: boolean): Promise<{ ok: true }> {
    return http<{ ok: true }>(`${BASE}/${id}/recommended`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ recommended }),
    });
  },
};

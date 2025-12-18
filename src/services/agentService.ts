// FILE: src/services/agentService.ts
import { api } from "../lib/api";
import type {
  AgentStaff,
  WalletTransaction,
  AgentSubscription,
  AgentConfig,
} from "@/types/agent";

/** ========= Frontend-facing types (used by your pages) ========= */
export interface AgentListRow {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  travelExpert: string;
  city: string;
  state: string;
  nationality: string;
  subscriptionType: string;
}

export interface Agent {
  id: number;
  firstName: string;
  lastName?: string | null;
  email: string;
  nationality: string; // pretty label from backend, read-only on UI
  state: string; // pretty label from backend, read-only on UI
  city: string; // pretty label from backend, read-only on UI
  mobileNumber: string;
  alternativeMobile?: string | null;
  gstin?: string | null;
  gstAttachment?: string | null;
}

/** ========= Backend DTO shapes (Nest responses we expect) ========= */
/** Mode A: DataTables-like rows (legacy list) */
type AgentListRowDTO = {
  sno: string;
  agentname: string;
  agentemail: string;
  mobilenumber: string;
  travelexpert: string | null;
  city: string | null;
  state: string | null;
  nationality: string | null;
  subscription_title: string;
  status: "0" | "1";
  modify: string; // agent_ID
};
type AgentListResponseDTO =
  | { data: AgentListRowDTO[]; draw?: string; recordsTotal?: number; recordsFiltered?: number }
  | { data: AgentListRowDTO[]; total?: number; filtered?: number; page?: number; limit?: number };

/** Mode B: Minimal list (your old /agents?limit=1000) */
type AgentMinimalDTO = { id: number; name: string };

/** Mode C: FULL list items returned by /agents/full */
type AgentFullItem = {
  agent_ID: number;
  agent_name: string | null;
  agent_lastname: string | null;
  agent_email_id: string | null;
  agent_primary_mobile_number: string | null;
  agent_alternative_mobile_number?: string | null;
  agent_country?: number | null;
  agent_state?: number | null;
  agent_city?: number | null;
  agent_gst_number?: string | null;
  agent_gst_attachment?: string | null;
  subscription_plan_id?: number | null;
  travel_expert_id?: number | null;
  login_enabled?: boolean;

  // Labels already computed by backend full endpoint
  country_label?: string | null;
  state_label?: string | null;
  city_label?: string | null;
  subscription_title?: string | null;
  travel_expert_label?: string | null;
};
type AgentFullEnvelope =
  | { data: AgentFullItem[]; total?: number; filtered?: number; page?: number; limit?: number }
  | { data: AgentFullItem[]; draw?: string; recordsTotal?: number; recordsFiltered?: number };

/** Preview/Edit payload (GET /agents/:id) */
type AgentViewDTO = AgentFullItem & {
  // same fields as AgentFullItem
};

/** Subscriptions endpoint (GET /agents/:id/subscriptions) */
type AgentSubscriptionsDTO = {
  data: Array<{
    id: number;
    subscription_title: string;
    amount: string; // e.g. "₹1200.00"
    validity_start: string;
    validity_end: string;
    transaction_id: string;
    payment_status: string; // "Paid" | "Pending" | "Failed" | "Free"
  }>;
  total?: number;
  page?: number;
  limit?: number;
};

/** ========= Local caches / helpers ========= */
const subscriptionTitleCache = new Map<number, string>(); // agentId -> title

const toListRowFromLegacyDTO = (r: AgentListRowDTO): AgentListRow => ({
  id: Number(r.modify),
  name: r.agentname || "",
  email: r.agentemail || "",
  mobileNumber: r.mobilenumber || "",
  travelExpert: r.travelexpert || "",
  city: r.city || "",
  state: r.state || "",
  nationality: r.nationality || "",
  subscriptionType: r.subscription_title || "",
});

const toAgentFromView = (v: AgentViewDTO): Agent => ({
  id: v.agent_ID,
  firstName: v.agent_name ?? "",
  lastName: v.agent_lastname ?? "",
  email: v.agent_email_id ?? "",
  nationality: v.country_label ?? "",
  state: v.state_label ?? "",
  city: v.city_label ?? "",
  mobileNumber: v.agent_primary_mobile_number ?? "",
  alternativeMobile: v.agent_alternative_mobile_number ?? "",
  gstin: v.agent_gst_number ?? "",
  gstAttachment: v.agent_gst_attachment ?? "",
});

/** Map an item from FULL list → table row */
const toListRowFromFullItem = (v: AgentFullItem): AgentListRow => ({
  id: Number(v.agent_ID),
  name: [v.agent_name, v.agent_lastname].filter(Boolean).join(" ").trim(),
  email: v.agent_email_id ?? "",
  mobileNumber: v.agent_primary_mobile_number ?? "",
  travelExpert: v.travel_expert_label ?? "",
  city: v.city_label ?? "",
  state: v.state_label ?? "",
  nationality: v.country_label ?? "",
  subscriptionType: (v.subscription_title ?? "").toString() || "—",
});

/** Concurrency helper */
async function withConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

/** Try to resolve a subscription title for an agent (fallback when list item lacks it). */
async function resolveSubscriptionTitle(agentId: number): Promise<string> {
  if (subscriptionTitleCache.has(agentId)) return subscriptionTitleCache.get(agentId)!;

  try {
    const subs = (await api(`/agents/${agentId}/subscriptions`)) as AgentSubscriptionsDTO;
    const title = subs?.data?.[0]?.subscription_title?.toString()?.trim() || "Free";
    subscriptionTitleCache.set(agentId, title);
    return title;
  } catch {
    const fallback = "Free";
    subscriptionTitleCache.set(agentId, fallback);
    return fallback;
  }
}

/** Safe number extractor from strings like "₹1,200.00" */
function parseAmountToNumber(v: string | number | null | undefined): number {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Wallet history common mapper (server shape is not fixed yet) */
function mapWalletRows(rows: any[] | undefined): WalletTransaction[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r, i) => ({
    id: Number(r.id ?? i + 1),
    transactionDate:
      r.transactionDate ??
      r.createdOn ??
      r.createdon ??
      r.date ??
      "", // keep string; UI displays as-is
    transactionAmount: parseAmountToNumber(r.transactionAmount ?? r.amount ?? r.value ?? 0),
    transactionType:
      r.transactionType ??
      r.type ??
      (parseAmountToNumber(r.transactionAmount ?? r.amount ?? 0) >= 0 ? "Credit" : "Debit"),
    remark: r.remark ?? r.remarks ?? r.note ?? "",
  }));
}

/** ========= Public API consumed by your pages ========= */
export const AgentAPI = {
  /**
   * Fetch list of agents.
   * Prefer the FULL endpoint so your table gets all labels in one go.
   * Fallbacks:
   *  - legacy {data:[…]} (DataTables-like)
   *  - minimal [{id,name}] → enrich via /agents/:id
   */
  async list(): Promise<AgentListRow[]> {
    // 1) Try FULL endpoint first
    try {
      const full = (await api("/agents/full?limit=1000")) as AgentFullEnvelope | AgentFullItem[];
      const arr: AgentFullItem[] = Array.isArray(full)
        ? (full as AgentFullItem[])
        : Array.isArray((full as any)?.data)
        ? ((full as any).data as AgentFullItem[])
        : [];

      if (arr.length && typeof arr[0] === "object" && "agent_ID" in arr[0]) {
        const mapped = arr.map(toListRowFromFullItem);

        // Fill subscriptionType if some are empty
        const fixed = await withConcurrency(mapped, 8, async (r) => {
          if (r.subscriptionType && r.subscriptionType.trim() && r.subscriptionType !== "—") return r;
          return { ...r, subscriptionType: await resolveSubscriptionTitle(r.id) };
        });

        const byId = new Map<number, AgentListRow>();
        for (const r of fixed) byId.set(r.id, r);
        return Array.from(byId.values());
      }
    } catch {
      // ignore and try other shapes
    }

    // 2) Legacy list (DataTables-like) shape
    try {
      const res = (await api("/agents?limit=1000")) as AgentListResponseDTO | AgentMinimalDTO[];

      if ((res as any)?.data && Array.isArray((res as any).data)) {
        const rows = (res as any).data as AgentListRowDTO[];
        return rows.map(toListRowFromLegacyDTO);
      }

      // 3) Minimal list → enrich to table rows
      if (Array.isArray(res) && res.length && typeof res[0] === "object" && "id" in (res[0] as any)) {
        const minimal = res as AgentMinimalDTO[];
        const enriched = await withConcurrency(minimal, 6, async (m) => {
          try {
            const view = (await api(`/agents/${m.id}`)) as AgentViewDTO;
            const row = toListRowFromFullItem(view);
            if (!row.subscriptionType || !row.subscriptionType.trim() || row.subscriptionType === "—") {
              row.subscriptionType = await resolveSubscriptionTitle(m.id);
            }
            return row;
          } catch {
            return {
              id: m.id,
              name: m.name || "",
              email: "",
              mobileNumber: "",
              travelExpert: "",
              city: "",
              state: "",
              nationality: "",
              subscriptionType: await resolveSubscriptionTitle(m.id),
            } as AgentListRow;
          }
        });

        const byId = new Map<number, AgentListRow>();
        for (const r of enriched) byId.set(r.id, r);
        return Array.from(byId.values());
      }
    } catch {
      // swallow and fall through
    }

    return [];
  },

  /** Fetch a single agent (used by preview/edit prefill) */
  async get(id: number): Promise<Agent> {
    const res = (await api(`/agents/${id}`)) as AgentViewDTO;
    return toAgentFromView(res);
  },

  /** --------- NEW: Staff list for an agent ---------- */
  async getStaff(opts: { agentId: number }): Promise<AgentStaff[]> {
    const { agentId } = opts;

    // Prefer RESTful nested route if present
    try {
      const resp = (await api(`/agents/${agentId}/staff`)) as any;
      const rows: any[] = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
      if (rows.length) {
        return rows.map((r: any, i: number) => ({
          id: Number(r.id ?? r.staff_ID ?? i + 1),
          name:
            r.name ??
            [r.staff_name ?? r.first_name ?? "", r.staff_lastname ?? r.last_name ?? ""]
              .join(" ")
              .replace(/\s+/g, " ")
              .trim(),
          mobileNumber: r.mobile ?? r.staff_mobile ?? r.phone ?? "",
          email: r.email ?? r.staff_email ?? "",
          status: Number(r.status ?? r.deleted === 0 ? 1 : 0),
        }));
      }
    } catch {
      // fall through
    }

    // Fallback to query form if your server exposes it that way
    try {
      const resp = (await api(`/staff?agentId=${agentId}`)) as any;
      const rows: any[] = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
      return rows.map((r: any, i: number) => ({
        id: Number(r.id ?? r.staff_ID ?? i + 1),
        name:
          r.name ??
          [r.staff_name ?? r.first_name ?? "", r.staff_lastname ?? r.last_name ?? ""]
            .join(" ")
            .replace(/\s+/g, " ")
            .trim(),
        mobileNumber: r.mobile ?? r.staff_mobile ?? r.phone ?? "",
        email: r.email ?? r.staff_email ?? "",
        status: Number(r.status ?? r.deleted === 0 ? 1 : 0),
      }));
    } catch {
      return [];
    }
  },

  /** --------- NEW: Wallet (cash) history ---------- */
  async getCashWalletHistory(agentId: number): Promise<WalletTransaction[]> {
    try {
      const resp = (await api(`/agents/${agentId}/wallet/cash`)) as any;
      const rows = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
      return mapWalletRows(rows);
    } catch {
      return [];
    }
  },

  /** --------- NEW: Wallet (coupon) history ---------- */
  async getCouponWalletHistory(agentId: number): Promise<WalletTransaction[]> {
    try {
      const resp = (await api(`/agents/${agentId}/wallet/coupon`)) as any;
      const rows = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
      return mapWalletRows(rows);
    } catch {
      return [];
    }
  },

  /** --------- NEW: Add cash wallet entry ---------- */
  async addCashWallet(agentId: number, amount: number, remark: string): Promise<{ ok: true }> {
    await api(`/agents/${agentId}/wallet/cash`, {
      method: "POST",
      body: { amount, remark },
    });
    return { ok: true };
  },

  /** --------- NEW: Add coupon wallet entry ---------- */
  async addCouponWallet(agentId: number, amount: number, remark: string): Promise<{ ok: true }> {
    await api(`/agents/${agentId}/wallet/coupon`, {
      method: "POST",
      body: { amount, remark },
    });
    return { ok: true };
  },

  /** --------- NEW: Subscriptions (maps to your DTO) ---------- */
  async getSubscriptions(agentId: number): Promise<AgentSubscription[]> {
    try {
      const resp = (await api(`/agents/${agentId}/subscriptions`)) as AgentSubscriptionsDTO;
      const rows = Array.isArray(resp?.data) ? resp.data : [];
      return rows.map((r, i) => ({
        id: Number(r.id ?? i + 1),
        subscriptionTitle: r.subscription_title?.toString() ?? "Free",
        amount: parseAmountToNumber(r.amount),
        validityStart: r.validity_start ?? "",
        validityEnd: r.validity_end ?? "",
        transactionId: r.transaction_id ?? "--",
        paymentStatus: r.payment_status ?? "Free",
      }));
    } catch {
      return [];
    }
  },

  /** --------- NEW: Agent configuration ---------- */
  async getConfig(agentId: number): Promise<AgentConfig | null> {
    try {
      const resp = (await api(`/agents/${agentId}/config`)) as any;
      const r = (resp && (resp.data ?? resp)) || {};
      const cfg: AgentConfig = {
        itineraryDiscountMargin: Number(r.itineraryDiscountMargin ?? r.itinerary_discount_margin ?? 0),
        serviceCharge: Number(r.serviceCharge ?? r.service_charge ?? 0),
        agentMarginGstType:
          (r.agentMarginGstType ?? r.agent_margin_gst_type ?? "INCLUSIVE").toString(),
        agentMarginGstPercentage: (r.agentMarginGstPercentage ?? r.agent_margin_gst_percentage ?? "0").toString(),
        companyName: (r.companyName ?? r.company_name ?? "") as string,
        address: (r.address ?? "") as string,
      };
      return cfg;
    } catch {
      return null;
    }
  },

  // --- Placeholders: wire later when you expose create/update endpoints ---
  async create(_input: {
    firstName: string;
    lastName?: string | null;
    email: string;
    mobileNumber: string;
    alternativeMobile?: string | null;
    countryId?: number;
    stateId?: number;
    cityId?: number;
    gstin?: string | null;
  }): Promise<Agent> {
    throw new Error("Agent create API not implemented yet");
  },

  async update(
    _id: number,
    _input: Partial<{
      firstName: string;
      lastName: string | null;
      email: string;
      mobileNumber: string;
      alternativeMobile?: string | null;
      countryId?: number;
      stateId?: number;
      cityId?: number;
      gstin?: string | null;
    }>,
  ): Promise<Agent> {
    throw new Error("Agent update API not implemented yet");
  },
};

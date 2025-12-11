// src/services/agentService.ts

import type { 
  Agent, 
  AgentListRow, 
  AgentStaff, 
  WalletTransaction, 
  AgentSubscription, 
  AgentConfig 
} from "@/types/agent";

// Mock agent data matching screenshots
const mockAgents: Agent[] = [
  { id: 1, firstName: "VINODH", lastName: "", email: "vinodh@baradiaholidays.com", mobileNumber: "9894148383", travelExpert: "--", city: "Chennai", state: "Tamil Nadu", nationality: "India", subscriptionType: "Free /", status: 1 },
  { id: 2, firstName: "SONU", lastName: "SURI", email: "shyamrailtravels@gmail.com", mobileNumber: "9837579333", alternativeMobile: "9837114723", travelExpert: "--", city: "BULANDSHAHR", state: "Uttar Pradesh", nationality: "India", subscriptionType: "Free /", gstin: "09AUPPS4307P1ZQ", status: 1 },
  { id: 3, firstName: "Karthik", lastName: "", email: "connect@hygeelfe.com", mobileNumber: "9916436414", travelExpert: "--", city: "Bengaluru", state: "Karnataka", nationality: "India", subscriptionType: "Free /", status: 1 },
  { id: 4, firstName: "Dhruv", lastName: "", email: "spedizonetravels@gmail.com", mobileNumber: "7709122894", travelExpert: "--", city: "Mohali", state: "Punjab", nationality: "India", subscriptionType: "Free /", status: 1 },
  { id: 5, firstName: "Mrs Neelam", lastName: "", email: "trawelhub@gmail.com", mobileNumber: "9721036121", travelExpert: "--", city: "Varanasi", state: "Uttar Pradesh", nationality: "India", subscriptionType: "Free /", status: 1 },
  { id: 6, firstName: "R", lastName: "", email: "inquiry.freelancetourism@gmail.com", mobileNumber: "9618273119", travelExpert: "--", city: "Rajahmundry", state: "Andhra Pradesh", nationality: "India", subscriptionType: "Free /", status: 1 },
  { id: 7, firstName: "Muhammad", lastName: "", email: "operations@waycay.in", mobileNumber: "9076061987", travelExpert: "--", city: "Mumbai", state: "Maharashtra", nationality: "India", subscriptionType: "Free /", status: 1 },
  { id: 8, firstName: "Lakshmipriya", lastName: "", email: "trv@clubtoursonline.com", mobileNumber: "9633967478", travelExpert: "--", city: "TRIVANDRUM", state: "Kerala", nationality: "India", subscriptionType: "Free /", status: 1 },
  { id: 9, firstName: "OMPRAKASH", lastName: "", email: "sales2.trv@akbarholidays.com", mobileNumber: "9387544112", travelExpert: "--", city: "TRIVANDRUM", state: "Kerala", nationality: "India", subscriptionType: "Free /", status: 1 },
  { id: 10, firstName: "Sona", lastName: "", email: "yellowsunshine077@gmail.com", mobileNumber: "8593969636", travelExpert: "--", city: "Kochi", state: "Kerala", nationality: "India", subscriptionType: "Free /", status: 1 },
];

let agentData = [...mockAgents];

const mockAgentStaff: AgentStaff[] = [
  { id: 1, name: "test", mobileNumber: "21111", email: "ttest@dsdsd.com", status: 1 },
];

const mockCashWalletHistory: WalletTransaction[] = [
  { id: 1, transactionDate: "11 Dec 2025", transactionAmount: 12.00, transactionType: "Credit", remark: "sdsad" },
];

const mockCouponWalletHistory: WalletTransaction[] = [
  { id: 1, transactionDate: "15 Oct 2025", transactionAmount: 10000.00, transactionType: "Credit", remark: "Agent Free Subscription Joining Bonus" },
];

const mockSubscriptions: AgentSubscription[] = [
  { id: 1, subscriptionTitle: "Free", amount: 0.00, validityStart: "15 Oct 2025", validityEnd: "15 Oct 2026", transactionId: "--", paymentStatus: "Free" },
];

const mockAgentConfigs: Record<number, AgentConfig> = {
  2: {
    itineraryDiscountMargin: 0,
    serviceCharge: 0,
    agentMarginGstType: "Included",
    agentMarginGstPercentage: "0",
    companyName: "SHYAM RAIL TRAVELS SERVIE AGENT",
    address: "",
    termsAndCondition: "",
    gstinNumber: "",
    panNo: "",
    invoiceAddress: "",
  },
};

export const AgentAPI = {
  async list(): Promise<AgentListRow[]> {
    await new Promise((r) => setTimeout(r, 200));
    return agentData.map((a) => ({
      id: a.id,
      name: a.firstName + (a.lastName ? " " + a.lastName : ""),
      email: a.email,
      mobileNumber: a.mobileNumber,
      travelExpert: a.travelExpert || "--",
      city: a.city,
      state: a.state,
      nationality: a.nationality,
      subscriptionType: a.subscriptionType,
    }));
  },

  async get(id: number): Promise<Agent | null> {
    await new Promise((r) => setTimeout(r, 100));
    return agentData.find((a) => a.id === id) ?? null;
  },

  async create(payload: Omit<Agent, "id">): Promise<Agent> {
    await new Promise((r) => setTimeout(r, 200));
    const newAgent: Agent = {
      ...payload,
      id: Math.max(...agentData.map((a) => a.id)) + 1,
    };
    agentData.push(newAgent);
    return newAgent;
  },

  async update(id: number, payload: Partial<Agent>): Promise<Agent> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = agentData.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Agent not found");
    agentData[idx] = { ...agentData[idx], ...payload };
    return agentData[idx];
  },

  async delete(id: number): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    agentData = agentData.filter((a) => a.id !== id);
  },

  async getStaff(agentId: number): Promise<AgentStaff[]> {
    await new Promise((r) => setTimeout(r, 100));
    return mockAgentStaff;
  },

  async getCashWalletHistory(agentId: number): Promise<WalletTransaction[]> {
    await new Promise((r) => setTimeout(r, 100));
    return mockCashWalletHistory;
  },

  async getCouponWalletHistory(agentId: number): Promise<WalletTransaction[]> {
    await new Promise((r) => setTimeout(r, 100));
    return mockCouponWalletHistory;
  },

  async getSubscriptions(agentId: number): Promise<AgentSubscription[]> {
    await new Promise((r) => setTimeout(r, 100));
    return mockSubscriptions;
  },

  async getConfig(agentId: number): Promise<AgentConfig> {
    await new Promise((r) => setTimeout(r, 100));
    return mockAgentConfigs[agentId] || {
      itineraryDiscountMargin: 0,
      serviceCharge: 0,
      agentMarginGstType: "Included",
      agentMarginGstPercentage: "0",
      companyName: "",
      address: "",
      termsAndCondition: "",
      gstinNumber: "",
      panNo: "",
      invoiceAddress: "",
    };
  },

  async updateConfig(agentId: number, config: Partial<AgentConfig>): Promise<AgentConfig> {
    await new Promise((r) => setTimeout(r, 200));
    mockAgentConfigs[agentId] = { ...mockAgentConfigs[agentId] || {}, ...config } as AgentConfig;
    return mockAgentConfigs[agentId];
  },

  async addCashWallet(agentId: number, amount: number, remark: string): Promise<WalletTransaction> {
    await new Promise((r) => setTimeout(r, 200));
    const transaction: WalletTransaction = {
      id: mockCashWalletHistory.length + 1,
      transactionDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      transactionAmount: amount,
      transactionType: "Credit",
      remark,
    };
    mockCashWalletHistory.push(transaction);
    return transaction;
  },

  async addCouponWallet(agentId: number, amount: number, remark: string): Promise<WalletTransaction> {
    await new Promise((r) => setTimeout(r, 200));
    const transaction: WalletTransaction = {
      id: mockCouponWalletHistory.length + 1,
      transactionDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      transactionAmount: amount,
      transactionType: "Credit",
      remark,
    };
    mockCouponWalletHistory.push(transaction);
    return transaction;
  },
};

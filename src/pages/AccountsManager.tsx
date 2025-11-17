// FILE: src/pages/AccountsManager.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Calendar as CalendarIcon } from "lucide-react";

// 👇 same as LatestItinerary
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// 🔌 New shared backend layer for Accounts Manager
import {
  fetchAccountsList,
  fetchAccountsSummary,
  fetchAgents,
  fetchPaymentModes,
  searchQuotes,
} from "@/services/accountsManagerApi";
import type {
  AccountsRow,
  AccountsSummary,
  AccountsFilters,
  AgentOption,
  PaymentModeOption,
  AccountsComponentType,
} from "@/services/accountsManagerApi";
import { PayNowModal } from "./PayNowModal";

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(v);

// 👇 same small util as LatestItinerary (no date-fns)
function formatToDDMMYYYY(date: Date | undefined) {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Sections for "List of Accounts Details" – same components as PHP ALL list
const SECTION_CONFIG = [
  { type: "guide", label: "Guide" },
  { type: "hotspot", label: "Hotspot" },
  { type: "activity", label: "Activity" },
  { type: "hotel", label: "Hotel" },
  { type: "vehicle", label: "Vehicle" },
] as const;

type SectionKey = (typeof SECTION_CONFIG)[number]["type"];

export const AccountsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "paid" | "due">("all");
  const [quoteIdFilter, setQuoteIdFilter] = useState("");
  // 👇 now strongly typed: "all" + union from API
  const [componentType, setComponentType] = useState<
    "all" | AccountsComponentType
  >("all");

  // 👇 show like LatestItinerary: we store string + date obj
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromDateObj, setFromDateObj] = useState<Date | undefined>(undefined);
  const [toDateObj, setToDateObj] = useState<Date | undefined>(undefined);

  const [agent, setAgent] = useState(""); // "" means ALL in filters
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<AccountsRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState<AccountsSummary | null>(null);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentModeOption[]>([]);

  // Quote autocomplete state
  const [quoteSearchTerm, setQuoteSearchTerm] = useState("");
  const [quoteSuggestions, setQuoteSuggestions] = useState<string[]>([]);

  const [visibleCount, setVisibleCount] = useState(20);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 👉 Pay Now modal state
  const [payNowOpen, setPayNowOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AccountsRow | null>(null);

  // -------------------------------------------------
  // LOOKUPS: agents + payment modes
  // -------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      try {
        const [agentsData, paymentModesData] = await Promise.all([
          fetchAgents(),
          fetchPaymentModes(),
        ]);
        if (cancelled) return;
        setAgents(agentsData);
        setPaymentModes(paymentModesData);
      } catch (err) {
        console.error("Failed to load agents / payment modes:", err);
      }
    }

    loadLookups();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------
  // QUOTE AUTOCOMPLETE
  // -------------------------------------------------
  useEffect(() => {
    if (!quoteSearchTerm.trim()) {
      setQuoteSuggestions([]);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const result = await searchQuotes(quoteSearchTerm.trim());
        setQuoteSuggestions(result.map((q) => q.quoteId));
      } catch (err) {
        console.error("Quote search failed:", err);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [quoteSearchTerm]);

  // -------------------------------------------------
  // MAIN DATA FETCH (LIST + SUMMARY) ON FILTER CHANGE
  // -------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);
      try {
        const filters: AccountsFilters = {
          status: activeTab,
          quoteId: quoteIdFilter || undefined,
          // 👇 backend should not get "all"
          componentType:
            componentType === "all" ? undefined : componentType,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          agent: agent || undefined,
          search: search || undefined,
        };

        const [listData, summaryData] = await Promise.all([
          fetchAccountsList(filters),
          fetchAccountsSummary(filters),
        ]);

        if (isCancelled) return;
        setRows(listData);
        setSummary(summaryData);
        setVisibleCount(20);
      } catch (err) {
        console.error("Failed to fetch accounts manager data:", err);
        if (!isCancelled) {
          setRows([]);
          setSummary(null);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, [activeTab, quoteIdFilter, componentType, fromDate, toDate, agent, search]);

  const filteredRows = useMemo(() => rows, [rows]);

  // -------------------------------------------------
  // TOTALS (ROW-BASED) – keep existing behaviour
  // -------------------------------------------------
  const rowTotalBilled = filteredRows.reduce((s, r) => s + r.amount, 0);
  const rowTotalReceived = filteredRows
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.payout, 0);
  const rowTotalReceivable = filteredRows
    .filter((r) => r.status === "due")
    .reduce((s, r) => s + r.payable, 0);
  const rowTotalPayout = filteredRows.reduce((s, r) => s + r.payout, 0);
  const rowTotalPayable = filteredRows.reduce((s, r) => s + r.payable, 0);
  const rowTotalProfit = rowTotalReceived - rowTotalPayable;

  // 🔗 Map summary endpoint to your cards (with safe fallbacks)
  const totalBilled = summary?.totalPayable ?? rowTotalBilled;
  const totalPayout = summary?.totalPaid ?? rowTotalPayout;
  const totalPayable = summary?.totalBalance ?? rowTotalPayable;

  const totalReceived = rowTotalReceived; // keep same semantics as before
  const totalReceivable = rowTotalReceivable;
  const totalProfit = rowTotalProfit;

  // visible (infinite scroll)
  const visibleRows = filteredRows.slice(0, visibleCount);
  const visibleAmount = visibleRows.reduce((s, r) => s + r.amount, 0);
  const visiblePayout = visibleRows.reduce((s, r) => s + r.payout, 0);
  const visiblePayable = visibleRows.reduce((s, r) => s + r.payable, 0);
  const visibleProfit = visiblePayout - visiblePayable;
  const isAllLoaded = visibleCount >= filteredRows.length;

  // Group visible rows by component type (guide / hotspot / activity / hotel / vehicle)
  const groupedVisibleRows = useMemo(() => {
    const base: Record<SectionKey, AccountsRow[]> = {
      guide: [],
      hotspot: [],
      activity: [],
      hotel: [],
      vehicle: [],
    };

    for (const row of visibleRows) {
      const t = (row as any).componentType as string | undefined;
      if (!t) continue;
      if ((base as any)[t]) {
        (base as any)[t].push(row);
      }
    }

    return base;
  }, [visibleRows]);

  // Render one header + body block for a given component type – mirrors PHP ALL list
  const renderSection = (type: SectionKey, label: string) => {
    const rowsForType = groupedVisibleRows[type];
    if (!rowsForType || rowsForType.length === 0) return null;

    return (
      <>
        <TableHeader>
          <TableRow className="bg-[#fbf2ff]">
            <TableHead className="text-xs text-[#4a4260]">
              QUOTE ID
            </TableHead>
            <TableHead className="text-xs text-[#4a4260]">
              ACTION
            </TableHead>
            <TableHead className="text-xs text-[#4a4260] text-right">
              {label}
            </TableHead>
            <TableHead className="text-xs text-[#4a4260] text-right">
              AMOUNT
            </TableHead>
            <TableHead className="text-xs text-[#4a4260] text-right">
              PAYOUT
            </TableHead>
            <TableHead className="text-xs text-[#4a4260] text-right">
              PAYABLE
            </TableHead>
            {/* Extra columns (Receivable / Inhand / Service / Tax / Date / Guest etc.)
                can be added here later per component if backend exposes them. */}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rowsForType.map((row, index) => (
            <TableRow key={`${type}-${index}`} className="hover:bg-[#fff7ff]">
              {/* QUOTE ID */}
              <TableCell className="text-sm text-[#7b6b99]">
                {row.quoteId}
              </TableCell>

              {/* ACTION – Pay Now / Paid */}
              <TableCell>
                <Button
                  className="h-7 bg-[#f6ecff] hover:bg-[#f6ecff] text-[#7c2f9a] px-4 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleOpenPayNow(row)}
                  disabled={row.status !== "due" || row.payable <= 0}
                >
                  {row.status === "paid" ? "Paid" : "Pay Now"}
                </Button>
              </TableCell>

              {/* NAME COLUMN – hotel/guide/hotspot/activity/vehicle label
                  For now we use row.hotelName; backend should map each component's label into this field. */}
              <TableCell className="text-sm text-[#4a4260]">
                {row.hotelName}
              </TableCell>

              {/* AMOUNT / PAYOUT / PAYABLE */}
              <TableCell className="text-sm text-right text-[#4a4260]">
                {formatINR(row.amount)}
              </TableCell>
              <TableCell className="text-sm text-right text-[#4a4260]">
                {formatINR(row.payout)}
              </TableCell>
              <TableCell className="text-sm text-right text-[#4a4260]">
                {formatINR(row.payable)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </>
    );
  };

  // infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        setVisibleCount((prev) =>
          Math.min(prev + 20, filteredRows.length || prev),
        );
      }
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, [filteredRows.length]);

  const clearFilters = () => {
    setQuoteIdFilter("");
    setQuoteSearchTerm("");
    setQuoteSuggestions([]);
    setComponentType("all");
    setFromDate("");
    setToDate("");
    setFromDateObj(undefined);
    setToDateObj(undefined);
    setAgent("");
  };

  // -------------------------------------------------
  // PAY NOW HANDLERS (now using PayNowModal + /pay endpoint)
  // -------------------------------------------------
  const handleOpenPayNow = (row: AccountsRow) => {
    setSelectedRow(row);
    setPayNowOpen(true);
  };

  const handleClosePayNow = () => {
    setPayNowOpen(false);
    setSelectedRow(null);
  };

  const handlePaySuccess = async () => {
    // close modal
    setPayNowOpen(false);
    setSelectedRow(null);

    // reload list + summary with same filters
    try {
      setLoading(true);
      const filters: AccountsFilters = {
        status: activeTab,
        quoteId: quoteIdFilter || undefined,
        componentType:
          componentType === "all" ? undefined : componentType,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        agent: agent || undefined,
        search: search || undefined,
      };
      const [listData, summaryData] = await Promise.all([
        fetchAccountsList(filters),
        fetchAccountsSummary(filters),
      ]);
      setRows(listData);
      setSummary(summaryData);
      setVisibleCount(20);
    } catch (err) {
      console.error("Failed to reload after payment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full bg-[#fbeef8] min-h-screen p-4 md:p-6">
      <h1 className="text-lg md:text-xl font-semibold text-[#4a4260] mb-4">
        Payout List
      </h1>

      {/* TABS */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-10 py-2 rounded-full border ${
            activeTab === "all"
              ? "bg-white text-[#4a4260] shadow-sm"
              : "bg-transparent border-transparent text-[#6a6181]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          className={`px-10 py-2 rounded-full border ${
            activeTab === "paid"
              ? "bg-white text-[#4a4260] shadow-sm"
              : "bg-transparent border-transparent text-[#6a6181]"
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setActiveTab("due")}
          className={`px-10 py-2 rounded-full border ${
            activeTab === "due"
              ? "bg-white text-[#4a4260] shadow-sm"
              : "bg-transparent border-transparent text-[#6a6181]"
          }`}
        >
          Due
        </button>
      </div>

      {/* FILTER BAR (styled like LatestItinerary) */}
      <Card className="shadow-none border-none mb-4 bg-white/70">
        <CardContent className="pt-6 pb-5">
          <p className="text-sm font-semibold text-[#4a4260] mb-4">FILTER</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Quote ID with autocomplete */}
            <div className="space-y-2 relative">
              <Label className="text-sm text-[#4a4260]">Quote ID</Label>
              <Input
                placeholder="Enter the Quote ID"
                value={quoteIdFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setQuoteIdFilter(value);
                  setQuoteSearchTerm(value);
                }}
                className="h-9"
              />
              {quoteSuggestions.length > 0 && (
                <div className="absolute z-20 bg-white border rounded mt-1 w-full max-h-40 overflow-y-auto text-xs">
                  {quoteSuggestions.map((q) => (
                    <div
                      key={q}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setQuoteIdFilter(q);
                        setQuoteSearchTerm(q);
                        setQuoteSuggestions([]);
                      }}
                    >
                      {q}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Component Type */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">Component Type</Label>
              <Select
                value={componentType}
                onValueChange={(v) =>
                  setComponentType(v as "all" | AccountsComponentType)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="hotspot">Hotspot</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date (calendar like LatestItinerary) */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start h-9 text-left font-normal ${
                      !fromDate ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate || "DD/MM/YYYY"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDateObj}
                    onSelect={(date) => {
                      setFromDateObj(date ?? undefined);
                      const formatted = formatToDDMMYYYY(date ?? undefined);
                      setFromDate(formatted);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date (calendar like LatestItinerary) */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start h-9 text-left font-normal ${
                      !toDate ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate || "DD/MM/YYYY"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDateObj}
                    onSelect={(date) => {
                      setToDateObj(date ?? undefined);
                      const formatted = formatToDDMMYYYY(date ?? undefined);
                      setToDate(formatted);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Agent + Clear */}
            <div className="space-y-2 flex flex-col justify-end">
              <Label className="text-sm text-[#4a4260]">Agent</Label>
              <div className="flex gap-2">
                <Select
                  // use "__all" sentinel in UI; "" in state == ALL
                  value={agent || "__all"}
                  onValueChange={(v) => {
                    if (v === "__all") {
                      setAgent("");
                    } else {
                      setAgent(v);
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.name}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={clearFilters}
                  className="bg-[#f057b8] hover:bg-[#e348aa] text-white h-9 px-4"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Billed</p>
          <p className="text-xl font-semibold text-[#3d3551]">
            {formatINR(totalBilled)}
          </p>
        </div>
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Received</p>
          <p className="text-xl font-semibold text-[#3d3551]">
            {formatINR(totalReceived)}
          </p>
        </div>
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Receivable</p>
          <p className="text-xl font-semibold text-[#3d3551]">
            {formatINR(totalReceivable)}
          </p>
        </div>
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Payout</p>
          <p className="text-xl font-semibold text-[#3d3551]">
            {formatINR(totalPayout)}
          </p>
        </div>
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Payable</p>
          <p className="text-xl font-semibold text-[#3d3551]">
            {formatINR(totalPayable)}
          </p>
        </div>
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Profit </p>
          <p className="text-xl font-semibold text-[#10a037]">
            {formatINR(totalProfit)}
          </p>
        </div>
      </div>

      {/* LIST CARD */}
      <Card className="shadow-none border-none bg-white/70">
        <CardContent className="pt-6 pb-0">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <p className="text-sm font-semibold text-[#4a4260]">
              List of Accounts Details
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-48"
              />
              <Button
                variant="outline"
                className="h-9 px-4 gap-2 bg-[#e5fff1] border-[#b7f7d9] text-[#0f9c34]"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>

        {/* SCROLL TABLE – vertical + horizontal */}
        <div
          ref={scrollRef}
          className="max-h-[460px] overflow-y-auto overflow-x-auto border-t border-[#f3e0ff]"
        >
          {/* min-w-[1400px] forces horizontal scroll so all columns are visible */}
          <Table id="all_accountsmanager_list" className="min-w-[1400px]">
            {/* Initial loading state (before any rows are visible) */}
            {loading && visibleRows.length === 0 && (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-center py-6 text-xs"
                  >
                    Loading records…
                  </TableCell>
                </TableRow>
              </TableBody>
            )}

            {/* No records */}
            {!loading && visibleRows.length === 0 && (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-center py-6 text-xs"
                  >
                    No records found
                  </TableCell>
                </TableRow>
              </TableBody>
            )}

            {/* Sections by component type (Guide / Hotspot / Activity / Hotel / Vehicle) */}
            {!loading && visibleRows.length > 0 && (
              <>
                {(componentType === "all"
                  ? SECTION_CONFIG
                  : SECTION_CONFIG.filter(
                      (s) => s.type === (componentType as SectionKey),
                    )
                ).map((section) =>
                  renderSection(section.type, section.label),
                )}

                {/* Bottom loader / completion row – similar to PHP footer */}
                <TableBody>
                  {visibleCount < filteredRows.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center py-4 text-xs"
                      >
                        Loading more…
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center py-4 text-xs"
                      >
                        All rows loaded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </>
            )}
          </Table>
        </div>

        {/* BOTTOM RUNNING TOTAL BAR */}
        <div className="w-full overflow-x-auto border-t border-[#f3e0ff] bg-white">
          <div className="min-w-max flex gap-6 px-6 py-3 items-center text-sm">
            <div className="text-[#4a4260] whitespace-nowrap">
              Total Amount{" "}
              <span className="font-semibold">
                ({formatINR(visibleAmount)})
              </span>
            </div>
            <div className="text-[#4a4260] whitespace-nowrap">
              Total Payout{" "}
              <span className="font-semibold">
                ({formatINR(visiblePayout)})
              </span>
            </div>
            <div className="text-[#4a4260] whitespace-nowrap">
              Total Payable{" "}
              <span className="font-semibold">
                ({formatINR(visiblePayable)})
              </span>
            </div>
            <div className={cnProfit(isAllLoaded, visibleProfit)}>
              {formatINR(visibleProfit)}{" "}
              {isAllLoaded ? "(Final Profit)" : "(Running Profit)"}
            </div>
          </div>
        </div>

        <div className="py-4 text-center text-xs text-[#a593c7]">
          DVI Holidays @ 2025
        </div>
      </Card>

      {/* PAY NOW MODAL (new component) */}
      {payNowOpen && selectedRow && (
        <PayNowModal
          row={selectedRow}
          paymentModes={paymentModes}
          onClose={handleClosePayNow}
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
};

// small helper to match green style only at end
function cnProfit(allLoaded: boolean, _value: number) {
  if (allLoaded) {
    return "text-[#10a037] font-semibold whitespace-nowrap";
  }
  return "text-[#6f97ff] font-semibold whitespace-nowrap";
}

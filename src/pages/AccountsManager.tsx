// FILE: AccountsManager.tsx

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// 🧱 modal for Pay Now
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// 🔌 use shared API wrapper
import { api } from "@/lib/api";

type AccountRow = {
  id: number;
  quoteId: string;
  hotelName: string;
  amount: number;
  payout: number;
  payable: number;
  status: "paid" | "due";
  componentType?: "hotel" | "flight" | "vehicle" | "guide" | "hotspot" | "activity";
  agent?: string;
  startDate?: string; // DD/MM/YYYY
  endDate?: string; // DD/MM/YYYY
  routeDate?: string; // DD/MM/YYYY, used for vehicle/guide/hotspot/activity
  vehicleId?: number; // for vehicle payouts
  vendorId?: number; // for vehicle payouts
};

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

export const AccountsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "paid" | "due">("all");
  const [quoteIdFilter, setQuoteIdFilter] = useState("");
  const [componentType, setComponentType] = useState("all");

  // 👇 show like LatestItinerary: we store string + date obj
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromDateObj, setFromDateObj] = useState<Date | undefined>(undefined);
  const [toDateObj, setToDateObj] = useState<Date | undefined>(undefined);

  const [agent, setAgent] = useState("");
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [visibleCount, setVisibleCount] = useState(20);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 👉 Pay Now modal state
  const [payNowOpen, setPayNowOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AccountRow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [payNowLoading, setPayNowLoading] = useState(false);
  const [payNowError, setPayNowError] = useState<string | null>(null);

  // fetch on filter change
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAccountsFromApi({
          status: activeTab,
          quoteId: quoteIdFilter,
          componentType,
          fromDate,
          toDate,
          agent,
          search,
        });
        if (!isCancelled) {
          setRows(data);
          setVisibleCount(20);
        }
      } catch (err) {
        console.error("Failed to fetch accounts manager data:", err);
        if (!isCancelled) {
          setRows([]);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [activeTab, quoteIdFilter, componentType, fromDate, toDate, agent, search]);

  const filteredRows = useMemo(() => rows, [rows]);

  // totals (full)
  const totalBilled = filteredRows.reduce((s, r) => s + r.amount, 0);
  const totalReceived = filteredRows
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.payout, 0);
  const totalReceivable = filteredRows
    .filter((r) => r.status === "due")
    .reduce((s, r) => s + r.payable, 0);
  const totalPayout = filteredRows.reduce((s, r) => s + r.payout, 0);
  const totalPayable = filteredRows.reduce((s, r) => s + r.payable, 0);
  const totalProfit = totalReceived - totalPayable;

  // visible (infinite scroll)
  const visibleRows = filteredRows.slice(0, visibleCount);
  const visibleAmount = visibleRows.reduce((s, r) => s + r.amount, 0);
  const visiblePayout = visibleRows.reduce((s, r) => s + r.payout, 0);
  const visiblePayable = visibleRows.reduce((s, r) => s + r.payable, 0);
  const visibleProfit = visiblePayout - visiblePayable;
  const isAllLoaded = visibleCount >= filteredRows.length;

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
    setComponentType("all");
    setFromDate("");
    setToDate("");
    setFromDateObj(undefined);
    setToDateObj(undefined);
    setAgent("");
  };

  // -------------------------------------------------
  // PAY NOW HANDLERS
  // -------------------------------------------------
  const handleOpenPayNow = (row: AccountRow) => {
    setSelectedRow(row);
    setPaymentAmount(row.payable > 0 ? String(row.payable) : "");
    setPayNowError(null);
    setPayNowOpen(true);
  };

  const handleClosePayNow = () => {
    if (payNowLoading) return;
    setPayNowOpen(false);
    setSelectedRow(null);
    setPaymentAmount("");
    setPayNowError(null);
  };

  const handleSubmitPayNow = async () => {
    if (!selectedRow) return;

    const amountNum = Number(paymentAmount);
    if (!paymentAmount || Number.isNaN(amountNum) || amountNum <= 0) {
      setPayNowError("Please enter a valid positive amount.");
      return;
    }
    if (amountNum > selectedRow.payable) {
      setPayNowError(
        `Amount cannot be more than payable (${formatINR(selectedRow.payable)}).`,
      );
      return;
    }

    setPayNowLoading(true);
    setPayNowError(null);

    try {
      await api("/accounts-manager/pay", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          accountsDetailId: selectedRow.id,
          componentType: selectedRow.componentType,
          vendorId: selectedRow.vendorId,
          vehicleId: selectedRow.vehicleId,
          routeDate: selectedRow.routeDate,
          amount: amountNum,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // refresh list with same filters
      const data = await fetchAccountsFromApi({
        status: activeTab,
        quoteId: quoteIdFilter,
        componentType,
        fromDate,
        toDate,
        agent,
        search,
      });
      setRows(data);

      handleClosePayNow();
    } catch (err) {
      console.error("Pay Now failed:", err);
      setPayNowError("Payment failed. Please try again.");
    } finally {
      setPayNowLoading(false);
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
            {/* Quote ID */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">Quote ID</Label>
              <Input
                placeholder="Enter the Quote ID"
                value={quoteIdFilter}
                onChange={(e) => setQuoteIdFilter(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Component Type */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">Component Type</Label>
              <Select
                value={componentType}
                onValueChange={(v) => setComponentType(v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
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
                <Select value={agent} onValueChange={(v) => setAgent(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Static options – backend will filter using "agent" param */}
                    <SelectItem value="agent1">Agent 1</SelectItem>
                    <SelectItem value="agent2">Agent 2</SelectItem>
                    <SelectItem value="agent3">Agent 3</SelectItem>
                    <SelectItem value="agent4">Agent 4</SelectItem>
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

        {/* SCROLL TABLE */}
        <div
          ref={scrollRef}
          className="max-h-[460px] overflow-y-auto border-t border-[#f3e0ff]"
        >
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-[#fbf2ff]">
                <TableHead className="text-xs text-[#4a4260]">QUOTE ID</TableHead>
                <TableHead className="text-xs text-[#4a4260]">ACTION</TableHead>
                <TableHead className="text-xs text-[#4a4260]">
                  HOTEL NAME
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs">
                    Loading records…
                  </TableCell>
                </TableRow>
              ) : visibleRows.length ? (
                visibleRows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-[#fff7ff]">
                    <TableCell className="text-sm text-[#7b6b99]">
                      {row.quoteId}
                    </TableCell>
                    <TableCell>
                      <Button
                        className="h-7 bg-[#f6ecff] hover:bg-[#f6ecff] text-[#7c2f9a] px-4 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleOpenPayNow(row)}
                        disabled={row.status !== "due" || row.payable <= 0}
                      >
                        {row.status === "paid" ? "Paid" : "Pay Now"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-[#4a4260]">
                      {row.hotelName}
                    </TableCell>
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs">
                    No records found
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                (visibleCount < filteredRows.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-xs">
                      Loading more…
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-xs">
                      All rows loaded
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
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

      {/* PAY NOW MODAL */}
      <Dialog open={payNowOpen} onOpenChange={(open) => (open ? null : handleClosePayNow())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Now</DialogTitle>
            <DialogDescription>
              Confirm payout details and enter the amount to be paid.
            </DialogDescription>
          </DialogHeader>

          {selectedRow && (
            <div className="space-y-3 mt-2">
              <div className="text-sm">
                <div>
                  <span className="font-semibold">Quote ID:</span>{" "}
                  {selectedRow.quoteId}
                </div>
                <div>
                  <span className="font-semibold">Component:</span>{" "}
                  {selectedRow.componentType || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Name:</span>{" "}
                  {selectedRow.hotelName}
                </div>
                {selectedRow.routeDate && (
                  <div>
                    <span className="font-semibold">Route Date:</span>{" "}
                    {selectedRow.routeDate}
                  </div>
                )}
                {selectedRow.vehicleId && (
                  <div>
                    <span className="font-semibold">Vehicle ID:</span>{" "}
                    {selectedRow.vehicleId}
                  </div>
                )}
                {selectedRow.vendorId && (
                  <div>
                    <span className="font-semibold">Vendor ID:</span>{" "}
                    {selectedRow.vendorId}
                  </div>
                )}
                <div className="mt-2">
                  <span className="font-semibold">Payable:</span>{" "}
                  {formatINR(selectedRow.payable)}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Payment Amount</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-9"
                />
              </div>

              {payNowError && (
                <p className="text-xs text-red-600">{payNowError}</p>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={handleClosePayNow}
              disabled={payNowLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayNow}
              disabled={payNowLoading || !selectedRow}
              className="bg-[#f057b8] hover:bg-[#e348aa] text-white"
            >
              {payNowLoading ? "Processing…" : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

// ------------------------------------------------------
// 🔌 REAL API LAYER — uses shared api() and query params
// ------------------------------------------------------
async function fetchAccountsFromApi(params: {
  status: "all" | "paid" | "due";
  quoteId: string;
  componentType: string;
  fromDate: string; // DD/MM/YYYY
  toDate: string; // DD/MM/YYYY
  agent: string;
  search: string;
}): Promise<AccountRow[]> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set("status", params.status);
  if (params.quoteId?.trim()) searchParams.set("quoteId", params.quoteId.trim());
  if (params.componentType) searchParams.set("componentType", params.componentType);
  if (params.fromDate) searchParams.set("fromDate", params.fromDate);
  if (params.toDate) searchParams.set("toDate", params.toDate);
  if (params.agent) searchParams.set("agent", params.agent);
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  const path = query ? `/accounts-manager?${query}` : "/accounts-manager";

  const data = await api(path, { method: "GET", auth: true });
  return data as AccountRow[];
}

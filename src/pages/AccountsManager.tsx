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

type AccountRow = {
  id: number;
  quoteId: string;
  hotelName: string;
  amount: number;
  payout: number;
  payable: number;
  status: "all" | "paid" | "due";
  componentType?: "hotel" | "flight" | "vehicle";
  agent?: string;
  startDate?: string; // DD/MM/YYYY
  endDate?: string; // DD/MM/YYYY
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
          Math.min(prev + 20, filteredRows.length || prev)
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
          <p className="text-sm text-[#8a7da5] mb-1">Total Profit</p>
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
                      <Button className="h-7 bg-[#f6ecff] hover:bg-[#f6ecff] text-[#7c2f9a] px-4 rounded-md text-xs font-medium">
                        Pay Now
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
// 🔌 FAKE API LAYER — now uses DD/MM/YYYY like LatestItinerary
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
  await new Promise((r) => setTimeout(r, 150));
  const all = makeMock();
  return all.filter((row) => {
    if (params.status !== "all" && row.status !== params.status) return false;
    if (params.quoteId && !row.quoteId.includes(params.quoteId)) return false;
    if (params.componentType !== "all") {
      if (row.componentType !== params.componentType) return false;
    }
    if (params.agent && row.agent !== params.agent) return false;
    if (params.search) {
      const s = params.search.toLowerCase();
      if (
        !row.quoteId.toLowerCase().includes(s) &&
        !row.hotelName.toLowerCase().includes(s)
      ) {
        return false;
      }
    }

    // date filters – same logic as LatestItinerary: just match prefix
    if (params.fromDate && row.startDate) {
      if (!row.startDate.startsWith(params.fromDate)) {
        // also allow range-like: we just do lexicographic compare on dd/mm/yyyy
        if (toComparable(row.startDate) < toComparable(params.fromDate)) {
          return false;
        }
      }
    }
    if (params.toDate && row.endDate) {
      if (!row.endDate.startsWith(params.toDate)) {
        if (toComparable(row.endDate) > toComparable(params.toDate)) {
          return false;
        }
      }
    }

    return true;
  });
}

// convert DD/MM/YYYY -> YYYYMMDD (for simple compare)
function toComparable(ddmmyyyy: string) {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}${m}${d}`;
}

// create 200 mock rows – with DD/MM/YYYY dates
function makeMock(): AccountRow[] {
  const hotels = [
    "COUNTRY CLUB BEACH RESORT",
    "DVI HOLIDAYS PREMIUM",
    "LE MERIDIEN KOCHI",
    "GINGER CHENNAI",
    "THE PARK HYDERABAD",
  ];
  const componentTypes: Array<"hotel" | "flight" | "vehicle"> = [
    "hotel",
    "flight",
    "vehicle",
  ];
  const agents = ["agent1", "agent2", "agent3", "agent4", ""];
  const rows: AccountRow[] = [];
  for (let i = 1; i <= 200; i++) {
    const hotel = hotels[i % hotels.length];
    const amt = 3500 + (i % 7) * 1250;
    const isPaid = i % 4 === 0;
    const payout = isPaid ? amt : 0;
    const payable = isPaid ? 0 : amt;
    const cType = componentTypes[i % componentTypes.length];
    const agent = agents[i % agents.length];

    // spread in Oct 2025 as DD/MM/YYYY
    const day = ((i % 28) + 1).toString().padStart(2, "0");
    const startDate = `${day}/10/2025`;
    const endDay = Math.min(Number(day) + 2, 28).toString().padStart(2, "0");
    const endDate = `${endDay}/10/2025`;

    rows.push({
      id: i,
      quoteId: `DVI0${520256 + i}`,
      hotelName: hotel,
      amount: amt,
      payout,
      payable,
      status: isPaid ? "paid" : "due",
      componentType: cType,
      agent,
      startDate,
      endDate,
    });
  }
  return rows;
}

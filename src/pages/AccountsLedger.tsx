// src/pages/AccountsLedger.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Calendar as CalendarIcon } from "lucide-react";

// ✅ shadcn components (same as AccountsManager / LatestItinerary)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(v);

type ComponentType =
  | "all"
  | "guide"
  | "hotspot"
  | "activity"
  | "hotel"
  | "vehicle"
  | "agent";

type LedgerRow = {
  id: number;
  bookingId: string;
  componentType: ComponentType;
  agentName: string;
  branch?: string;
  vehicle?: string;
  vehicleVendor?: string;
  guideName?: string;
  hotspotName?: string;
  activityName?: string;
  hotelName?: string;
  totalBilled: number;
  totalReceived: number;
  totalReceivable: number;
  totalPaid: number;
  totalBalance: number;
  guest: string;
  arrival: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};

const GUIDE_NAMES = [
  "All",
  "John Guide",
  "Maria Guide",
  "Local Guide 1",
  "Local Guide 2",
];
const HOTSPOT_NAMES = [
  "All",
  "Kapaleeshwarar Temple",
  "Marina Beach",
  "Fort St.George Museum",
  "Government Museum Chennai",
  "Santhome Cathedral",
];
const ACTIVITY_NAMES = [
  "All",
  "Boating @ Alleppey",
  "Jungle Trek",
  "City Tour",
  "Kovalam Beach Day",
];
const HOTEL_NAMES = [
  "All",
  "HOTEL ULTIMATE",
  "GEM PARK",
  "STERLING OOTY FERN HILL",
  "STERLING OOTY ELK HILL",
  "Yantra Resort by Spree Hotels",
];
const VEHICLE_BRANCHES = ["All", "Chennai", "Trichy", "Cochin", "Bangalore"];
const VEHICLE_NAMES = [
  "All",
  "Innova",
  "Tempo Traveller 12",
  "Sedan",
  "Etios",
  "Crysta",
];
const VEHICLE_VENDORS = [
  "All",
  "DVI-MYSORE",
  "DVI-TIRUPATI",
  "DVI-TRICHY",
  "DVI-COCHIN",
  "DVI-CHENNAI",
  "DVI-BANGALORE",
];
const AGENTS = [
  "All",
  "sandeep - NA",
  "Ariyappan - Ariya Company",
  "Uma - NA",
  "Sunil - NA",
  "Dvi - NA",
];

// ──────────────────────────────────────────────
// small utils
// ──────────────────────────────────────────────
function formatToDDMMYYYY(date: Date | undefined) {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function ddmmyyyyToIso(d: string): string {
  // "03/10/2025" -> "2025-10-03"
  if (!d) return "";
  const [day, month, year] = d.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month}-${day}`;
}

// ──────────────────────────────────────────────
// 🔌 MOCK API  (same behaviour, but now dates come as DD/MM/YYYY from UI)
// ──────────────────────────────────────────────
async function fetchLedgerFromApi(params: {
  quoteId: string;
  componentType: ComponentType;
  fromDate: string; // DD/MM/YYYY
  toDate: string; // DD/MM/YYYY
  guideName: string;
  hotspotName: string;
  activityName: string;
  hotelName: string;
  branch: string;
  vehicle: string;
  vehicleVendor: string;
  agentName: string;
}): Promise<LedgerRow[]> {
  await new Promise((r) => setTimeout(r, 120));

  // convert to ISO for compare
  const fromIso = ddmmyyyyToIso(params.fromDate);
  const toIso = ddmmyyyyToIso(params.toDate);

  const result: LedgerRow[] = [];

  // 1) agent component
  if (params.componentType === "agent") {
    const bigCount = 200;
    for (let i = 1; i <= bigCount; i++) {
      const billed = 270000 + (i % 7) * 3500;
      const received = Math.floor(billed * 0.3) + (i % 5) * 1200;
      const receivable = billed - received;
      result.push({
        id: i,
        bookingId: "DVI09202555",
        componentType: "agent",
        agentName: "sandeep - NA",
        totalBilled: billed,
        totalReceived: received,
        totalReceivable: receivable,
        totalPaid: 0,
        totalBalance: receivable,
        guest: i % 2 === 0 ? "Mr. Ramesh & Family" : "Corporate Guest",
        arrival: i % 3 === 0 ? "Chennai Airport" : "Cochin Airport",
        startDate: "2025-10-03",
        endDate: "2025-11-02",
      });
    }

    const lightAgents = [
      "Ariyappan - Ariya Company",
      "Uma - NA",
      "Sunil - NA",
      "Dvi - NA",
    ];
    let id = bigCount + 1;
    for (const a of lightAgents) {
      const count = a === "Ariyappan - Ariya Company" ? 30 : 5;
      for (let j = 0; j < count; j++) {
        const billed = 180000 + (j % 5) * 3500;
        const received = Math.floor(billed * 0.4);
        const receivable = billed - received;
        result.push({
          id: id++,
          bookingId: "DVI09202555",
          componentType: "agent",
          agentName: a,
          totalBilled: billed,
          totalReceived: received,
          totalReceivable: receivable,
          totalPaid: 0,
          totalBalance: receivable,
          guest: "Guest / " + a,
          arrival: "Chennai Airport",
          startDate: "2025-10-10",
          endDate: "2025-10-15",
        });
      }
    }
  }

  // 2) vehicle component
  if (params.componentType === "vehicle") {
    let id = 1;
    const branches = ["Chennai", "Cochin", "Bangalore", "Trichy"];
    const vehicles = ["Innova", "Sedan", "Crysta", "Tempo Traveller 12"];
    const vendors = [
      "DVI-CHENNAI",
      "DVI-COCHIN",
      "DVI-BANGALORE",
      "DVI-TRICHY",
    ];
    for (let i = 0; i < 60; i++) {
      const b = branches[i % branches.length];
      const v = vehicles[i % vehicles.length];
      const vendor = vendors[i % vendors.length];
      const billed = 5000 + (i % 5) * 1500;
      const received = Math.floor(billed * 0.6);
      const receivable = billed - received;
      result.push({
        id: id++,
        bookingId: "DVI02025156", // default you wanted
        componentType: "vehicle",
        agentName: "sandeep - NA",
        branch: b,
        vehicle: v,
        vehicleVendor: vendor,
        totalBilled: billed,
        totalReceived: received,
        totalReceivable: receivable,
        totalPaid: 0,
        totalBalance: receivable,
        guest: "Vehicle Guest",
        arrival: "Cochin Airport",
        startDate: "2025-10-01",
        endDate: "2025-10-03",
      });
    }
  }

  // 3) small sets for other components
  if (params.componentType === "guide") {
    result.push({
      id: 1,
      bookingId: "DVI02025156",
      componentType: "guide",
      agentName: "sandeep - NA",
      guideName: "John Guide",
      totalBilled: 8000,
      totalReceived: 5000,
      totalReceivable: 3000,
      totalPaid: 0,
      totalBalance: 3000,
      guest: "City Guest",
      arrival: "Chennai Airport",
      startDate: "2025-10-12",
      endDate: "2025-10-13",
    });
  }
  if (params.componentType === "hotel") {
    result.push({
      id: 1,
      bookingId: "DVI02025156",
      componentType: "hotel",
      agentName: "sandeep - NA",
      hotelName: "HOTEL ULTIMATE",
      totalBilled: 25000,
      totalReceived: 20000,
      totalReceivable: 5000,
      totalPaid: 0,
      totalBalance: 5000,
      guest: "Hotel Guest",
      arrival: "Cochin Airport",
      startDate: "2025-10-05",
      endDate: "2025-10-08",
    });
  }

  // final filter like real API
  return result.filter((row) => {
    if (params.componentType !== "all" && row.componentType !== params.componentType) {
      return false;
    }

    if (params.quoteId && !row.bookingId.includes(params.quoteId)) {
      return false;
    }

    if (params.componentType === "agent") {
      if (params.agentName !== "All" && row.agentName !== params.agentName) {
        return false;
      }
    }

    if (params.componentType === "vehicle") {
      if (params.branch !== "All" && row.branch !== params.branch) return false;
      if (params.vehicle !== "All" && row.vehicle !== params.vehicle) return false;
      if (params.vehicleVendor !== "All" && row.vehicleVendor !== params.vehicleVendor)
        return false;
    }

    if (params.componentType === "guide") {
      if (params.guideName !== "All" && row.guideName !== params.guideName) return false;
    }
    if (params.componentType === "hotspot") {
      if (params.hotspotName !== "All" && row.hotspotName !== params.hotspotName)
        return false;
    }
    if (params.componentType === "activity") {
      if (params.activityName !== "All" && row.activityName !== params.activityName)
        return false;
    }
    if (params.componentType === "hotel") {
      if (params.hotelName !== "All" && row.hotelName !== params.hotelName) return false;
    }

    // date
    if (fromIso && row.startDate < fromIso) return false;
    if (toIso && row.endDate > toIso) return false;

    return true;
  });
}

// ──────────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────────
export const AccountsLedger: React.FC = () => {
  // 👇 now all typed
  const [quoteId, setQuoteId] = useState<string>("");

  const [componentType, setComponentType] = useState<ComponentType>("vehicle");

  // we store both: real Date (for calendar) + string (DD/MM/YYYY) for button
  const [fromDateObj, setFromDateObj] = useState<Date | undefined>(
    new Date("2025-10-03")
  );
  const [toDateObj, setToDateObj] = useState<Date | undefined>(
    new Date("2025-11-02")
  );
  const [fromDate, setFromDate] = useState<string>("03/10/2025");
  const [toDate, setToDate] = useState<string>("02/11/2025");

  // conditional fields
  const [guideName, setGuideName] = useState<string>("All");
  const [hotspotName, setHotspotName] = useState<string>("All");
  const [activityName, setActivityName] = useState<string>("All");
  const [hotelName, setHotelName] = useState<string>("All");

  // vehicle layout
  const [branch, setBranch] = useState<string>("All");
  const [vehicle, setVehicle] = useState<string>("All");
  const [vehicleVendor, setVehicleVendor] = useState<string>("All");

  // agent filter
  const [agentName, setAgentName] = useState<string>("sandeep - NA");

  // fetched rows
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // infinite scroll
  const [visibleCount, setVisibleCount] = useState<number>(25);
  const listRef = useRef<HTMLDivElement | null>(null);

  // fetch when filters change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchLedgerFromApi({
        quoteId,
        componentType,
        fromDate,
        toDate,
        guideName,
        hotspotName,
        activityName,
        hotelName,
        branch,
        vehicle,
        vehicleVendor,
        agentName,
      });
      if (!cancelled) {
        setRows(data);
        setVisibleCount(25);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    quoteId,
    componentType,
    fromDate,
    toDate,
    guideName,
    hotspotName,
    activityName,
    hotelName,
    branch,
    vehicle,
    vehicleVendor,
    agentName,
  ]);

  const totals = useMemo(() => {
    const billed = rows.reduce((s, r) => s + r.totalBilled, 0);
    const received = rows.reduce((s, r) => s + r.totalReceived, 0);
    const receivable = rows.reduce((s, r) => s + r.totalReceivable, 0);
    const paid = rows.reduce((s, r) => s + r.totalPaid, 0);
    const balance = rows.reduce((s, r) => s + r.totalBalance, 0);
    return { billed, received, receivable, paid, balance };
  }, [rows]);

  // infinite scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 150) {
        setVisibleCount((prev) => Math.min(prev + 25, rows.length));
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [rows.length]);

  const handleClear = () => {
    setQuoteId("");
    setComponentType("vehicle");
    setFromDate("03/10/2025");
    setToDate("02/11/2025");
    setFromDateObj(new Date("2025-10-03"));
    setToDateObj(new Date("2025-11-02"));
    setGuideName("All");
    setHotspotName("All");
    setActivityName("All");
    setHotelName("All");
    setBranch("All");
    setVehicle("All");
    setVehicleVendor("All");
    setAgentName("All");
  };

  const renderRightFieldRow1 = () => {
    switch (componentType) {
      case "vehicle":
        return (
          <div className="space-y-2">
            <Label className="text-sm text-[#4a4260]">Vendor</Label>
            <Select
              value={vehicleVendor}
              onValueChange={(v) => setVehicleVendor(v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_VENDORS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "agent":
        return (
          <div className="space-y-2">
            <Label className="text-sm text-[#4a4260]">Agent</Label>
            <Select value={agentName} onValueChange={(v) => setAgentName(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {AGENTS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "guide":
        return (
          <div className="space-y-2">
            <Label className="text-sm text-[#4a4260]">Guide Name</Label>
            <Select value={guideName} onValueChange={(v) => setGuideName(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {GUIDE_NAMES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "hotspot":
        return (
          <div className="space-y-2">
            <Label className="text-sm text-[#4a4260]">Hotspot Name</Label>
            <Select value={hotspotName} onValueChange={(v) => setHotspotName(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {HOTSPOT_NAMES.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "activity":
        return (
          <div className="space-y-2">
            <Label className="text-sm text-[#4a4260]">Activity Name</Label>
            <Select value={activityName} onValueChange={(v) => setActivityName(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_NAMES.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "hotel":
        return (
          <div className="space-y-2">
            <Label className="text-sm text-[#4a4260]">Hotel Name</Label>
            <Select value={hotelName} onValueChange={(v) => setHotelName(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {HOTEL_NAMES.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fbeef8] p-4 md:p-6">
     
      {/* FILTER CARD */}
      <div className="bg-[#fefefe]/40 rounded-xl border border-[#f6dfff] mb-5">
        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-[#4a4260] mb-4">FILTER</p>

          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Quote ID */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">Quote ID</Label>
              <Input
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
                placeholder="Enter the Quote ID"
                className="h-9"
              />
            </div>

            {/* Component Type */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">Component Type</Label>
              <Select
                value={componentType}
                onValueChange={(v) => setComponentType(v as ComponentType)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Component" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="hotspot">Hotspot</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date (same style as AccountsManager) */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start h-9 text-left font-normal ${
                      !fromDate ? "text-muted-foreground" : ""
                    } bg-white border border-[#f0d8ff] text-[#4a4260]`}
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

            {/* To Date (same style) */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start h-9 text-left font-normal ${
                      !toDate ? "text-muted-foreground" : ""
                    } bg-white border border-[#f0d8ff] text-[#4a4260]`}
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

            {/* right dynamic field */}
            {renderRightFieldRow1()}
          </div>

          {/* ROW 2 — VEHICLE */}
          {componentType === "vehicle" && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mt-4">
              {/* Branch */}
              <div className="space-y-2">
                <Label className="text-sm text-[#4a4260]">Branch</Label>
                <Select value={branch} onValueChange={(v) => setBranch(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_BRANCHES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle */}
              <div className="space-y-2">
                <Label className="text-sm text-[#4a4260]">Vehicle</Label>
                <Select value={vehicle} onValueChange={(v) => setVehicle(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_NAMES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* spacer */}
              <div className="hidden md:block md:col-span-2" />

              {/* Clear */}
              <div className="flex md:justify-end">
                <Button
                  onClick={handleClear}
                  className="h-9 px-6 bg-[#f057b8] hover:bg-[#df43a6] text-white text-sm font-medium"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* NON vehicle clear */}
          {componentType !== "vehicle" && (
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleClear}
                className="h-9 px-6 bg-[#f057b8] hover:bg-[#df43a6] text-white text-sm font-medium"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Billed</p>
          <p className="text-xl font-semibold text-[#3d3551]">
            {formatINR(totals.billed)}
          </p>
        </div>
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Received</p>
          <p className="text-xl font-semibold text-[#3d3551]">
            {formatINR(totals.received)}
          </p>
        </div>
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Receivable</p>
          <p className="text-xl font-semibold text-[#3d3551]">
            {formatINR(totals.receivable)}
          </p>
        </div>
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Paid</p>
          <p className="text-xl font-semibold text-[#3d3551]">
            {formatINR(totals.paid)}
          </p>
        </div>
        <div className="bg-white rounded-md shadow-sm py-4 px-5">
          <p className="text-sm text-[#8a7da5] mb-1">Total Balance</p>
          <p className="text-xl font-semibold text-[#10a037]">
            {formatINR(totals.balance)}
          </p>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white/70 rounded-xl border border-[#f6dfff]">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <p className="text-sm font-semibold text-[#4a4260]">List of Agent</p>
          <Button className="h-9 px-4 gap-2 rounded-md bg-[#e5fff1] border border-[#b7f7d9] text-[#0f9c34] text-sm flex items-center">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <div
          ref={listRef}
          className="max-h-[460px] overflow-y-auto border-t border-[#f3e0ff]"
        >
          <table className="min-w-full text-sm">
            <thead className="bg-[#fbf2ff] sticky top-0 z-10">
              <tr>
                <th className="text-left px-6 py-3 text-xs text-[#4a4260]">
                  BOOKING ID
                </th>
                <th className="text-left px-3 py-3 text-xs text-[#4a4260]">
                  AGENT NAME
                </th>
                <th className="text-right px-3 py-3 text-xs text-[#4a4260]">
                  TOTAL BILLED
                </th>
                <th className="text-right px-3 py-3 text-xs text-[#4a4260]">
                  TOTAL RECEIVED
                </th>
                <th className="text-right px-3 py-3 text-xs text-[#4a4260]">
                  TOTAL RECEIVABLE
                </th>
                <th className="text-right px-3 py-3 text-xs text-[#4a4260]">
                  TOTAL PAID
                </th>
                <th className="text-right px-3 py-3 text-xs text-[#4a4260]">
                  TOTAL BALANCE
                </th>
                <th className="text-left px-3 py-3 text-xs text-[#4a4260]">
                  GUEST
                </th>
                <th className="text-left px-3 py-3 text-xs text-[#4a4260]">
                  ARRIVAL
                </th>
                <th className="text-left px-3 py-3 text-xs text-[#4a4260]">
                  START DATE
                </th>
                <th className="text-left px-3 py-3 text-xs text-[#4a4260]">
                  END DATE
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-xs">
                    Loading records…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-16 text-[#f4008f] text-sm"
                  >
                    No data Found
                  </td>
                </tr>
              ) : (
                rows.slice(0, visibleCount).map((row) => (
                  <tr key={row.id} className="hover:bg-[#fff7ff]">
                    <td className="px-6 py-2 text-[#7032c8] font-medium">
                      {row.bookingId}
                    </td>
                    <td className="px-3 py-2 text-[#4a4260]">
                      {row.agentName}
                    </td>
                    <td className="px-3 py-2 text-right text-[#4a4260]">
                      {formatINR(row.totalBilled)}
                    </td>
                    <td className="px-3 py-2 text-right text-[#4a4260]">
                      {formatINR(row.totalReceived)}
                    </td>
                    <td className="px-3 py-2 text-right text-[#4a4260]">
                      {formatINR(row.totalReceivable)}
                    </td>
                    <td className="px-3 py-2 text-right text-[#4a4260]">
                      {formatINR(row.totalPaid)}
                    </td>
                    <td className="px-3 py-2 text-right text-[#4a4260]">
                      {formatINR(row.totalBalance)}
                    </td>
                    <td className="px-3 py-2 text-[#4a4260]">{row.guest}</td>
                    <td className="px-3 py-2 text-[#4a4260]">{row.arrival}</td>
                    <td className="px-3 py-2 text-[#4a4260]">
                      {row.startDate}
                    </td>
                    <td className="px-3 py-2 text-[#4a4260]">{row.endDate}</td>
                  </tr>
                ))
              )}

              {!loading &&
                rows.length > 0 &&
                visibleCount < rows.length && (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-xs">
                      Loading more…
                    </td>
                  </tr>
                )}

              {!loading &&
                rows.length > 0 &&
                visibleCount >= rows.length && (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-xs">
                      All rows loaded
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <div className="py-4 text-center text-xs text-[#a593c7]">
          DVI Holidays @ 2025
        </div>
      </div>
    </div>
  );
};

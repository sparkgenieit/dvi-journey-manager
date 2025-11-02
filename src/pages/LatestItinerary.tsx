// src/pages/LatestItinerary.tsx
import React, { useEffect, useState } from "react";
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
import { Download, Eye, Copy, Calendar as CalendarIcon } from "lucide-react";

// 👇 these two must exist (you already have them in src/components/ui/)
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// ------------------------------------------------------------------
// small local util (no date-fns)
// ------------------------------------------------------------------
function formatToDDMMYYYY(date: Date | undefined) {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// ------------------------------------------------------------------
// MOCK DATA SOURCE  (replace with real API later)
// ------------------------------------------------------------------
const BASE_ROWS = [
  {
    quoteId: "DVI2025102",
    arrival: "Madurai Airport",
    departure: "Trivandrum, Domestic Airport",
    createdBy: "admindvi",
    startDate: "20/10/2025 12:00 PM",
    endDate: "24/10/2025 12:00 PM",
    createdOn: "Wed, Oct 15, 2025",
    nights: 4,
    persons: 2,
  },
  {
    quoteId: "DVI2025101",
    arrival: "Chennai International Airport",
    departure: "Trivandrum, Domestic Airport",
    createdBy: "admindvi",
    startDate: "21/12/2025 12:00 PM",
    endDate: "26/12/2025 12:00 PM",
    createdOn: "Wed, Oct 15, 2025",
    nights: 5,
    persons: 4,
  },
  {
    quoteId: "DVI2050928",
    arrival: "Chennai Domestic Airport",
    departure: "Chennai Domestic Airport",
    createdBy: "admindvi",
    startDate: "05/10/2025 12:00 PM",
    endDate: "09/10/2025 12:00 PM",
    createdOn: "Tue, Sep 23, 2025",
    nights: 4,
    persons: 3,
  },
  {
    quoteId: "DVI2050927",
    arrival: "Cochin Airport",
    departure: "Cochin Airport",
    createdBy: "admindvi",
    startDate: "01/10/2025 12:00 PM",
    endDate: "04/10/2025 12:00 PM",
    createdOn: "Tue, Sep 23, 2025",
    nights: 3,
    persons: 2,
  },
  {
    quoteId: "DVI2050926",
    arrival: "Chennai International Airport",
    departure: "Chennai",
    createdBy: "admindvi",
    startDate: "28/09/2025 12:00 PM",
    endDate: "01/10/2025 12:00 PM",
    createdOn: "Tue, Sep 23, 2025",
    nights: 3,
    persons: 6,
  },
  {
    quoteId: "DVI2050925",
    arrival: "Chennai",
    departure: "Chennai",
    createdBy: "admindvi",
    startDate: "03/10/2025 12:00 PM",
    endDate: "07/10/2025 12:00 PM",
    createdOn: "Tue, Sep 23, 2025",
    nights: 4,
    persons: 5,
  },
];

// build 400 rows to paginate
const buildAllRows = () => {
  const out: any[] = [];
  for (let i = 0; i < 400; i++) {
    const b = BASE_ROWS[i % BASE_ROWS.length];
    out.push({
      ...b,
      id: i + 1,
      quoteId: b.quoteId.replace(/\d+$/, (m) =>
        String(Number(m) + i).padStart(m.length, "0")
      ),
    });
  }
  return out;
};
const ALL_ROWS = buildAllRows();

// this simulates a backend
async function mockFetchItineraries({
  page,
  pageSize,
  search,
  sortField,
  sortDir,
  filters,
}: {
  page: number;
  pageSize: number;
  search: string;
  sortField:
    | "sno"
    | "quoteId"
    | "arrival"
    | "departure"
    | "createdBy"
    | "startDate"
    | "endDate"
    | "createdOn"
    | "nights"
    | "persons";
  sortDir: "asc" | "desc";
  filters: {
    origin: string;
    destination: string;
    agentName: string;
    agentStaff: string;
    startDate: string;
    endDate: string;
  };
}) {
  // 1) filter
  let rows = ALL_ROWS.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      r.quoteId.toLowerCase().includes(q) ||
      r.arrival.toLowerCase().includes(q) ||
      r.departure.toLowerCase().includes(q);

    const matchesOrigin = !filters.origin || r.arrival === filters.origin;
    const matchesDest = !filters.destination || r.departure === filters.destination;
    const matchesAgent = !filters.agentName || r.createdBy === filters.agentName;

    // date filter: we only compare DD/MM/YYYY prefix
    const matchesStart =
      !filters.startDate || r.startDate.startsWith(filters.startDate);
    const matchesEnd = !filters.endDate || r.endDate.startsWith(filters.endDate);

    return (
      matchesSearch &&
      matchesOrigin &&
      matchesDest &&
      matchesAgent &&
      matchesStart &&
      matchesEnd
    );
  });

  // 2) sort (server side)
  rows = rows.sort((a: any, b: any) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "sno") return (a.id - b.id) * dir;
    if (sortField === "nights" || sortField === "persons")
      return (a[sortField] - b[sortField]) * dir;
    return a[sortField].toString().localeCompare(b[sortField].toString()) * dir;
  });

  const total = rows.length;

  // 3) pagination
  const start = (page - 1) * pageSize;
  const data = rows.slice(start, start + pageSize);

  // 4) dropdowns (also from API)
  const dropdowns = {
    origins: [
      "Madurai Airport",
      "Chennai International Airport",
      "Chennai Domestic Airport",
      "Cochin Airport",
    ],
    destinations: [
      "Trivandrum, Domestic Airport",
      "Chennai",
      "Cochin Airport",
      "Chennai Domestic Airport",
    ],
    agents: ["admindvi", "agent1", "agent2"],
    staffs: ["staff1", "staff2", "staff3"],
  };

  // simulate network
  await new Promise((res) => setTimeout(res, 80));

  return {
    data,
    total,
    dropdowns,
  };
}

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------
export const LatestItinerary = () => {
  // table state
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // ui state
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // dropdown options from API
  const [origins, setOrigins] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [staffs, setStaffs] = useState<string[]>([]);

  // date objects for calendar
  const [startDateObj, setStartDateObj] = useState<Date | undefined>(undefined);
  const [endDateObj, setEndDateObj] = useState<Date | undefined>(undefined);

  // filters -> to be sent to API
  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    agentName: "",
    agentStaff: "",
    startDate: "",
    endDate: "",
  });

  // sort (server side)
  const [sortConfig, setSortConfig] = useState<{
    field:
      | "sno"
      | "quoteId"
      | "arrival"
      | "departure"
      | "createdBy"
      | "startDate"
      | "endDate"
      | "createdOn"
      | "nights"
      | "persons";
    dir: "asc" | "desc";
  }>({
    field: "sno",
    dir: "asc",
  });

  // fetch whenever deps change
  useEffect(() => {
    const load = async () => {
      const res = await mockFetchItineraries({
        page: currentPage,
        pageSize: Number(entriesPerPage),
        search: searchQuery,
        sortField: sortConfig.field,
        sortDir: sortConfig.dir,
        filters: {
          origin: filters.origin,
          destination: filters.destination,
          agentName: filters.agentName,
          agentStaff: filters.agentStaff,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      });

      setRows(res.data);
      setTotal(res.total);

      // set dropdowns
      setOrigins(res.dropdowns.origins);
      setDestinations(res.dropdowns.destinations);
      setAgents(res.dropdowns.agents);
      setStaffs(res.dropdowns.staffs);
    };

    load();
  }, [
    currentPage,
    entriesPerPage,
    searchQuery,
    sortConfig,
    filters.origin,
    filters.destination,
    filters.agentName,
    filters.agentStaff,
    filters.startDate,
    filters.endDate,
  ]);

  const totalPages =
    total === 0 ? 1 : Math.ceil(total / Number(entriesPerPage));

  const handleChangePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const MAX = 5;
    if (totalPages <= MAX + 1) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = 1; i <= MAX; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const toggleSort = (
    field:
      | "sno"
      | "quoteId"
      | "arrival"
      | "departure"
      | "createdBy"
      | "startDate"
      | "endDate"
      | "createdOn"
      | "nights"
      | "persons"
  ) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        const nextDir = prev.dir === "asc" ? "desc" : "asc";
        return { field, dir: nextDir };
      }
      return { field, dir: "asc" };
    });
    // new sort = go to page 1
    setCurrentPage(1);
  };

  const renderSortIcon = (field: typeof sortConfig.field) => {
    const active = sortConfig.field === field;
    const up = sortConfig.dir === "asc";
    return (
      <span
        className={`inline-block ml-1 text-[10px] ${
          active ? "text-[#d546ab]" : "text-[#c1b6d4]"
        }`}
      >
        {up ? "▲" : "▼"}
      </span>
    );
  };

  const startItem =
    total === 0 ? 0 : (currentPage - 1) * Number(entriesPerPage) + 1;
  const endItem = Math.min(currentPage * Number(entriesPerPage), total);

  const handleClearFilters = () => {
    setFilters({
      origin: "",
      destination: "",
      agentName: "",
      agentStaff: "",
      startDate: "",
      endDate: "",
    });
    setStartDateObj(undefined);
    setEndDateObj(undefined);
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-full space-y-6">
      {/* FILTER CARD */}
      <Card className="border-none shadow-none bg-white">
        <CardContent className="pt-6">
          <h2 className="text-base font-semibold mb-4 text-[#4a4260]">FILTER</h2>
          {/* 6 fields like PHP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Start Date (calendar) */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start h-9 text-left font-normal ${
                      !filters.startDate ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate || "DD/MM/YYYY"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDateObj}
                    onSelect={(date) => {
                      setStartDateObj(date ?? undefined);
                      const formatted = formatToDDMMYYYY(date ?? undefined);
                      setFilters((p) => ({ ...p, startDate: formatted }));
                      // go to first page when filter changes
                      setCurrentPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date (calendar) */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start h-9 text-left font-normal ${
                      !filters.endDate ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate || "DD/MM/YYYY"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDateObj}
                    onSelect={(date) => {
                      setEndDateObj(date ?? undefined);
                      const formatted = formatToDDMMYYYY(date ?? undefined);
                      setFilters((p) => ({ ...p, endDate: formatted }));
                      setCurrentPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Origin */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">Origin</Label>
              <Select
                value={filters.origin}
                onValueChange={(v) => {
                  setFilters((p) => ({ ...p, origin: v }));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  {origins.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">Destination</Label>
              <Select
                value={filters.destination}
                onValueChange={(v) => {
                  setFilters((p) => ({ ...p, destination: v }));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent Name */}
            <div className="space-y-2">
              <Label className="text-sm text-[#4a4260]">Agent Name</Label>
              <Select
                value={filters.agentName}
                onValueChange={(v) => {
                  setFilters((p) => ({ ...p, agentName: v }));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent Staff + Clear */}
            <div className="space-y-2 flex flex-col gap-2">
              <div>
                <Label className="text-sm text-[#4a4260]">Agent Staff</Label>
                <Select
                  value={filters.agentStaff}
                  onValueChange={(v) => {
                    setFilters((p) => ({ ...p, agentStaff: v }));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choose the Agent Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffs.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleClearFilters}
                className="bg-[#c6c6c6] hover:bg-[#b3b3b3] text-white h-8"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LIST CARD */}
      <Card className="border-none shadow-none bg-white">
        <CardContent className="pt-6 pb-4">
          {/* header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-base md:text-lg font-semibold text-[#4a4260]">
              List of Itinerary{" "}
              <span className="text-[#828282] text-sm">
                (Total Itinerary Count : 17910)
              </span>
            </h2>
            <Button className="bg-gradient-to-r from-[#ae3bd0] to-[#f057b8] hover:from-[#9b31bd] hover:to-[#e048a7]">
              + Add Itinerary
            </Button>
          </div>

          {/* show entries + search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span>Show</span>
              <Select
                value={entriesPerPage}
                onValueChange={(v) => {
                  setEntriesPerPage(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="search" className="text-sm">
                Search:
              </Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-52"
              />
            </div>
          </div>

          {/* table */}
          <div className="overflow-x-auto border rounded-md">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-[#fbf7ff]">
                  <TableHead
                    onClick={() => toggleSort("sno")}
                    className="w-16 text-xs font-medium text-[#4a4260] cursor-pointer select-none"
                  >
                    S.No {renderSortIcon("sno")}
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("quoteId")}
                    className="text-xs font-medium text-[#4a4260] min-w-[220px] cursor-pointer select-none"
                  >
                    Quote ID {renderSortIcon("quoteId")}
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("arrival")}
                    className="text-xs font-medium text-[#4a4260] min-w-[180px] cursor-pointer select-none"
                  >
                    Arrival {renderSortIcon("arrival")}
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("departure")}
                    className="text-xs font-medium text-[#4a4260] min-w-[200px] cursor-pointer select-none"
                  >
                    Departure {renderSortIcon("departure")}
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("createdBy")}
                    className="text-xs font-medium text-[#4a4260] cursor-pointer select-none"
                  >
                    Created By {renderSortIcon("createdBy")}
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("startDate")}
                    className="text-xs font-medium text-[#4a4260] cursor-pointer select-none"
                  >
                    Start Date {renderSortIcon("startDate")}
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("endDate")}
                    className="text-xs font-medium text-[#4a4260] cursor-pointer select-none"
                  >
                    End Date {renderSortIcon("endDate")}
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("createdOn")}
                    className="text-xs font-medium text-[#4a4260] cursor-pointer select-none"
                  >
                    Created On {renderSortIcon("createdOn")}
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("nights")}
                    className="text-xs font-medium text-[#4a4260] cursor-pointer select-none"
                  >
                    Nights &amp; Days {renderSortIcon("nights")}
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("persons")}
                    className="text-xs font-medium text-[#4a4260] cursor-pointer select-none"
                  >
                    No of Person {renderSortIcon("persons")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((itinerary, idx) => (
                  <TableRow key={itinerary.id} className="hover:bg-[#fdf6ff]">
                    <TableCell className="text-sm">
                      {(currentPage - 1) * Number(entriesPerPage) + idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md bg-[#f057b8] flex items-center justify-center text-white">
                          <Eye className="h-4 w-4" />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#343434]"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#343434]"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-[#3b2f55]">
                          {itinerary.quoteId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{itinerary.arrival}</TableCell>
                    <TableCell className="text-sm">{itinerary.departure}</TableCell>
                    <TableCell className="text-sm">{itinerary.createdBy}</TableCell>
                    <TableCell className="text-sm">{itinerary.startDate}</TableCell>
                    <TableCell className="text-sm">{itinerary.endDate}</TableCell>
                    <TableCell className="text-sm">{itinerary.createdOn}</TableCell>
                    <TableCell className="text-sm">
                      {itinerary.nights}N / {itinerary.nights + 1}D
                    </TableCell>
                    <TableCell className="text-sm">{itinerary.persons}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* bottom */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-4">
            <p className="text-sm text-[#4a4260]">
              Showing <span className="font-semibold">{startItem}</span> to{" "}
              <span className="font-semibold">{endItem}</span> of{" "}
              <span className="font-semibold">{total}</span> entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChangePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                Previous
              </Button>
              {getPageNumbers().map((p, i) =>
                typeof p === "number" ? (
                  <Button
                    key={i}
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChangePage(p)}
                    className={
                      p === currentPage
                        ? "bg-[#8b43d1] hover:bg-[#7c37c1] text-white h-8 px-3"
                        : "h-8 px-3"
                    }
                  >
                    {p}
                  </Button>
                ) : (
                  <span key={i} className="px-2 text-sm text-[#6c6c6c]">
                    ...
                  </span>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChangePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Eye, Copy } from "lucide-react";

// Mock data for itineraries
const mockItineraries = [
  {
    id: 1,
    quoteId: "DVI2025102",
    arrival: "Madurai Airport",
    departure: "Trivandrum, Domestic Airport",
    createdBy: "admindvi",
    startDate: "20/10/2025 12:00 PM",
    endDate: "24/10/2025 12:00 PM",
    createdOn: "Wed, Oct 15, 2025",
    nights: 4
  },
  {
    id: 2,
    quoteId: "DVI2025101",
    arrival: "Chennai International Airport",
    departure: "Trivandrum, Domestic Airport",
    createdBy: "admindvi",
    startDate: "21/12/2025 12:00 PM",
    endDate: "26/12/2025 12:00 PM",
    createdOn: "Wed, Oct 15, 2025",
    nights: 5
  },
  {
    id: 3,
    quoteId: "DVI2050928",
    arrival: "Chennai Domestic Airport",
    departure: "Chennai Domestic Airport",
    createdBy: "admindvi",
    startDate: "05/10/2025 12:00 PM",
    endDate: "09/10/2025 12:00 PM",
    createdOn: "Tue, Sep 23, 2025",
    nights: 4
  },
  {
    id: 4,
    quoteId: "DVI2050927",
    arrival: "Cochin Airport",
    departure: "Cochin Airport",
    createdBy: "admindvi",
    startDate: "01/10/2025 12:00 PM",
    endDate: "04/10/2025 12:00 PM",
    createdOn: "Tue, Sep 23, 2025",
    nights: 3
  },
  {
    id: 5,
    quoteId: "DVI2050926",
    arrival: "Chennai International Airport",
    departure: "Chennai",
    createdBy: "admindvi",
    startDate: "28/09/2025 12:00 PM",
    endDate: "01/10/2025 12:00 PM",
    createdOn: "Tue, Sep 23, 2025",
    nights: 3
  },
  {
    id: 6,
    quoteId: "DVI2050925",
    arrival: "Chennai",
    departure: "Chennai",
    createdBy: "admindvi",
    startDate: "03/10/2025 12:00 PM",
    endDate: "07/10/2025 12:00 PM",
    createdOn: "Tue, Sep 23, 2025",
    nights: 4
  },
];

export const LatestItinerary = () => {
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    origin: "",
    destination: "",
    agentName: "",
    agentStaff: ""
  });

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      origin: "",
      destination: "",
      agentName: "",
      agentStaff: ""
    });
  };

  // Filter itineraries based on search
  const filteredItineraries = mockItineraries.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.quoteId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.arrival.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.departure.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">FILTER</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input 
                id="start-date" 
                type="text" 
                placeholder="DD/MM/YYYY"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input 
                id="end-date" 
                type="text" 
                placeholder="DD/MM/YYYY"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>

            {/* Origin */}
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Select value={filters.origin} onValueChange={(value) => setFilters({...filters, origin: value})}>
                <SelectTrigger id="origin">
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="madurai">Madurai Airport</SelectItem>
                  <SelectItem value="chennai">Chennai International Airport</SelectItem>
                  <SelectItem value="cochin">Cochin Airport</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Select value={filters.destination} onValueChange={(value) => setFilters({...filters, destination: value})}>
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trivandrum">Trivandrum</SelectItem>
                  <SelectItem value="chennai">Chennai</SelectItem>
                  <SelectItem value="cochin">Cochin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agent Name */}
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent Name</Label>
              <Select value={filters.agentName} onValueChange={(value) => setFilters({...filters, agentName: value})}>
                <SelectTrigger id="agent-name">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent1">Agent 1</SelectItem>
                  <SelectItem value="agent2">Agent 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agent Staff */}
            <div className="space-y-2">
              <Label htmlFor="agent-staff">Agent Staff</Label>
              <Select value={filters.agentStaff} onValueChange={(value) => setFilters({...filters, agentStaff: value})}>
                <SelectTrigger id="agent-staff">
                  <SelectValue placeholder="Choose the Agent Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff1">Staff 1</SelectItem>
                  <SelectItem value="staff2">Staff 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Button */}
            <div className="flex items-end">
              <Button 
                variant="secondary" 
                className="w-full bg-gray-400 hover:bg-gray-500 text-white"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itinerary List Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                List of Itinerary <span className="text-gray-500">(Total Itinerary Count : 17910)</span>
              </h2>
            </div>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              + Add Itinerary
            </Button>
          </div>

          {/* Entries per page and Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Show</span>
              <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="search" className="text-sm">Search:</Label>
              <Input 
                id="search"
                type="text" 
                className="w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="whitespace-nowrap">S.NO</TableHead>
                    <TableHead className="whitespace-nowrap">QUOTE ID</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[200px]">ARRIVAL</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[200px]">DEPARTURE</TableHead>
                    <TableHead className="whitespace-nowrap">CREATED BY</TableHead>
                    <TableHead className="whitespace-nowrap">START DATE</TableHead>
                    <TableHead className="whitespace-nowrap">END DATE</TableHead>
                    <TableHead className="whitespace-nowrap">CREATED ON</TableHead>
                    <TableHead className="whitespace-nowrap">NIGHTS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItineraries.map((itinerary, index) => (
                    <TableRow key={itinerary.id} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <span className="font-medium">{itinerary.quoteId}</span>
                        </div>
                      </TableCell>
                      <TableCell>{itinerary.arrival}</TableCell>
                      <TableCell>{itinerary.departure}</TableCell>
                      <TableCell>{itinerary.createdBy}</TableCell>
                      <TableCell>{itinerary.startDate}</TableCell>
                      <TableCell>{itinerary.endDate}</TableCell>
                      <TableCell>{itinerary.createdOn}</TableCell>
                      <TableCell>{itinerary.nights}N</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

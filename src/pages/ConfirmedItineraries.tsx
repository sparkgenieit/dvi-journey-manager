import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Eye, ChevronLeft, ChevronRight, Calendar as CalendarIcon, XCircle } from 'lucide-react';
import { ItineraryService } from '@/services/itinerary';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Utility function to format dates
function formatToDDMMYYYY(date: Date | undefined) {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

interface ConfirmedItinerary {
  itinerary_plan_ID: number;
  booking_quote_id: string;
  agent_name: string;
  primary_customer_name: string;
  primary_contact_no: string;
  arrival_location: string;
  departure_location: string;
  arrival_date: string;
  departure_date: string;
  nights: number;
  days: number;
  created_on: string;
  created_by: number;
}

interface Agent {
  id: number;
  name: string;
  staff_name?: string;
}

interface Location {
  value: string;
  label: string;
}

export const ConfirmedItineraries: React.FC = () => {
  const [itineraries, setItineraries] = useState<ConfirmedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);

  // Filter dropdown data
  const [agents, setAgents] = useState<Agent[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Date objects for calendar
  const [startDateObj, setStartDateObj] = useState<Date | undefined>(undefined);
  const [endDateObj, setEndDateObj] = useState<Date | undefined>(undefined);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    origin: '',
    destination: '',
    agentId: '',
    staffId: '',
  });

  // Cancellation state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<ConfirmedItinerary | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Cancellation options
  const [cancellationOptions, setCancellationOptions] = useState({
    selectAll: false,
    modifyHotspot: false,
    modifyHotel: false,
    modifyVehicle: false,
    modifyGuide: false,
    modifyActivity: false,
  });

  // Cancellation result
  const [cancellationResult, setCancellationResult] = useState<any | null>(null);

  const fetchItineraries = async () => {
    setLoading(true);
    try {
      const start = (currentPage - 1) * pageSize;
      
      const response = await ItineraryService.getConfirmedItineraries({
        draw: currentPage,
        start,
        length: pageSize,
        start_date: filters.startDate,
        end_date: filters.endDate,
        source_location: filters.origin,
        destination_location: filters.destination,
        agent_id: filters.agentId ? Number(filters.agentId) : undefined,
        staff_id: filters.staffId ? Number(filters.staffId) : undefined,
      });

      setItineraries(response.data);
      setTotalRecords(response.recordsTotal);
      setFilteredRecords(response.recordsFiltered);
    } catch (error: any) {
      console.error('Failed to fetch confirmed itineraries', error);
      toast.error(error?.message || 'Failed to load confirmed itineraries');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelItinerary = async () => {
    if (!selectedItinerary || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsCancelling(true);
    try {
      const response = await ItineraryService.cancelItinerary({
        itinerary_plan_ID: selectedItinerary.itinerary_plan_ID,
        reason: cancelReason,
        cancellation_percentage: 10,
        cancellation_options: {
          modify_hotspot: cancellationOptions.modifyHotspot,
          modify_hotel: cancellationOptions.modifyHotel,
          modify_vehicle: cancellationOptions.modifyVehicle,
          modify_guide: cancellationOptions.modifyGuide,
          modify_activity: cancellationOptions.modifyActivity,
        },
      });

      // Show result with detailed breakdown
      if (response.data) {
        setCancellationResult(response.data);
        toast.success(`Itinerary cancelled successfully - Ref: ${response.data.cancellation_reference}`);
      } else {
        toast.success('Itinerary cancelled successfully');
        setCancelModalOpen(false);
        resetCancellationState();
        fetchItineraries();
      }
    } catch (error: any) {
      console.error('Failed to cancel itinerary', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel itinerary';
      
      if (error.response?.status === 409) {
        toast.error('This itinerary is already cancelled');
      } else if (error.response?.status === 404) {
        toast.error('Itinerary not found');
      } else if (error.response?.status === 400) {
        toast.error('Missing required fields: reason is required');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const resetCancellationState = () => {
    setCancelReason('');
    setSelectedItinerary(null);
    setCancellationOptions({
      selectAll: false,
      modifyHotspot: false,
      modifyHotel: false,
      modifyVehicle: false,
      modifyGuide: false,
      modifyActivity: false,
    });
    setCancellationResult(null);
  };

  const fetchFilterData = async () => {
    try {
      const [agentsData, locationsData] = await Promise.all([
        ItineraryService.getConfirmedAgents(),
        ItineraryService.getConfirmedLocations(),
      ]);

      setAgents(agentsData);
      setLocations(locationsData);
    } catch (error: any) {
      console.error('Failed to fetch filter data', error);
      toast.error('Failed to load filter options');
    }
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchItineraries();
  }, [currentPage, pageSize]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page
    fetchItineraries();
  };

  const handleClear = () => {
    setFilters({
      startDate: '',
      endDate: '',
      origin: '',
      destination: '',
      agentId: '',
      staffId: '',
    });
    setStartDateObj(undefined);
    setEndDateObj(undefined);
    setCurrentPage(1);
    // Fetch will be triggered by useEffect
    setTimeout(fetchItineraries, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalPages = Math.ceil(filteredRecords / pageSize);

  return (
    <div className="w-full max-w-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[#4a4260]">Confirmed Itineraries</h1>
      </div>

      {/* Filter Card */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-[#4a4260] mb-4">FILTER</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium text-[#6c6c6c] mb-1 block">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
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
                      setFilters((p) => ({
                        ...p,
                        startDate: formatted,
                      }));
                      setCurrentPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#6c6c6c] mb-1 block">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
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
                      setFilters((p) => ({
                        ...p,
                        endDate: formatted,
                      }));
                      setCurrentPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#6c6c6c] mb-1 block">Origin</Label>
              <Select
                value={filters.origin}
                onValueChange={(value) => handleFilterChange('origin', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#6c6c6c] mb-1 block">Destination</Label>
              <Select
                value={filters.destination}
                onValueChange={(value) => handleFilterChange('destination', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#6c6c6c] mb-1 block">Agent Name</Label>
              <Select
                value={filters.agentId}
                onValueChange={(value) => handleFilterChange('agentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#6c6c6c] mb-1 block">Agent Staff</Label>
              <Select
                value={filters.staffId}
                onValueChange={(value) => handleFilterChange('staffId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Staff" />
                </SelectTrigger>
                <SelectContent>
                  {agents
                    .filter((agent) => agent.staff_name)
                    .map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.staff_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              className="bg-[#d546ab] hover:bg-[#c03d9f] text-white"
            >
              Search
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="border-[#6c6c6c] text-[#6c6c6c] hover:bg-gray-50"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-[#4a4260] mb-4">List of Confirmed Itineraries</h2>

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#6c6c6c]">Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
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
              <span className="text-sm text-[#6c6c6c]">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#6c6c6c]">Search:</span>
              <Input
                type="text"
                className="w-48"
                placeholder="Search..."
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6c6c6c]">Loading...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.NO</TableHead>
                      <TableHead>BOOKING/QUOTE ID</TableHead>
                      <TableHead>ACTION</TableHead>
                      <TableHead>CREATED BY</TableHead>
                      <TableHead>CREATED ON</TableHead>
                      <TableHead>ARRIVAL</TableHead>
                      <TableHead>DEPARTURE</TableHead>
                      <TableHead>NIGHTS & DAYS</TableHead>
                      <TableHead>START DATE</TableHead>
                      <TableHead>END DATE</TableHead>
                      <TableHead>PRIMARY CUSTOMER</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itineraries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          <p className="text-sm text-[#6c6c6c]">No confirmed itineraries found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      itineraries.map((itinerary, index) => (
                        <TableRow key={itinerary.itinerary_plan_ID}>
                          <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                          <TableCell className="font-medium text-[#d546ab]">
                            {itinerary.booking_quote_id}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Link to={`/confirmed-itinerary/${itinerary.itinerary_plan_ID}`}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4 text-[#d546ab]" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Cancel Itinerary"
                                onClick={() => {
                                  setSelectedItinerary(itinerary);
                                  setCancelModalOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{itinerary.agent_name}</TableCell>
                          <TableCell>{formatDate(itinerary.created_on)}</TableCell>
                          <TableCell>{itinerary.arrival_location || 'N/A'}</TableCell>
                          <TableCell>{itinerary.departure_location || 'N/A'}</TableCell>
                          <TableCell>
                            {itinerary.nights}N / {itinerary.days}D
                          </TableCell>
                          <TableCell>{formatDate(itinerary.arrival_date)}</TableCell>
                          <TableCell>{formatDate(itinerary.departure_date)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{itinerary.primary_customer_name}</div>
                              <div className="text-sm text-[#6c6c6c]">{itinerary.primary_contact_no}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-[#6c6c6c]">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredRecords)} of {filteredRecords} entries
                  {filteredRecords !== totalRecords && ` (filtered from ${totalRecords} total entries)`}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={i}
                          size="sm"
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          className={
                            currentPage === pageNum
                              ? 'bg-[#d546ab] hover:bg-[#c03d9f] text-white'
                              : ''
                          }
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* Cancellation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#4a4260]">Confirm Itinerary Cancellation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Booking ID - Read Only */}
            <div>
              <Label className="text-sm font-medium text-[#4a4260] mb-1 block">
                Itinerary Booking ID
              </Label>
              <input
                type="text"
                value={selectedItinerary?.booking_quote_id || ''}
                readOnly
                className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Guest Name - Read Only */}
            <div>
              <Label className="text-sm font-medium text-[#4a4260] mb-1 block">
                Guest Name
              </Label>
              <input
                type="text"
                value={selectedItinerary?.primary_customer_name || ''}
                readOnly
                className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Cancellation Options */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium text-[#4a4260]">Cancellation Options</Label>
              
              {/* Select All */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={cancellationOptions.selectAll}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCancellationOptions({
                      selectAll: checked,
                      modifyHotspot: checked,
                      modifyHotel: checked,
                      modifyVehicle: checked,
                    });
                  }}
                  className="accent-[#d546ab] cursor-pointer w-4 h-4"
                />
                <Label htmlFor="selectAll" className="text-sm text-gray-700 cursor-pointer">
                  Select All
                </Label>
              </div>
              <div className="text-xs text-gray-500 mt-2">Select components to cancel:</div>

              {/* Modify Hotspot */}
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="checkbox"
                  id="modifyHotspot"
                  checked={cancellationOptions.modifyHotspot}
                  onChange={(e) => {
                    setCancellationOptions({
                      ...cancellationOptions,
                      modifyHotspot: e.target.checked,
                      selectAll: false,
                    });
                  }}
                  className="accent-[#d546ab] cursor-pointer w-4 h-4"
                />
                <Label htmlFor="modifyHotspot" className="text-sm text-gray-700 cursor-pointer">
                  Modify Hotspot
                </Label>
              </div>

              {/* Modify Hotel */}
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="checkbox"
                  id="modifyHotel"
                  checked={cancellationOptions.modifyHotel}
                  onChange={(e) => {
                    setCancellationOptions({
                      ...cancellationOptions,
                      modifyHotel: e.target.checked,
                      selectAll: false,
                    });
                  }}
                  className="accent-[#d546ab] cursor-pointer w-4 h-4"
                />
                <Label htmlFor="modifyHotel" className="text-sm text-gray-700 cursor-pointer">
                  Modify Hotel
                </Label>
              </div>

              {/* Modify Vehicle */}
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="checkbox"
                  id="modifyVehicle"
                  checked={cancellationOptions.modifyVehicle}
                  onChange={(e) => {
                    setCancellationOptions({
                      ...cancellationOptions,
                      modifyVehicle: e.target.checked,
                      selectAll: false,
                    });
                  }}
                  className="accent-[#d546ab] cursor-pointer w-4 h-4"
                />
                <Label htmlFor="modifyVehicle" className="text-sm text-gray-700 cursor-pointer">
                  Modify Vehicle
                </Label>
              </div>

              {/* Modify Guide */}
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="checkbox"
                  id="modifyGuide"
                  checked={cancellationOptions.modifyGuide}
                  onChange={(e) => {
                    setCancellationOptions({
                      ...cancellationOptions,
                      modifyGuide: e.target.checked,
                      selectAll: false,
                    });
                  }}
                  className="accent-[#d546ab] cursor-pointer w-4 h-4"
                />
                <Label htmlFor="modifyGuide" className="text-sm text-gray-700 cursor-pointer">
                  Modify Guide
                </Label>
              </div>

              {/* Modify Activity */}
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="checkbox"
                  id="modifyActivity"
                  checked={cancellationOptions.modifyActivity}
                  onChange={(e) => {
                    setCancellationOptions({
                      ...cancellationOptions,
                      modifyActivity: e.target.checked,
                      selectAll: false,
                    });
                  }}
                  className="accent-[#d546ab] cursor-pointer w-4 h-4"
                />
                <Label htmlFor="modifyActivity" className="text-sm text-gray-700 cursor-pointer">
                  Modify Activity
                </Label>
              </div>
            </div>

            {/* Reason for Cancellation */}
            <div>
              <Label htmlFor="reason" className="text-sm font-medium text-[#4a4260] mb-1 block">
                Reason for Cancellation
              </Label>
              <textarea
                id="reason"
                className="w-full px-3 py-2 border border-[#e5d9f2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d546ab]"
                rows={3}
                placeholder="Enter the reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelModalOpen(false);
                resetCancellationState();
              }}
              disabled={isCancelling}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#d546ab] hover:bg-[#c03d9f] text-white"
              onClick={handleCancelItinerary}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? 'Confirming...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Success Dialog */}
      {cancellationResult && (
        <Dialog open={!!cancellationResult} onOpenChange={(open) => {
          if (!open) {
            setCancellationResult(null);
            setCancelModalOpen(false);
            resetCancellationState();
            fetchItineraries();
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-green-600 text-lg">✓ Cancellation Successful</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Cancellation Reference */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs text-green-600 font-semibold">Cancellation Reference</div>
                <div className="text-2xl font-bold text-green-700 mt-1">{cancellationResult.cancellation_reference}</div>
              </div>

              {/* Refund Amount */}
              {cancellationResult.refund_amount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-600 font-semibold">Refund Amount</div>
                  <div className="text-2xl font-bold text-blue-700 mt-1">₹{cancellationResult.refund_amount.toLocaleString('en-IN')}</div>
                </div>
              )}

              {/* Cancellation Details Breakdown */}
              {cancellationResult.cancellation_details && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Cancellation Breakdown</div>
                  {cancellationResult.cancellation_details.hotspots_cancelled > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Hotspots Cancelled:</span>
                      <span className="font-semibold text-gray-800">{cancellationResult.cancellation_details.hotspots_cancelled}</span>
                    </div>
                  )}
                  {cancellationResult.cancellation_details.hotels_cancelled > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Hotels Cancelled:</span>
                      <span className="font-semibold text-gray-800">{cancellationResult.cancellation_details.hotels_cancelled}</span>
                    </div>
                  )}
                  {cancellationResult.cancellation_details.vehicles_cancelled > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vehicles Cancelled:</span>
                      <span className="font-semibold text-gray-800">{cancellationResult.cancellation_details.vehicles_cancelled}</span>
                    </div>
                  )}
                  {cancellationResult.cancellation_details.guides_cancelled > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Guides Cancelled:</span>
                      <span className="font-semibold text-gray-800">{cancellationResult.cancellation_details.guides_cancelled}</span>
                    </div>
                  )}
                  {cancellationResult.cancellation_details.activities_cancelled > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Activities Cancelled:</span>
                      <span className="font-semibold text-gray-800">{cancellationResult.cancellation_details.activities_cancelled}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Cancelled On */}
              <div className="text-xs text-gray-500 text-center pt-2">
                Cancelled on: {new Date(cancellationResult.cancelled_on).toLocaleString('en-IN')}
              </div>
            </div>

            <DialogFooter>
              <Button
                className="bg-[#d546ab] hover:bg-[#c03d9f] text-white w-full"
                onClick={() => {
                  setCancellationResult(null);
                  setCancelModalOpen(false);
                  resetCancellationState();
                  fetchItineraries();
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

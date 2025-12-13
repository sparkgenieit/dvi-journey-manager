import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const tabs = [
  "Hotel Pricebook",
  "Amenities Pricebook",
  "Vehicle Pricebook",
  "Guide Pricebook",
  "Hotspot Pricebook",
  "Activity Pricebook",
  "Toll",
  "Parking",
];

const states = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
const cities = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const vendors = ["Vendor A", "Vendor B", "Vendor C"];
const branches = ["Branch 1", "Branch 2", "Branch 3"];
const hotspotLocations = [
  "Chennai International Airport",
  "Chennai Domestic Airport",
  "Chennai Central",
  "Pondicherry Airport",
  "Pondicherry",
  "Villupuram Railway station",
  "Trichy Airport (TRZ)",
];
const vehicleTypes = ["MUV 6+1", "Sedan", "SUV", "Tempo Traveller", "Bus"];

const mockTollData = [
  { id: 1, source: "Chennai", destination: "Pondicherry", vehicleType: "MUV 6+1", tollCharge: 250 },
  { id: 2, source: "Chennai", destination: "Madurai", vehicleType: "Sedan", tollCharge: 450 },
  { id: 3, source: "Trichy", destination: "Chennai", vehicleType: "SUV", tollCharge: 380 },
];

export default function PricebookExportPage() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Form states
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [vendor, setVendor] = useState("");
  const [branch, setBranch] = useState("");
  const [hotspotLocation, setHotspotLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  const handleExport = () => {
    console.log("Exporting data for tab:", tabs[activeTab]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Hotel Pricebook
        return (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm text-muted-foreground">State <span className="text-red-500">*</span></Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose State" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm text-muted-foreground">City <span className="text-red-500">*</span></Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Please Choose City" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-sm text-muted-foreground">Start Date <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-sm text-muted-foreground">End Date <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        );

      case 1: // Amenities Pricebook
        return (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm text-muted-foreground">State <span className="text-red-500">*</span></Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose State" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm text-muted-foreground">City <span className="text-red-500">*</span></Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Please Choose City" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-sm text-muted-foreground">Month <span className="text-red-500">*</span></Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose Any One" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <Label className="text-sm text-muted-foreground">Year <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1"
                placeholder="Year"
                min="2019"
                max="2030"
              />
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        );

      case 2: // Vehicle Pricebook
        return (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm text-muted-foreground">Vendor Name <span className="text-red-500">*</span></Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose Vendor" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {vendors.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm text-muted-foreground">Vendor Branch <span className="text-red-500">*</span></Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose Vendor Branch" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {branches.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-sm text-muted-foreground">Month <span className="text-red-500">*</span></Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose Month" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <Label className="text-sm text-muted-foreground">Year <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1"
                placeholder="Year"
                min="2019"
                max="2030"
              />
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        );

      case 3: // Guide Pricebook
        return (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px] max-w-[250px]">
              <Label className="text-sm text-muted-foreground">Month <span className="text-red-500">*</span></Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose Any One" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px] max-w-[200px]">
              <Label className="text-sm text-muted-foreground">Year <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1"
                placeholder="Month"
                min="2019"
                max="2030"
              />
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        );

      case 4: // Hotspot Pricebook
        return (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[280px] max-w-[400px]">
              <Label className="text-sm text-muted-foreground">Hotspot Location <span className="text-red-500">*</span></Label>
              <Select value={hotspotLocation} onValueChange={setHotspotLocation}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {hotspotLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        );

      case 5: // Activity Pricebook
        return (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px] max-w-[250px]">
              <Label className="text-sm text-muted-foreground">Month <span className="text-red-500">*</span></Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose Month" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px] max-w-[200px]">
              <Label className="text-sm text-muted-foreground">Year <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1"
                placeholder="Year"
                min="2019"
                max="2030"
              />
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        );

      case 6: // Toll
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px] max-w-[250px]">
                <Label className="text-sm text-muted-foreground">Vehicle Type <span className="text-red-500">*</span></Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="mt-1 bg-background">
                    <SelectValue placeholder="Choose Vehicle Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {vehicleTypes.map((vt) => (
                      <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {vehicleType && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Toll Price List</h3>
                    <Input placeholder="Search..." className="w-48" />
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">S.No</TableHead>
                          <TableHead className="font-semibold">Source Location</TableHead>
                          <TableHead className="font-semibold">Destination Location</TableHead>
                          <TableHead className="font-semibold">Vehicle Type</TableHead>
                          <TableHead className="font-semibold">Toll Charge</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockTollData.map((row, idx) => (
                          <TableRow key={row.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{row.source}</TableCell>
                            <TableCell>{row.destination}</TableCell>
                            <TableCell>{row.vehicleType}</TableCell>
                            <TableCell>₹{row.tollCharge}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>Showing 1 to {mockTollData.length} of {mockTollData.length} entries</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="default" size="sm" className="bg-primary">1</Button>
                      <Button variant="outline" size="sm" disabled>Next</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 7: // Parking
        return (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px] max-w-[250px]">
              <Label className="text-sm text-muted-foreground">Vehicle Type <span className="text-red-500">*</span></Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose Vehicle Type" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {vehicleTypes.map((vt) => (
                    <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] max-w-[300px]">
              <Label className="text-sm text-muted-foreground">Hotspot Location <span className="text-red-500">*</span></Label>
              <Select value={hotspotLocation} onValueChange={setHotspotLocation}>
                <SelectTrigger className="mt-1 bg-background">
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {hotspotLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0fa] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Export Price Details</h1>
        <div className="text-sm text-muted-foreground">
          Dashboard &gt; Export Price Details
        </div>
      </div>

      {/* Tabs Card */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {/* Tab Headers */}
          <div className="flex flex-wrap border-b border-border">
            {tabs.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === idx
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {activeTab === idx && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        DVI Holidays @ 2025
      </div>
    </div>
  );
}

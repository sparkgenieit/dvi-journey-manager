import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

export const CreateItinerary = () => {
  const [itineraryPreference, setItineraryPreference] = useState<"vehicle" | "hotel" | "both">("both");
  const [routeDetails, setRouteDetails] = useState([
    {
      day: 1,
      date: "12/12/2024",
      source: "",
      next: "",
      via: "",
      directVisit: "",
    },
  ]);
  const [rooms, setRooms] = useState([
    { id: 1, adults: 2, children: 0, infants: 0, roomCount: 1 },
  ]);
  const [vehicles, setVehicles] = useState([{ id: 1, type: "", count: 1 }]);

  const addDay = () => {
    setRouteDetails((prev) => [
      ...prev,
      {
        day: prev.length + 1,
        date: "",
        source: "",
        next: "",
        via: "",
        directVisit: "",
      },
    ]);
  };

  const addRoom = () => {
    setRooms((prev) => [
      ...prev,
      { id: prev.length + 1, adults: 2, children: 0, infants: 0, roomCount: 1 },
    ]);
  };

  const removeRoom = (id: number) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const addVehicle = () => {
    setVehicles((prev) => [...prev, { id: prev.length + 1, type: "", count: 1 }]);
  };

  const removeVehicle = (id: number) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="w-full max-w-full space-y-5 bg-[#f6edf8] min-h-screen p-4 md:p-6">
      {/* page title (your React one shows "Dashboard", PHP shows just title) */}
      <h1 className="text-lg md:text-xl font-semibold text-[#4a4260] mb-1">
        Itinerary Plan
      </h1>

      {/* MAIN CARD */}
      <Card className="border border-[#efdef8] rounded-lg bg-white shadow-none">
        <CardHeader className="pb-0">
          {/* keep header empty like PHP; they write title above */}
        </CardHeader>
        <CardContent className="pt-4 pb-5 space-y-4">
          {/* ROW 1: Itinerary Preference | Agent */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-[#fef8ff] border border-[#e9d4ff] rounded-md p-3">
              <Label className="mb-2 block text-sm text-[#4a4260]">
                Itinerary Preference *
              </Label>
              <RadioGroup
                value={itineraryPreference}
                onValueChange={(v) =>
                  setItineraryPreference(v as "vehicle" | "hotel" | "both")
                }
                className="flex flex-wrap gap-4"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="vehicle" id="vehicle" />
                  Vehicle
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="hotel" id="hotel" />
                  Hotel
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="both" id="both" />
                  Both Hotel and Vehicle
                </label>
              </RadioGroup>
            </div>
            {/* agent on right */}
            <div className="flex-1">
              <Label className="text-sm block mb-1">Agent *</Label>
              <Select>
                <SelectTrigger className="h-9 rounded-md border-[#e5d7f6]">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a1">Agent 1</SelectItem>
                  <SelectItem value="a2">Agent 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ROW 2: Arrival | Departure */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm block mb-1">Arrival *</Label>
              <Select>
                <SelectTrigger className="h-9 rounded-md border-[#e5d7f6]">
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loc1">Location 1</SelectItem>
                  <SelectItem value="loc2">Location 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm block mb-1">Departure *</Label>
              <Select>
                <SelectTrigger className="h-9 rounded-md border-[#e5d7f6]">
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loc1">Location 1</SelectItem>
                  <SelectItem value="loc2">Location 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ROW 3: Hotel Category | Hotel Facilities */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-[12px] block mb-1">
                Hotel Category (Maximum 4 Only)*
              </Label>
              <Input
                placeholder="Choose Category"
                className="h-9 rounded-md border-[#e5d7f6]"
              />
            </div>
            <div className="flex-1">
              <Label className="text-[12px] block mb-1">
                Hotel Facilities (Optional)
              </Label>
              <Input
                placeholder="Choose Hotel Facilities"
                className="h-9 rounded-md border-[#e5d7f6]"
              />
            </div>
          </div>

          {/* ROW 4: 5 compact fields (exact order) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-sm block mb-1">Trip Start Date *</Label>
              <Input placeholder="DD/MM/YYYY" className="h-9 border-[#e5d7f6]" />
            </div>
            <div>
              <Label className="text-sm block mb-1">Start Time *</Label>
              <Input placeholder="12:00 PM" className="h-9 border-[#e5d7f6]" />
            </div>
            <div>
              <Label className="text-sm block mb-1">Trip End Date *</Label>
              <Input placeholder="DD/MM/YYYY" className="h-9 border-[#e5d7f6]" />
            </div>
            <div>
              <Label className="text-sm block mb-1">End Time *</Label>
              <Input placeholder="12:00 PM" className="h-9 border-[#e5d7f6]" />
            </div>
            <div>
              <Label className="text-sm block mb-1">Itinerary Type *</Label>
              <Select>
                <SelectTrigger className="h-9 border-[#e5d7f6]">
                  <SelectValue placeholder="Customize" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customize">Customize</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ROW 5: 6 compact fields (exact order) */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <Label className="text-sm block mb-1">Arrival Type *</Label>
              <Select>
                <SelectTrigger className="h-9 border-[#e5d7f6]">
                  <SelectValue placeholder="By Flight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">By Flight</SelectItem>
                  <SelectItem value="train">By Train</SelectItem>
                  <SelectItem value="road">By Road</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm block mb-1">Departure Type *</Label>
              <Select>
                <SelectTrigger className="h-9 border-[#e5d7f6]">
                  <SelectValue placeholder="By Flight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">By Flight</SelectItem>
                  <SelectItem value="train">By Train</SelectItem>
                  <SelectItem value="road">By Road</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm block mb-1">Number of Nights</Label>
              <Input defaultValue={0} type="number" className="h-9 border-[#e5d7f6]" />
            </div>
            <div>
              <Label className="text-sm block mb-1">Number of Days</Label>
              <Input defaultValue={1} type="number" className="h-9 border-[#e5d7f6]" />
            </div>
            <div>
              <Label className="text-sm block mb-1">Budget *</Label>
              <Input defaultValue={15000} type="number" className="h-9 border-[#e5d7f6]" />
            </div>
            <div>
              <Label className="text-sm block mb-1">Entry Ticket Required? *</Label>
              <Select>
                <SelectTrigger className="h-9 border-[#e5d7f6]">
                  <SelectValue placeholder="No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ROOMS (purple) – FULL WIDTH just like screenshot */}
          {(itineraryPreference === "hotel" || itineraryPreference === "both") && (
            <div className="border border-dashed border-[#c985d7] rounded-lg bg-[#fff9ff] p-3">
              {rooms.map((room, idx) => (
                <div
                  key={room.id}
                  className={idx > 0 ? "mt-3 pt-3 border-t border-[#ead1f2]" : ""}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[#4a4260]">
                      #Room {idx + 1}{" "}
                      <span className="text-[11px] text-[#8b7fa3] ml-2">
                        Adult (Age Above 11), Child (Age 5 to 10), Infant (Age below 5)
                      </span>
                    </p>
                    {rooms.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRoom(room.id)}
                        className="h-7 w-7 text-[#d03265]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center border rounded-md bg-white">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() =>
                          setRooms((prev) =>
                            prev.map((r) =>
                              r.id === room.id && r.adults > 0
                                ? { ...r, adults: r.adults - 1 }
                                : r
                            )
                          )
                        }
                      >
                        -
                      </Button>
                      <span className="px-3 text-sm">{room.adults}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() =>
                          setRooms((prev) =>
                            prev.map((r) =>
                              r.id === room.id ? { ...r, adults: r.adults + 1 } : r
                            )
                          )
                        }
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 text-xs border-[#d39ce8]"
                      onClick={() =>
                        setRooms((prev) =>
                          prev.map((r) =>
                            r.id === room.id ? { ...r, children: r.children + 1 } : r
                          )
                        )
                      }
                    >
                      + Add Child
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 text-xs border-[#d39ce8]"
                      onClick={() =>
                        setRooms((prev) =>
                          prev.map((r) =>
                            r.id === room.id ? { ...r, infants: r.infants + 1 } : r
                          )
                        )
                      }
                    >
                      + Add Infant
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#4a4260]">
                    <span>
                      Total{" "}
                      <Input
                        value={room.roomCount}
                        onChange={(e) =>
                          setRooms((prev) =>
                            prev.map((r) =>
                              r.id === room.id
                                ? { ...r, roomCount: Number(e.target.value) || 0 }
                                : r
                            )
                          )
                        }
                        className="inline-block w-14 h-8 ml-1"
                        type="number"
                      />
                    </span>
                  </div>
                </div>
              ))}
              <div className="mt-3">
                <Button
                  onClick={addRoom}
                  className="h-8 px-4 bg-white text-[#c985d7] border border-[#c985d7] hover:bg-[#f5e8ff]"
                >
                  + Add Rooms
                </Button>
              </div>
            </div>
          )}

          {/* ROW 6: Guide | Nationality | Food Preferences | Meal Plan */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-sm block mb-1">Guide for Whole Itinerary *</Label>
              <Select>
                <SelectTrigger className="h-9 border-[#e5d7f6]">
                  <SelectValue placeholder="No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm block mb-1">Nationality *</Label>
              <Select>
                <SelectTrigger className="h-9 border-[#e5d7f6]">
                  <SelectValue placeholder="India" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="india">India</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm block mb-1">Food Preferences *</Label>
              <Select>
                <SelectTrigger className="h-9 border-[#e5d7f6]">
                  <SelectValue placeholder="Vegetarian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg">Vegetarian</SelectItem>
                  <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                  <SelectItem value="jain">Jain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm block mb-1">Meal Plan</Label>
              <div className="flex items-center gap-3 mt-1">
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" defaultChecked className="accent-[#5c2db1]" />
                  Breakfast
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" className="accent-[#5c2db1]" />
                  Lunch
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" className="accent-[#5c2db1]" />
                  Dinner
                </label>
              </div>
            </div>
          </div>

          {/* ROW 7: Pick up | Special Instructions */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-[30%]">
              <Label className="text-sm block mb-1">Pick Up Date &amp; Time *</Label>
              <Input
                placeholder="DD/MM/YYYY HH:MM"
                className="h-9 border-[#e5d7f6]"
              />
            </div>
            <div className="flex-1">
              <Label className="text-sm block mb-1">Special Instructions</Label>
              <Textarea
                rows={2}
                placeholder="Enter the Special Instruction"
                className="border-[#e5d7f6]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROUTE DETAILS */}
      <Card className="border border-[#efdef8] rounded-lg bg-white shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#4a4260]">
            Route Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#faf1ff]">
                <TableHead className="text-xs text-[#4a4260]">DAY</TableHead>
                <TableHead className="text-xs text-[#4a4260]">DATE</TableHead>
                <TableHead className="text-xs text-[#4a4260]">
                  SOURCE DESTINATION
                </TableHead>
                <TableHead className="text-xs text-[#4a4260]">
                  NEXT DESTINATION
                </TableHead>
                <TableHead className="text-xs text-[#4a4260]">VIA ROUTE</TableHead>
                <TableHead className="text-xs text-[#4a4260]">
                  DIRECT DESTINATION VISIT
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routeDetails.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.day}</TableCell>
                  <TableCell>
                    <Input
                      defaultValue={row.date}
                      className="h-8 rounded-md border-[#e5d7f6]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Source Location"
                      className="h-8 rounded-md border-[#e5d7f6]"
                    />
                  </TableCell>
                  <TableCell>
                    <Select>
                      <SelectTrigger className="h-8 rounded-md border-[#e5d7f6]">
                        <SelectValue placeholder="Next Destination" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="d1">Destination 1</SelectItem>
                        <SelectItem value="d2">Destination 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 rounded-md border-[#e5d7f6]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            onClick={addDay}
            className="mt-4 bg-[#f054b5] hover:bg-[#e249a9]"
          >
            + Add Day
          </Button>
        </CardContent>
      </Card>

      {/* VEHICLE */}
      {(itineraryPreference === "vehicle" || itineraryPreference === "both") && (
        <Card className="border border-[#efdef8] rounded-lg bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#4a4260]">
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicles.map((vehicle, idx) => (
              <div
                key={vehicle.id}
                className="border border-[#f1d8ff] rounded-md p-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[#4a4260]">
                    Vehicle #{idx + 1}
                  </p>
                  {vehicles.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVehicle(vehicle.id)}
                      className="h-7 w-7 text-[#e63963]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm block mb-1">Vehicle Type *</Label>
                    <Select>
                      <SelectTrigger className="h-9 border-[#e5d7f6]">
                        <SelectValue placeholder="No vehicle types found" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="t1">Type 1</SelectItem>
                        <SelectItem value="t2">Type 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm block mb-1">Vehicle Count *</Label>
                    <Input
                      defaultValue={vehicle.count}
                      type="number"
                      className="h-9 border-[#e5d7f6]"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              onClick={addVehicle}
              className="bg-[#f054b5] hover:bg-[#e249a9]"
            >
              + Add Vehicle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* bottom save */}
      <div className="flex justify-end">
        <Button className="bg-[#f054b5] hover:bg-[#e249a9] px-10">
          Save &amp; Continue
        </Button>
      </div>
    </div>
  );
};

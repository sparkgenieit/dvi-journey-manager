
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

export const CreateItinerary = () => {
    const [routeDetails, setRouteDetails] = useState([{ day: 1, date: '''12/12/2024''', source: '''''', next: '''''', via: '''''', directVisit: '''''' }]);
    const [vehicles, setVehicles] = useState([{ id: 1, type: '''''', count: 1 }]);

    const addDay = () => {
        setRouteDetails([...routeDetails, { day: routeDetails.length + 1, date: '''''', source: '''''', next: '''''', via: '''''', directVisit: '''''' }]);
    };
    
    const addVehicle = () => {
        setVehicles([...vehicles, { id: vehicles.length + 1, type: '''''', count: 1 }]);
    };

    const removeVehicle = (id: number) => {
        setVehicles(vehicles.filter(v => v.id !== id));
    };


  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Itinerary Plan</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Itinerary Preference */}
            <div className="space-y-2">
              <Label>Itinerary Preference *</Label>
              <RadioGroup defaultValue="both" className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vehicle" id="vehicle" />
                  <Label htmlFor="vehicle">Vehicle</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hotel" id="hotel" />
                  <Label htmlFor="hotel">Hotel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Both Hotel and Vehicle</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Agent */}
            <div className="space-y-2">
              <Label htmlFor="agent">Agent *</Label>
              <Select>
                <SelectTrigger id="agent">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent1">Agent 1</SelectItem>
                  <SelectItem value="agent2">Agent 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Arrival */}
            <div className="space-y-2">
              <Label htmlFor="arrival">Arrival *</Label>
               <Select>
                <SelectTrigger id="arrival">
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="location1">Location 1</SelectItem>
                  <SelectItem value="location2">Location 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Departure */}
            <div className="space-y-2">
              <Label htmlFor="departure">Departure *</Label>
               <Select>
                <SelectTrigger id="departure">
                  <SelectValue placeholder="Choose Location" />
                </Trigger>
                <SelectContent>
                  <SelectItem value="location1">Location 1</SelectItem>
                  <SelectItem value="location2">Location 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trip Start Date */}
            <div className="space-y-2">
              <Label htmlFor="trip-start-date">Trip Start Date *</Label>
              <Input id="trip-start-date" type="text" placeholder="DD/MM/YYYY" />
            </div>
            
            {/* Trip Start Time */}
            <div className="space-y-2">
              <Label htmlFor="trip-start-time">Start Time *</Label>
              <Input id="trip-start-time" type="text" placeholder="12:00 PM" />
            </div>

            {/* Trip End Date */}
            <div className="space-y-2">
              <Label htmlFor="trip-end-date">Trip End Date *</Label>              
              <Input id="trip-end-date" type="text" placeholder="DD/MM/YYYY" />
            </div>

            {/* Trip End Time */}
            <div className="space-y-2">
                <Label htmlFor="trip-end-time">End Time *</Label>
                <Input id="trip-end-time" type="text" placeholder="12:00 PM" />
            </div>

            {/* Itinerary Type */}
            <div className="space-y-2">
              <Label htmlFor="itinerary-type">Itinerary Type*</Label>
              <Input id="itinerary-type" type="text" />
            </div>

            {/* Customize */}
            <div className="space-y-2">
                <Label htmlFor="customize">Customize</Label>
                <Input id="customize" type="text" />
            </div>

            {/* Arrival Type */}
            <div className="space-y-2">
                <Label>Arrival Type</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="By Flight" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="flight">By Flight</SelectItem>
                        <SelectItem value="train">By Train</SelectItem>
                        <SelectItem value="road">By Road</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Departure Type */}
            <div className="space-y-2">
                <Label>Departure Type</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="By Flight" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="flight">By Flight</SelectItem>
                        <SelectItem value="train">By Train</SelectItem>
                        <SelectItem value="road">By Road</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Number of Nights */}
            <div className="space-y-2">
                <Label htmlFor="nights">Number of Nights</Label>
                <Input id="nights" type="number" defaultValue={0} />
            </div>

            {/* Number of Days */}
            <div className="space-y-2">
                <Label htmlFor="days">Number of Days</Label>
                <Input id="days" type="number" defaultValue={1} />
            </div>
            
            {/* Budget */}
            <div className="space-y-2">
                <Label htmlFor="budget">Budget *</Label>
                <Input id="budget" type="number" defaultValue={15000} />
            </div>

            {/* Entry Ticket Required? */}
            <div className="space-y-2">
                <Label>Entry Ticket Required?</Label>                
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="No" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Guide for Whole Itinerary */}
            <div className="space-y-2">
                <Label>Guide for Whole Itinerary *</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="No" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Nationality */}
            <div className="space-y-2">
                <Label>Nationality *</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="India" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="india">India</SelectItem>
                        <SelectItem value="other">Other</SelectItem>geo
                    </SelectContent>
                </Select>
            </div>

            {/* Pick up Date & Time */}
            <div className="space-y-2">
                <Label htmlFor="pickup-datetime">Pick up Date & Time*</Label>
                <Input id="pickup-datetime" type="text" placeholder="DD/MM/YYYY HH:MM" />
            </div>
            
            {/* Special Instructions */}
            <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
              <Label htmlFor="special-instructions">Special Instructions</Label>
              <Textarea id="special-instructions" placeholder="Enter the Special Instruction" />
            </div>

            {/* Number of Adults */}
            <div className="space-y-2">
              <Label htmlFor="adults">No. of Adults *</Label>
              <Input id="adults" type="number" defaultValue={2} />
            </div>

            {/* Number of Children */}
            <div className="space-y-2">
              <Label htmlFor="children">No. of children *</Label>
              <Input id="children" type="number" defaultValue={0} />
            </div>

            {/* Number of Infants */}
            <div className="space-y-2">
              <Label htmlFor="infants">No. of Infants *</Label>
              <Input id="infants" type="number" defaultValue={0} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Route Details</CardTitle>
        </CardHeader>
        <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>DAY</TableHead>
                    <TableHead>DATE</TableHead>
                    <TableHead>SOURCE DESTINATION</TableHead>
                    <TableHead>NEXT DESTINATION</TableHead>
                    <TableHead>VIA ROUTE</TableHead>
                    <TableHead>DIRECT DESTINATION VISIT</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {routeDetails.map((row, index) => (
                    <TableRow key={index}>
                        <TableCell>{row.day}</TableCell>
                        <TableCell><Input type="text" defaultValue={row.date} /></TableCell>
                        <TableCell><Input type="text" placeholder="Source Location" /></TableCell>
                        <TableCell>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Next Destination" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dest1">Destination 1</SelectItem>
                                    <SelectItem value="dest2">Destination 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell><Button variant="outline" size="icon"><Trash2 className="h-4 w-4" /></Button></TableCell>
                        <TableCell><Input type="text" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        <Button onClick={addDay} className="mt-4">+ Add Day</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>VEHICLE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {vehicles.map((vehicle, index) => (
                <div key={vehicle.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                        <Label>Vehicle #{index + 1}</Label>
                        {vehicles.length > 1 && <Button variant="destructive" size="icon" onClick={() => removeVehicle(vehicle.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vehicle Type *</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="No vehicle types found" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="type1">Type 1</SelectItem>
                                    <SelectItem value="type2">Type 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Vehicle Count *</Label>
                            <Input type="number" defaultValue={vehicle.count} />
                        </div>
                    </div>
                </div>
            ))}


            <Button onClick={addVehicle}>+ Add Vehicle</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg">Save & Continue</Button>
      </div>
    </div>
  );
};

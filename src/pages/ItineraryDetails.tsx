import React from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, MapPin, Car, Calendar, Plus } from "lucide-react";

export const ItineraryDetails = () => {
  const { id } = useParams();

  // Mock data - replace with API call
  const itinerary = {
    quoteId: id || "DVI20251113",
    dateRange: "Nov 24, 2025 to Nov 26, 2025 (N 3, D 3)",
    roomCount: 1,
    extraBed: 1,
    childWithBed: 0,
    childWithoutBed: 0,
    adults: 2,
    children: 0,
    infants: 0,
    overallCost: "55,724.00",
    days: [
      {
        id: 1,
        dayNumber: 1,
        date: "Mon, Nov 24, 2025",
        departure: "Chennai International Airport",
        arrival: "Chennai",
        distance: "8.00 KM",
        startTime: "12:00 PM",
        endTime: "8:00 PM",
        segments: [
          {
            type: "start",
            time: "12:00 PM - 01:00 PM",
            title: "Start you Journey",
          },
          {
            type: "travel",
            from: "Chennai International Airport",
            to: "Thousand Lights Mosque",
            startTime: "01:00 PM",
            endTime: "02:20 PM",
            distance: "19.90 KM",
            duration: "1 Hour 20 Min (This may vary due to traffic conditions)",
          },
          {
            type: "attraction",
            name: "Thousand Lights Mosque",
            description:
              "Thousand Lights is a multi-domed mosque in Anna Salai in Chennai, Tamil Nadu, India. It is one of the largest mosques in the country and is a revered place of worship and tourist for Shia Muslims in the city.",
            visitTime: "02:20 PM - 03:20 PM",
            duration: "1 Hour",
            image: "https://placehold.co/120x120/e9d5f7/4a4260?text=Mosque",
          },
          {
            type: "travel",
            from: "Thousand Lights Mosque",
            to: "Chennai",
            startTime: "03:20 PM",
            endTime: "03:25 PM",
            distance: "5.43 KM",
            duration: "5 Min (This may vary due to traffic conditions)",
          },
          {
            type: "hotspot",
            text: "Click to Add Hotspot",
          },
          {
            type: "return",
            time: "03:25 PM",
            note: "N/A",
          },
        ],
      },
      {
        id: 2,
        dayNumber: 2,
        date: "Tue, Nov 25, 2025",
        departure: "Chennai",
        arrival: "Srikakulam, Andhra Pradesh, India / Kanchipuram, Tamil Nadu, India",
        distance: "100.93 KM",
        startTime: "8:00 AM",
        endTime: "8:00 PM",
        segments: [
          {
            type: "start",
            time: "08:00 AM - 09:00 AM",
            title: "Start Your Day",
          },
          {
            type: "travel",
            from: "Chennai",
            to: "Anna tower park",
            startTime: "09:00 AM",
            endTime: "09:09 AM",
            distance: "9.21 KM",
            duration: "9 Min (This may vary due to traffic conditions)",
          },
          {
            type: "attraction",
            name: "Anna tower park",
            description:
              "Anna Nagar tower park, officially known as Dr Visvesvaraya Tower Park, is an urban park in the suburb of Anna Nagar, Chennai. It is the tallest park tower...",
            visitTime: "09:05 AM - 11:09 AM",
            duration: "2 Hours",
            image: "https://placehold.co/120x120/e9d5f7/4a4260?text=Park",
          },
          {
            type: "travel",
            from: "Anna tower park",
            to: "Srikakulam, Andhra Pradesh, India",
            startTime: "11:09 AM",
            endTime: "01:27 PM",
            distance: "138.28 KM",
            duration: "2 Hours 18 Min (This may vary due to traffic conditions)",
          },
          {
            type: "travel",
            from: "Srikakulam, Andhra Pradesh, India",
            to: "Kanchipuram, Tamil Nadu, India",
            startTime: "01:27 PM",
            endTime: "04:00 PM",
            distance: "192.69 KM",
            duration: "2 Hours 33 Min (This may vary due to traffic conditions)",
          },
          {
            type: "hotspot",
            text: "Click to Add Hotspot",
          },
          {
            type: "return",
            time: "04:01 PM",
            note: "N/A",
          },
        ],
      },
      {
        id: 3,
        dayNumber: 3,
        date: "Wed, Nov 26, 2025",
        departure: "Kanchipuram, Tamil Nadu, India",
        arrival: "Mahabalipuram / Chennai Domestic Airport",
        distance: "76.58 KM",
        startTime: "08:41 AM",
        endTime: "10:00 AM",
        segments: [
          {
            type: "hotspot",
            text: "Click to Add Hotspot",
          },
          {
            type: "travel",
            from: "Return to Chennai Domestic Airport",
            startTime: "08:41 AM",
            endTime: "10:00 AM",
            distance: "78.98 KM",
            duration: "1 Hour 19 Min (This may vary due to traffic conditions)",
            note: "including Depature Type Buffet Time of 2 Hours",
          },
        ],
      },
    ],
    hotels: [
      {
        day: "Day 1 | 24 Nov 2025",
        destination: "Chennai",
        hotelName: "",
        category: "",
        roomType: "",
        mealPlan: "EP",
      },
      {
        day: "Day 2 | 25 Nov 2025",
        destination: "Kanchipuram",
        hotelName: "",
        category: "",
        roomType: "",
        mealPlan: "EP",
      },
    ],
    vehicles: [
      {
        vendorName: "CHENNAI -COACH",
        branchName: "CHENNAI COACH BM",
        vehicleOrigin: "Chennai Koyambedu",
        totalQty: "1 ₹ 50,868.00",
        totalAmount: "₹ 50,868.00",
      },
    ],
    packageIncludes: {
      description: "All Hotel / west in Tamil Nadu.",
      houseBoatNote:
        "If staying in the House boat At Alleppey/Kumarakom\n\nNote :- If you are opting for House boat stay - please note the name of the house boat may be Deluxe, Premium, or Luxury. This is only the category of the house boat not the name of the House boat company",
      rateNote: "Rate does not include (Exclusion)",
    },
    costBreakdown: {
      totalVehicleCost: "₹ 50,867.66",
      totalVehicleAmount: "₹ 50,867.66",
      additionalMargin: "₹ 5,086.77",
      totalAmount: "₹ 55,954.43",
      couponDiscount: "- ₹ 230.68",
      agentMargin: "₹ 0.00",
      totalRoundOff: "₹ 6.25",
      netPayable: "₹ 43,724.00",
      companyName: "Devloc Holidays India Pvt ltd",
    },
  };

  return (
    <div className="w-full max-w-full space-y-6 pb-8">
      {/* Header Card */}
      <Card className="border-none shadow-none bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-xl font-semibold text-[#4a4260]">
              Tour Itinerary Plan
            </h1>
            <Link to="/latest-itinerary">
              <Button
                variant="outline"
                className="border-[#d546ab] text-[#d546ab] hover:bg-[#fdf6ff]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Route List
              </Button>
            </Link>
          </div>

          {/* Quote Info */}
          <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#6c6c6c]" />
                <span className="font-medium text-[#4a4260]">
                  {itinerary.quoteId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#6c6c6c]" />
                <span className="text-[#6c6c6c]">{itinerary.dateRange}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#6c6c6c]">Overall Trip Cost :</p>
              <p className="text-2xl font-bold text-[#d546ab]">
                ₹ {itinerary.overallCost}
              </p>
            </div>
          </div>

          {/* Trip Details */}
          <div className="flex flex-wrap gap-4 text-sm text-[#6c6c6c]">
            <span>Room Count: {itinerary.roomCount}</span>
            <span>Extra Bed: {itinerary.extraBed}</span>
            <span>Child without bed: {itinerary.childWithoutBed}</span>
            <span>Child without bed: {itinerary.childWithoutBed}</span>
            <div className="ml-auto flex gap-4">
              <span>Adults: {itinerary.adults}</span>
              <span>Child: {itinerary.children}</span>
              <span>Infants: {itinerary.infants}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Itinerary */}
      {itinerary.days.map((day) => (
        <Card key={day.id} className="border border-[#e5d9f2] bg-white">
          <CardContent className="pt-4">
            {/* Day Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 p-3 bg-[#f8f5fc] rounded-lg border border-[#e5d9f2]">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-[#d546ab]" />
                <div>
                  <h3 className="font-semibold text-[#4a4260]">
                    DAY {day.dayNumber} - {day.date}
                  </h3>
                  <p className="text-sm text-[#6c6c6c]">
                    {day.departure} <MapPin className="inline h-3 w-3 mx-1" />{" "}
                    {day.arrival}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-[#d546ab] text-white px-3 py-1 rounded-full">
                  {day.distance}
                </span>
              </div>
            </div>

            {/* Time Range */}
            <div className="flex items-center gap-4 mb-6 ml-2">
              <span className="text-[#d546ab] font-semibold">
                {day.startTime}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#d546ab] to-transparent" />
              <span className="text-[#6c6c6c]">{day.endTime}</span>
            </div>

            {/* Segments */}
            <div className="space-y-4">
              {day.segments.map((segment, idx) => (
                <div key={idx} className="ml-8">
                  {segment.type === "start" && (
                    <div className="flex items-center gap-3 mb-4">
                      <Car className="h-5 w-5 text-[#6c6c6c]" />
                      <div>
                        <p className="font-medium text-[#4a4260]">
                          {segment.title}
                        </p>
                        <p className="text-sm text-[#6c6c6c]">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {segment.time}
                        </p>
                      </div>
                    </div>
                  )}

                  {segment.type === "travel" && (
                    <div className="bg-[#e8f9fd] rounded-lg p-3 mb-3">
                      <div className="flex items-start gap-3">
                        <Car className="h-5 w-5 text-[#4ba3c3] mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-[#4a4260]">
                            <span className="font-medium">Travelling from</span>{" "}
                            <span className="text-[#d546ab]">{segment.from}</span>{" "}
                            <span className="font-medium">to</span>{" "}
                            <span className="text-[#d546ab]">{segment.to}</span>
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#6c6c6c]">
                            <span>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {segment.startTime} - {segment.endTime}
                            </span>
                            <span>
                              <MapPin className="inline h-3 w-3 mr-1" />
                              {segment.distance}
                            </span>
                            <span>⏱ {segment.duration}</span>
                          </div>
                          {segment.note && (
                            <p className="text-xs text-[#6c6c6c] mt-2">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {segment.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {segment.type === "attraction" && (
                    <div className="bg-gradient-to-r from-[#faf5ff] to-[#f3e8ff] rounded-lg p-4 mb-3 border border-[#e5d9f2]">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <img
                          src={segment.image}
                          alt={segment.name}
                          className="w-full sm:w-32 h-32 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#4a4260] mb-2">
                            {segment.name}
                          </h4>
                          <p className="text-sm text-[#6c6c6c] mb-3">
                            {segment.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-[#6c6c6c]">
                            <span>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {segment.visitTime}
                            </span>
                            <span>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {segment.duration}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:ml-auto">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            📷
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            🖼️
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {segment.type === "hotspot" && (
                    <div className="flex items-center gap-2 mb-3 text-[#d546ab]">
                      <Plus className="h-4 w-4" />
                      <button className="text-sm hover:underline">
                        {segment.text}
                      </button>
                    </div>
                  )}

                  {segment.type === "return" && (
                    <div className="flex items-center gap-3 text-sm text-[#6c6c6c]">
                      <Car className="h-5 w-5" />
                      <div>
                        <p className="font-medium text-[#4a4260]">
                          Return to Origin and Relax
                        </p>
                        <p>
                          <Clock className="inline h-3 w-3 mr-1" />
                          {segment.time} <span className="ml-2">🔘 {segment.note}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Guide Button */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#d546ab] border-[#d546ab] hover:bg-[#fdf6ff]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Hotel List */}
      <Card className="border-none shadow-none bg-white">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#4a4260]">HOTEL LIST</h2>
            <Button
              variant="link"
              className="text-[#d546ab] hover:text-[#c03d9f]"
            >
              Display Rates
            </Button>
          </div>

          {/* Hotel Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {[1, 2, 3, 4].map((i) => (
              <Button
                key={i}
                variant={i === 1 ? "default" : "outline"}
                size="sm"
                className={
                  i === 1
                    ? "bg-[#d546ab] hover:bg-[#c03d9f]"
                    : "border-[#e5d9f2]"
                }
              >
                Recommended #{i} (₹ {i === 1 ? "0.00" : "0.00"})
              </Button>
            ))}
          </div>

          {/* Hotel Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-[#f8f5fc]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    DAY
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    DESTINATION
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    HOTEL NAME - CATEGORY
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    HOTEL ROOM TYPE
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    MEAL PLAN
                  </th>
                </tr>
              </thead>
              <tbody>
                {itinerary.hotels.map((hotel, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                      {hotel.day}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                      {hotel.destination}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                      {hotel.hotelName || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                      {hotel.roomType || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                      {hotel.mealPlan}
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-[#fdf6ff]">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-sm font-medium text-[#4a4260] text-right"
                  >
                    Hotel Total :
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#4a4260]">
                    ₹ 0.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card className="border-none shadow-none bg-white">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-[#4a4260] mb-4">
            VEHICLE LIST FOR "BENZ LARGE - 45 SEATER"
          </h2>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-[#f8f5fc]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260] w-8">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    VENDOR NAME
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    BRANCH NAME
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    VEHICLE ORIGIN
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    TOTAL QTY
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#4a4260]">
                    TOTAL AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {itinerary.vehicles.map((vehicle, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-3">
                      <div className="h-6 w-6 rounded-full bg-[#8b43d1] flex items-center justify-center text-white text-xs">
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                      {vehicle.vendorName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                      {vehicle.branchName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                      {vehicle.vehicleOrigin}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c6c6c]">
                      {vehicle.totalQty}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#4a4260]">
                      {vehicle.totalAmount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Package Includes & Overall Cost */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Package Includes */}
        <Card className="border-none shadow-none bg-white">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-[#4a4260] mb-4">
              Package Includes
            </h2>
            <div className="space-y-3 text-sm text-[#6c6c6c]">
              <div>
                <p className="font-medium text-[#4a4260] mb-1">
                  Package Includes: (Inclusion)
                </p>
                <p>{itinerary.packageIncludes.description}</p>
              </div>
              <div>
                <p className="font-medium text-[#4a4260] mb-1">
                  If staying in the House boat At Alleppey/Kumarakom
                </p>
                <p className="whitespace-pre-line">
                  {itinerary.packageIncludes.houseBoatNote}
                </p>
              </div>
              <div>
                <p className="font-medium text-[#4a4260]">
                  {itinerary.packageIncludes.rateNote}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Cost */}
        <Card className="border-none shadow-none bg-gradient-to-br from-[#faf5ff] to-white">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-[#4a4260] mb-4">
              OVERALL COST
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">Total Vehicle cost (₹)</span>
                <span className="text-[#4a4260]">
                  {itinerary.costBreakdown.totalVehicleCost}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">Total Vehicle Amount</span>
                <span className="text-[#4a4260]">
                  {itinerary.costBreakdown.totalVehicleAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">
                  Total Additional Margin (10%)
                </span>
                <span className="text-[#4a4260]">
                  {itinerary.costBreakdown.additionalMargin}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-[#4a4260]">Total Amount</span>
                <span className="text-[#4a4260]">
                  {itinerary.costBreakdown.totalAmount}
                </span>
              </div>
              <div className="flex justify-between text-[#d546ab]">
                <span>Coupon Discount</span>
                <span>{itinerary.costBreakdown.couponDiscount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">Agent Margin</span>
                <span className="text-[#4a4260]">
                  {itinerary.costBreakdown.agentMargin}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c6c6c]">Total Round Off</span>
                <span className="text-[#4a4260]">
                  {itinerary.costBreakdown.totalRoundOff}
                </span>
              </div>
              <div className="border-t-2 border-[#d546ab] pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[#4a4260]">
                    Net Payable to {itinerary.costBreakdown.companyName}
                  </span>
                  <span className="text-[#d546ab]">
                    {itinerary.costBreakdown.netPayable}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button className="bg-[#8b43d1] hover:bg-[#7c37c1]">Clipboard</Button>
        <Button className="bg-[#28a745] hover:bg-[#218838]">
          Create Itinerary
        </Button>
        <Button className="bg-[#d546ab] hover:bg-[#c03d9f]">
          Confirm Quotation
        </Button>
        <Button className="bg-[#17a2b8] hover:bg-[#138496]">Share</Button>
      </div>
    </div>
  );
};

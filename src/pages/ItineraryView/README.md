# Itinerary View Implementation

This implementation mirrors the PHP legacy code structure for displaying itinerary details in a modern React application.

## 📁 Structure

```
src/pages/ItineraryView/
├── index.ts                 # Exports
├── types.ts                 # TypeScript interfaces
├── helpers.ts               # Utility functions
├── ItineraryView.tsx        # Main view component
└── RouteDayCard.tsx         # Day-wise route card component
```

## 🎯 Features Implemented

### 1. **Type Definitions** (`types.ts`)
- `ViaRouteItem` - Via route location data
- `ItineraryRoute` - Complete route information
- `ItineraryPlan` - Itinerary plan details
- `GuideDetails` - Guide information
- `HotspotDetails` - Hotspot information
- `VehicleDetails` - Vehicle information
- `ItineraryFullDetails` - Complete itinerary data

### 2. **Helper Functions** (`helpers.ts`)
- `formatViaRoutesWithArrows()` - Format via routes with arrow icons
- `formatViaRoutesPlain()` - Format via routes as plain text
- `formatItineraryDate()` - Format dates for display
- `formatTime()` - Format time strings
- `isBeforeSixAM()` - Check if time is before 6 AM
- `isAfterEightPM()` - Check if time is after 8 PM
- `calculateTotalPax()` - Calculate total passengers
- `formatCurrency()` - Format currency with INR symbol
- `calculateDateRange()` - Calculate nights and days
- `isDayTrip()` - Detect day trip scenarios
- `getItineraryPreferenceLabel()` - Get preference label
- `getGuideTypeLabel()` - Get guide type label

### 3. **Main Components**

#### `ItineraryView.tsx`
Main component that displays the complete itinerary:

**Features:**
- Sticky page title header
- Sticky itinerary summary header with:
  - Quote ID
  - Date range (nights/days)
  - PAX counts (adults, children, infants)
  - Room information
  - Overall trip cost
- Day-wise route accordion
- Expandable/collapsible route cards

**Sticky Positioning:**
- Page Title: `top-[2px], z-[1001]`
- Header Summary: `top-[60px], z-[1000]`
- Route Day Cards: `top-[148px], z-10`

#### `RouteDayCard.tsx`
Day-wise route card component matching PHP layout:

**Features:**
- Day number and date
- Source → Via Routes → Destination display
- KM information (hidden for hotel-only itineraries)
- Location description section
- Time range display (start → end)
- Extra charges warning (before 6 AM / after 8 PM)
- Expandable content area for hotspots/hotels/activities

## 🔗 Integration

### Route Added
```tsx
<Route
  path="/itinerary-view/:id"
  element={
    <MainLayout>
      <ItineraryView />
    </MainLayout>
  }
/>
```

### Usage
```tsx
// Navigate to itinerary view
navigate(`/itinerary-view/${planId}`);

// Or via link
<Link to={`/itinerary-view/${planId}`}>View Itinerary</Link>
```

## 📊 Data Flow

1. **Load Itinerary**: `ItineraryService.getOne(planId)`
2. **Backend**: Returns plan, routes (with via_routes), guides, hotspots, vehicles
3. **Display**: Maps routes to `RouteDayCard` components
4. **Interaction**: Click to expand/collapse each day

## 🎨 Styling

Following the PHP design patterns:
- Purple accent colors (`#7367f0`, `#c09bff`)
- Sticky headers with z-index layering
- Card-based layout
- Badge components for counts
- Responsive grid system

## 🔄 Via Routes Display

Via routes are displayed inline between source and destination:

```
Chennai → Mahabalipuram, Chidambaram → Pondicherry
```

Hover tooltip shows full via route details with formatting.

## ⚠️ Extra Charges Logic

Matches PHP logic for vehicle/driver extra charges:
- Before 6 AM: Extra charges applicable
- After 8 PM: Extra charges applicable
- Both: Combined warning message

## 🚀 Future Enhancements

Areas that can be expanded (currently in PHP):
1. Hotspot listing and details
2. Hotel selection and pricing
3. Guide information display
4. Activity details
5. Vehicle assignment details
6. Cost breakdown
7. PDF export functionality
8. Email/share options

## 📝 Notes

- Backend API updated to include `via_routes` in route responses
- Via routes stored as array: `[{itinerary_via_location_ID, itinerary_via_location_name}]`
- Fully typed with TypeScript for type safety
- Uses shadcn/ui components for consistent UI
- Mobile responsive design

## 🔧 Backend Changes

Updated `itinerary-details.service.ts`:
- Fetches via routes from `dvi_itinerary_via_route_details`
- Groups via routes by route ID
- Includes via_routes array in each route response

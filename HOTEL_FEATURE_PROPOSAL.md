# 🏨 Frontend Hotels Feature - Implementation Proposal

**Status:** Ready for Implementation  
**Date:** December 28, 2025  

---

## 📋 What Will Be Implemented

### Current State ❌
- Hotels are displayed as **static data** from the backend
- Hotel selection modal shows hotels from `getAvailableHotels()` endpoint
- Hotels are fetched **once** when user opens the selection modal
- No real-time hotel search/filtering
- No live hotel availability updates

### New State ✅ (Proposed Implementation)

#### 1. **Real-Time Hotel Search in Selection Modal**

**Component:** `ItineraryDetails.tsx` - Hotel Selection Modal

**Current Code:**
```typescript
// Line ~1250 - Current approach (static, one-time fetch)
const hotels = await ItineraryService.getAvailableHotels(routeId);
setAvailableHotels(hotels as AvailableHotel[]);
```

**New Code (Proposed):**
```typescript
// Real-time search as user types
const handleHotelSearch = async (searchQuery: string, checkInDate: string, checkOutDate: string) => {
  if (!searchQuery.trim()) {
    setSearchResults([]);
    return;
  }
  
  setSearching(true);
  try {
    // Call new real-time search endpoint
    const results = await api.post('/hotels/search', {
      cityCode: routeHotelCityCode,
      checkInDate: checkInDate,  // From selected route
      checkOutDate: checkOutDate,  // From selected route
      roomCount: 1,
      guestCount: adultCount || 2,
      // Filter by search query
      hotelName: searchQuery
    });
    
    setSearchResults(results.data.hotels || []);
  } catch (error) {
    toast.error('Failed to search hotels');
  } finally {
    setSearching(false);
  }
};
```

---

#### 2. **Hotel Details Card Component (NEW)**

**New Component:** `HotelSearchResultCard.tsx`

Shows each hotel with:
- Hotel name & rating
- Address & location
- Per-night price (from real-time search)
- Room types available
- Facilities
- Images
- "Select" button with loading state
- Check-in/Check-out dates

**Usage in Modal:**
```typescript
{searchResults.map((hotel) => (
  <HotelSearchResultCard
    key={hotel.hotelCode}
    hotel={hotel}
    onSelect={handleSelectHotel}
    isLoading={isSelectingHotel}
    checkInDate={checkInDate}
    checkOutDate={checkOutDate}
  />
))}
```

---

#### 3. **Live Availability Badge**

Add badge showing:
- ✅ "Rooms Available" 
- ⚠️ "Limited Availability"
- ❌ "Sold Out"

Based on real search response data.

---

#### 4. **Price Display Update**

**Current:**
```
Hotel Name - Static Rate
```

**New:**
```
Hotel Name
₹ 5,000 / night (from real-time search)
₹ 4,500 (negotiated rate if available)
Total: ₹ 50,000 (5 nights)
```

---

#### 5. **New Hotel Service Methods**

**File:** `src/services/itinerary.ts`

**New Methods:**
```typescript
// Real-time hotel search
static async searchHotels(searchParams: {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  roomCount: number;
  guestCount: number;
}) {
  return api.post('/hotels/search', searchParams);
}

// Get hotel details (ratings, facilities, images)
static async getHotelDetails(hotelCode: string) {
  return api.get(`/hotels/${hotelCode}`);
}

// Get room availability for specific hotel
static async getRoomAvailability(hotelCode: string, checkInDate: string, checkOutDate: string) {
  return api.post(`/hotels/${hotelCode}/availability`, {
    checkInDate,
    checkOutDate
  });
}
```

---

#### 6. **Updated Hotel Selection Modal UI**

**Current Structure:**
```
Modal Title: "Select Hotel"
├─ Simple list of hotels
├─ Hotel name dropdown
└─ Meal plan options
```

**New Structure:**
```
Modal Title: "Search Hotels"
├─ Search Input
│  ├─ Hotel name search field
│  └─ Auto-refresh on input (debounced)
├─ Results Container
│  ├─ Loading skeleton (while searching)
│  ├─ "No results" message (if none found)
│  └─ Hotel Cards List
│     ├─ Hotel name, rating, address
│     ├─ Price per night & total
│     ├─ Available rooms count
│     ├─ Facilities preview
│     └─ "Select & Continue" button
├─ Selected Hotel Summary (sticky bottom)
│  ├─ Hotel name
│  ├─ Check-in/out dates
│  ├─ Total price
│  ├─ Meal plan selector
│  └─ "Confirm Selection" button
```

---

#### 7. **Integration Points**

**APIs that will be called:**

1. **POST `/hotels/search`** (From NestJS Backend)
   ```
   Input: cityCode, checkInDate, checkOutDate, roomCount, guestCount
   Output: List of available hotels with prices
   ```

2. **Current endpoints (unchanged):**
   ```
   POST /itineraries/:quoteId/select-hotel
   (Still used for final hotel selection)
   ```

---

## 📊 File Changes Summary

### Modified Files

| File | Change | Lines |
|------|--------|-------|
| `src/pages/ItineraryDetails.tsx` | Add real-time hotel search logic | ~80 |
| `src/services/itinerary.ts` | Add new hotel search methods | ~30 |

### New Files

| File | Purpose | Est. Lines |
|------|---------|-----------|
| `src/components/hotels/HotelSearchResultCard.tsx` | Display individual hotel result | ~200 |
| `src/components/hotels/HotelSearchModal.tsx` | Extracted hotel search modal component | ~400 |
| `src/hooks/useHotelSearch.ts` | Custom hook for hotel search logic | ~150 |

### Existing Files (No Changes)

```
✅ src/pages/HotelList.tsx (Displays booked hotels)
✅ src/components/ui/* (UI components)
✅ src/services/api.ts (API client)
```

---

## 🔄 User Flow

**Current Flow:**
```
Click "Add Hotel"
  ↓
Modal opens with static list
  ↓
Select hotel from dropdown
  ↓
Save hotel
```

**New Flow:**
```
Click "Add Hotel"
  ↓
Modal opens with search field
  ↓
User types hotel name
  ↓
Real-time results appear
  ↓
Click "View Details" (optional)
  ↓
Select hotel
  ↓
Confirm meal plan
  ↓
Save hotel
```

---

## ⚡ Key Features

### 1. Debounced Search
```typescript
// Search only fires after user stops typing for 500ms
const debouncedSearch = useCallback(
  debounce((query: string) => handleHotelSearch(query), 500),
  [checkInDate, checkOutDate]
);
```

### 2. Loading States
- Search input: Spinner while searching
- Results: Skeleton loaders for hotel cards
- Button: "Selecting..." state

### 3. Error Handling
- No results: "No hotels found. Try different dates."
- API error: Toast notification with retry button
- Network error: "Connection lost. Please try again."

### 4. Performance
- Debounced search (avoid too many API calls)
- Memoized components
- Virtualized list (if >20 results)

### 5. Mobile Responsive
- Full-width search field
- Stacked hotel cards
- Bottom sheet modal (on mobile)

---

## 🎨 Visual Changes

### Before (Static)
```
┌─────────────────────┐
│ Select Hotel        │
├─────────────────────┤
│ Hotel Name: [======]│
│ Meal Plan: [ ]      │
│ [Save]              │
└─────────────────────┘
```

### After (Real-Time)
```
┌──────────────────────────────┐
│ Search Hotels for 2025-10-30 │
├──────────────────────────────┤
│ 🔍 Hotel name...             │
│                              │
│ 🏨 Hotel A                   │
│    ⭐⭐⭐⭐⭐ (4.5)             │
│    ₹ 5,000 / night           │
│    2 rooms available         │
│    📍 Connaught Place        │
│    [Select & Continue]       │
│                              │
│ 🏨 Hotel B                   │
│    ⭐⭐⭐⭐ (4.0)              │
│    ₹ 4,500 / night           │
│    5 rooms available         │
│    📍 New Delhi              │
│    [Select & Continue]       │
│                              │
├──────────────────────────────┤
│ Selected: Hotel A            │
│ Check-in: Oct 30, 2025       │
│ Total: ₹ 25,000 (5 nights)   │
│ [🍽️  Meals] [Confirm]        │
└──────────────────────────────┘
```

---

## 🔗 Backend Integration

**Uses existing NestJS endpoints we just implemented:**

```typescript
POST /hotels/search
{
  "cityCode": "4",
  "checkInDate": "2025-10-30",
  "checkOutDate": "2025-10-31",
  "roomCount": 1,
  "guestCount": 2
}

Response:
{
  "success": true,
  "data": {
    "hotels": [
      {
        "hotelCode": "1035259",
        "hotelName": "Hotel Name",
        "rating": 4.5,
        "address": "Address",
        "price": 5000,
        "roomTypes": [...],
        "facilities": [...]
      }
    ]
  }
}
```

---

## ✅ Implementation Checklist

### Phase 1: Core Search (1-2 hours)
- [ ] Create `useHotelSearch` hook
- [ ] Add search methods to `ItineraryService`
- [ ] Update ItineraryDetails hotel selection modal
- [ ] Wire up search input & debouncing
- [ ] Display basic results list

### Phase 2: UI Components (2-3 hours)
- [ ] Create `HotelSearchResultCard` component
- [ ] Create `HotelSearchModal` component
- [ ] Add loading states & skeletons
- [ ] Style for mobile responsiveness

### Phase 3: Features (1-2 hours)
- [ ] Add availability badge
- [ ] Add facility icons/display
- [ ] Add image carousel
- [ ] Add room type selector
- [ ] Add meal plan selector

### Phase 4: Polish (1 hour)
- [ ] Error handling & edge cases
- [ ] Empty state messages
- [ ] Loading animations
- [ ] Mobile testing
- [ ] Accessibility (ARIA labels)

---

## 🚀 Ready to Implement?

This implementation will:
- ✅ Fetch hotels in real-time from NestJS backend
- ✅ Show live pricing and availability
- ✅ Provide better UX for hotel selection
- ✅ Use the TBO API endpoints we just built
- ✅ Handle errors gracefully
- ✅ Work on mobile and desktop

**Estimated Total Time:** 4-6 hours

---

**Should I proceed with this implementation?**

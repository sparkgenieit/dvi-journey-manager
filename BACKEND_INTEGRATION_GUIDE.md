# Backend Integration Guide - Cancellation with Selective Options

## Overview

The frontend has been updated to support the new backend API for itinerary cancellation with **selective component cancellation**. This document outlines the changes made and what the backend needs to implement.

## Frontend Changes Summary

### Updated Components

#### 1. **ConfirmedItineraries.tsx** (List Page)
- **Added State**: 
  - `cancellationOptions` - Now includes `modifyGuide` and `modifyActivity` flags
  - `cancellationResult` - Stores detailed cancellation response

- **Updated Dialog Features**:
  - "Select All" checkbox with smart toggle logic
  - Individual checkboxes for: Hotspots, Hotels, Vehicles, Guides, Activities
  - Reason textarea for cancellation cause

- **Success Dialog**:
  - Displays cancellation reference (green highlight)
  - Shows refund amount (blue highlight)
  - Breakdown of cancelled items with counts
  - Timestamp of cancellation

#### 2. **ConfirmedItineraryDetails.tsx** (Detail Page)
- **Cancellation Dialog** now includes:
  - Component selection checkboxes (same as list page)
  - Scrollable dialog for mobile compatibility
  - Reason input field

- **Success Dialog**:
  - Matches ConfirmedItineraries display format
  - Shows all cancellation details
  - Allows closing and returning to list

#### 3. **ItineraryService.ts** (API Service)
- **Updated `cancelItinerary()` method**:
  - Now accepts optional `reason` field
  - Supports both old format (cancel_* booleans) and new format (cancellation_options object)
  - Added optional `cancellation_percentage` parameter (defaults to 10%)

- **New Method `getConfirmedItineraryDetails()`**:
  - Fetches a single confirmed itinerary by ID
  - Used by ConfirmedItineraryDetails page

## API Contracts

### Request Format

**Endpoint**: `POST /api/itineraries/cancel`

**New Format** (Recommended):
```json
{
  "itinerary_plan_ID": 123,
  "reason": "Customer requested cancellation",
  "cancellation_percentage": 10,
  "cancellation_options": {
    "modify_hotspot": true,
    "modify_hotel": true,
    "modify_vehicle": false,
    "modify_guide": false,
    "modify_activity": false
  }
}
```

**Legacy Format** (Still Supported):
```json
{
  "itinerary_plan_ID": 123,
  "cancel_hotspot": true,
  "cancel_hotel": true,
  "cancel_vehicle": false,
  "cancel_guide": false,
  "cancel_activity": false,
  "cancellation_percentage": 10
}
```

### Response Format

**Success Response** (200):
```json
{
  "success": true,
  "message": "Itinerary cancelled successfully",
  "data": {
    "cancellation_id": 456,
    "itinerary_id": 123,
    "cancellation_reference": "CANCEL_20260108_123",
    "status": "completed",
    "refund_amount": 15000,
    "cancellation_details": {
      "hotspots_cancelled": 3,
      "hotels_cancelled": 2,
      "vehicles_cancelled": 1,
      "guides_cancelled": 0,
      "activities_cancelled": 0
    },
    "cancelled_on": "2026-01-08T10:30:00Z"
  }
}
```

### Error Responses

| Status | Scenario | User Message |
|--------|----------|--------------|
| 400 | Missing required field (reason) | "Missing required fields: reason is required" |
| 404 | Itinerary not found | "Itinerary not found" |
| 409 | Itinerary already cancelled | "This itinerary is already cancelled" |
| 500 | Processing error | Error message from backend |

## Implementation Checklist for Backend

- [ ] Update `POST /api/itineraries/cancel` endpoint to:
  - [ ] Accept `reason` field (string, required)
  - [ ] Accept `cancellation_options` object with 5 boolean flags
  - [ ] Accept optional `cancellation_percentage` (default: 10%)
  - [ ] Maintain backward compatibility with old cancel_* format
  
- [ ] Generate cancellation reference in format: `CANCEL_YYYYMMDD_ID`
  
- [ ] Calculate refund amount based on:
  - [ ] Cancellation percentage
  - [ ] Selected components to cancel
  - [ ] Existing refund policies
  
- [ ] Count cancelled items for each component type:
  - [ ] Hotspots cancelled
  - [ ] Hotels cancelled
  - [ ] Vehicles cancelled
  - [ ] Guides cancelled
  - [ ] Activities cancelled
  
- [ ] Update database:
  - [ ] Mark itinerary as cancelled
  - [ ] Store cancellation reference
  - [ ] Record cancellation timestamp
  - [ ] Log which components were cancelled
  - [ ] Track refund amount
  
- [ ] Error handling:
  - [ ] Return 400 if reason is missing
  - [ ] Return 404 if itinerary not found
  - [ ] Return 409 if already cancelled
  - [ ] Return 500 with error details if processing fails
  
- [ ] Notifications:
  - [ ] Send email to customer with cancellation details
  - [ ] Update agent dashboard
  - [ ] Log transaction in accounting system

## Frontend UI Flow

### List Page (ConfirmedItineraries.tsx)
1. User clicks "Cancel Itinerary" button on any row
2. Modal opens with:
   - "Select All" toggle
   - 5 component checkboxes
   - Reason textarea
3. User fills in reason and selects components
4. User clicks "Confirm"
5. API call sent with selected options
6. Success dialog shows:
   - Cancellation Reference
   - Refund Amount
   - Breakdown of cancelled items
7. User clicks "Close"
8. List refreshes automatically

### Detail Page (ConfirmedItineraryDetails.tsx)
- Same flow as list page
- Returns to detail page after cancellation
- Status badge updates to "cancelled"

## Testing Scenarios

### Scenario 1: Full Cancellation
- Select All = true (all 5 components)
- Expected: All 5 items show count in breakdown
- Example: "Hotspots Cancelled: 5, Hotels Cancelled: 2, etc."

### Scenario 2: Partial Cancellation
- Select only Hotels and Vehicles
- Expected: Only those two show in breakdown
- Hotspots, Guides, Activities show 0 or don't appear

### Scenario 3: No Components Selected
- User can still cancel but with 0 items
- Creates record for audit purposes

### Scenario 4: Already Cancelled
- Return 409 error
- Frontend shows: "This itinerary is already cancelled"

### Scenario 5: Missing Reason
- Return 400 error
- Frontend shows: "Missing required fields: reason is required"

## Notes

- Frontend validates that reason is provided before sending request
- Refund amount should be 0 if full cancellation with all components, or partial if selective
- Cancellation reference format allows sorting/filtering by date and ID
- Success dialogs auto-close after user acknowledges
- No page reload needed - list auto-refreshes after cancellation
- Backend should use transactions to ensure atomic updates
- Store cancellation history for audit trails

## Backward Compatibility

The backend can continue accepting the old `cancel_*` boolean format for existing integrations. The new `cancellation_options` object is preferred but optional.

Legacy API calls will still work:
```json
{
  "itinerary_plan_ID": 123,
  "cancel_hotel": true,
  "cancel_hotspot": true,
  "cancellation_percentage": 10
}
```

But should be migrated to the new format over time.

---

# Hotel Voucher & Cancellation Policy System

## Overview

The system allows creating hotel vouchers with associated cancellation policies for confirmed itineraries. Each hotel can have multiple cancellation policies with different dates and percentages, matching the legacy PHP system.

## Database Tables Required

### 1. `dvi_confirmed_itinerary_plan_hotel_voucher_details`
Stores hotel voucher information:

```sql
CREATE TABLE dvi_confirmed_itinerary_plan_hotel_voucher_details (
  confirmed_itinerary_plan_hotel_voucher_ID INT PRIMARY KEY AUTO_INCREMENT,
  itinerary_plan_id INT NOT NULL,
  confirmed_itinerary_plan_hotel_details_ID VARCHAR(500), -- Comma-separated IDs
  hotel_id INT NOT NULL,
  hotel_confirmed_by VARCHAR(255),
  hotel_confirmed_email_id VARCHAR(255),
  hotel_confirmed_mobile_no VARCHAR(50),
  hotel_booking_status ENUM('confirmed', 'cancelled', 'pending') DEFAULT 'confirmed',
  invoice_to ENUM('gst_bill_against_dvi', 'hotel_direct', 'agent'),
  hotel_voucher_terms_condition TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status TINYINT(1) DEFAULT 1,
  deleted TINYINT(1) DEFAULT 0
);
```

### 2. `dvi_confirmed_itinerary_plan_hotel_cancellation_policy`
Stores cancellation policies for hotels:

```sql
CREATE TABLE dvi_confirmed_itinerary_plan_hotel_cancellation_policy (
  cnf_itinerary_plan_hotel_cancellation_policy_ID INT PRIMARY KEY AUTO_INCREMENT,
  itinerary_plan_id INT NOT NULL,
  hotel_id INT NOT NULL,
  cancellation_date DATE NOT NULL,
  cancellation_percentage DECIMAL(5,2) NOT NULL,
  cancellation_descrption TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status TINYINT(1) DEFAULT 1,
  deleted TINYINT(1) DEFAULT 0,
  INDEX idx_plan_hotel (itinerary_plan_id, hotel_id)
);
```

## API Endpoints

### 1. Get Hotel Cancellation Policies

**Endpoint**: `GET /api/hotel-voucher/cancellation-policies`

**Query Parameters**:
- `itineraryPlanId` (required): The itinerary plan ID
- `hotelId` (optional): Filter by specific hotel

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hotelId": 101,
      "hotelName": "JVK PARK",
      "cancellationDate": "2026-02-01",
      "cancellationPercentage": 10,
      "description": "Cancellation before 7 days - 10% deduction",
      "itineraryPlanId": 36041
    },
    {
      "id": 2,
      "hotelId": 102,
      "hotelName": "MUNNAR QUEEN",
      "cancellationDate": "2026-02-05",
      "cancellationPercentage": 25,
      "description": "Cancellation before 3 days - 25% deduction",
      "itineraryPlanId": 36041
    }
  ]
}
```

### 2. Add Cancellation Policy

**Endpoint**: `POST /api/hotel-voucher/cancellation-policy`

**Request Body**:
```json
{
  "itineraryPlanId": 36041,
  "hotelId": 101,
  "cancellationDate": "2026-02-01",
  "cancellationPercentage": 10,
  "description": "Cancellation before 7 days - 10% deduction"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "hotelId": 101,
    "hotelName": "JVK PARK",
    "cancellationDate": "2026-02-01",
    "cancellationPercentage": 10,
    "description": "Cancellation before 7 days - 10% deduction",
    "itineraryPlanId": 36041
  }
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Missing required fields: cancellationDate, cancellationPercentage, description"
}
```

### 3. Delete Cancellation Policy

**Endpoint**: `DELETE /api/hotel-voucher/cancellation-policy/:id`

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Cancellation policy deleted successfully"
}
```

**Error Response (404)**:
```json
{
  "success": false,
  "message": "Cancellation policy not found"
}
```

### 4. Get Hotel Voucher

**Endpoint**: `GET /api/hotel-voucher`

**Query Parameters**:
- `itineraryPlanId` (required): The itinerary plan ID
- `hotelId` (required): The hotel ID

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "itineraryPlanId": 36041,
    "hotelId": 101,
    "hotelName": "JVK PARK",
    "hotelEmail": "jvkpark@example.com",
    "hotelStateCity": "Cochin, Kerala",
    "routeDates": ["2026-02-06"],
    "dayNumbers": [1],
    "confirmedBy": "Shruti",
    "emailId": "cgm@jvkpark.com.vsr@dvi.co.in",
    "mobileNumber": "6235002438",
    "status": "confirmed",
    "invoiceTo": "gst_bill_against_dvi",
    "voucherTermsCondition": "<h3>Package Includes...</h3>",
    "hotelDetailsIds": [1707]
  }
}
```

**Error Response (404)**:
```json
{
  "success": true,
  "data": null
}
```

### 5. Create/Update Hotel Vouchers

**Endpoint**: `POST /api/hotel-voucher/create`

**Request Body**:
```json
{
  "itineraryPlanId": 36041,
  "vouchers": [
    {
      "hotelId": 101,
      "hotelDetailsIds": [1707],
      "routeDates": ["2026-02-06"],
      "confirmedBy": "Shruti",
      "emailId": "cgm@jvkpark.com.vsr@dvi.co.in",
      "mobileNumber": "6235002438",
      "status": "confirmed",
      "invoiceTo": "gst_bill_against_dvi",
      "voucherTermsCondition": "<h3>Package Includes: (Inclusion)</h3><p>All Hotel Taxes & Service Taxes</p>"
    }
  ]
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Hotel voucher successfully created and sent to respective hotels"
}
```

**Error Response (400)** - No Cancellation Policy:
```json
{
  "success": false,
  "message": "Please add at least one cancellation policy before creating voucher"
}
```

### 6. Get Default Voucher Terms

**Endpoint**: `GET /api/hotel-voucher/default-terms`

**Success Response (200)**:
```json
{
  "success": true,
  "data": "<h3>Package Includes: (Inclusion)</h3><ul><li>Accommodation on double/triple sharing basis</li>...</ul>"
}
```

## Frontend Implementation

### Components Created

#### 1. `HotelVoucherModal.tsx`
Main modal for creating hotel vouchers with:
- Hotel information display (Day numbers, hotel name, dates)
- Form fields:
  - Confirmed By (text)
  - Email ID (email)
  - Mobile Number (tel)
  - Status (select: confirmed/cancelled/pending)
  - Invoice To (select: gst_bill_against_dvi/hotel_direct/agent)
  - Hotel Voucher Terms and Condition (textarea with HTML)
- Cancellation Policy Table showing:
  - S.NO, HOTEL, CANCELLATION DATE, CANCELLATION %, DESCRIPTION, OPTIONS
- "+ Add Cancellation Policy" button
- Form validation
- Integration with mock service (ready for backend)

#### 2. `AddHotelCancellationPolicyModal.tsx`
Modal for adding individual cancellation policies:
- Hotel Name (read-only)
- Cancellation Date (date picker)
- Cancellation Percentage (number 0-100)
- Description (textarea)
- Validation and error handling

#### 3. `HotelVoucherService.ts`
Service layer with mock data containing:
- `getCancellationPolicies()` - Get all policies for itinerary
- `getHotelCancellationPolicies()` - Get policies for specific hotel
- `addCancellationPolicy()` - Add new policy
- `deleteCancellationPolicy()` - Remove policy
- `getHotelVoucher()` - Get existing voucher
- `createHotelVouchers()` - Create/update vouchers
- `getDefaultVoucherTerms()` - Get default terms template

### Integration Points

#### In `ItineraryDetails.tsx`:
- Added state for hotel voucher modal
- Added `HotelVoucherModal` component
- Passed `onCreateVoucher` callback to `HotelList`
- Opens modal when "Create Voucher" button clicked

#### In `HotelList.tsx`:
- Added `onCreateVoucher` prop
- Added "Create Voucher" button in each hotel row (visible in readonly/confirmed mode)
- Button extracts hotel data and calls parent callback

## Business Logic

### Voucher Creation Flow

1. User clicks "Create Voucher" button on a hotel row in confirmed itinerary
2. Modal opens with pre-filled hotel information
3. User fills in:
   - Confirmed By name
   - Email ID
   - Mobile Number
   - Status selection
   - Invoice To selection
   - Voucher terms (pre-filled with defaults)
4. User adds cancellation policies:
   - Click "+ Add Cancellation Policy"
   - Fill in date, percentage, description
   - Submit to add to table
5. Policies display in table with delete option
6. User clicks "Submit" to create voucher
7. Backend validates:
   - At least one cancellation policy exists
   - All required fields filled
8. Voucher created and email sent to hotel
9. Success message displayed

### Cancellation Policy Rules

- Multiple policies per hotel allowed
- Each policy has:
  - Specific cancellation date
  - Percentage deduction (0-100%)
  - Description explaining the terms
- Policies sorted by date (ascending)
- Can be deleted before voucher submission
- Mandatory: At least one policy required to create voucher

### Invoice Options

- **GST Bill Against DVI**: DVI handles GST billing
- **Hotel Direct**: Hotel bills directly to customer
- **Agent**: Agent handles billing

### Status Options

- **Confirmed**: Booking confirmed with hotel
- **Cancelled**: Booking cancelled (can set when creating voucher)
- **Pending**: Awaiting confirmation

## Implementation Checklist for Backend

### Database Setup
- [ ] Create `dvi_confirmed_itinerary_plan_hotel_voucher_details` table
- [ ] Create `dvi_confirmed_itinerary_plan_hotel_cancellation_policy` table
- [ ] Add foreign key constraints to itinerary_plan_id
- [ ] Add indexes for performance (itinerary_plan_id, hotel_id)

### API Endpoints
- [ ] `GET /api/hotel-voucher/cancellation-policies` - List policies
- [ ] `POST /api/hotel-voucher/cancellation-policy` - Add policy
- [ ] `DELETE /api/hotel-voucher/cancellation-policy/:id` - Delete policy
- [ ] `GET /api/hotel-voucher` - Get existing voucher
- [ ] `POST /api/hotel-voucher/create` - Create/update vouchers
- [ ] `GET /api/hotel-voucher/default-terms` - Get default terms template

### Business Logic
- [ ] Validate at least one cancellation policy exists before voucher creation
- [ ] Store multiple hotel details IDs as comma-separated string
- [ ] Calculate and validate percentage ranges (0-100)
- [ ] Handle date validations for cancellation dates
- [ ] Support multiple vouchers in single request (grouped by hotel)
- [ ] Update existing voucher if already exists (upsert logic)

### Email Notifications
- [ ] Send voucher email to hotel with:
  - Hotel details
  - Guest information
  - Check-in/Check-out dates
  - Room details
  - Voucher terms
  - Cancellation policy table
- [ ] CC to DVI team
- [ ] Professional HTML email template
- [ ] PDF attachment of voucher

### Data Retrieval
- [ ] Join with hotel master table for hotel details
- [ ] Fetch all cancellation policies for display in modal
- [ ] Group multiple dates/days per hotel
- [ ] Calculate day numbers from itinerary start date

### Error Handling
- [ ] 400: Missing required fields
- [ ] 400: No cancellation policy exists
- [ ] 404: Hotel/Itinerary not found
- [ ] 409: Voucher already exists (if not allowing updates)
- [ ] 500: Email send failure (should still save voucher)

## Testing Scenarios

### Scenario 1: Create New Voucher
1. User clicks "Create Voucher" for hotel
2. Modal loads with hotel info
3. User fills all fields
4. User adds 2 cancellation policies
5. User submits
6. Backend creates voucher and sends email
7. Success message displayed

### Scenario 2: Update Existing Voucher
1. User clicks "Create Voucher" for hotel with existing voucher
2. Modal loads with pre-filled data
3. User updates fields
4. User adds/deletes policies
5. User submits
6. Backend updates voucher
7. Updated email sent to hotel

### Scenario 3: No Cancellation Policy
1. User fills voucher form
2. User doesn't add any policy
3. User clicks submit
4. Error: "Please add at least one cancellation policy"
5. User adds policy and resubmits
6. Success

### Scenario 4: Multiple Hotels Same Day
1. Itinerary has 2 hotels for Day 1
2. User creates voucher for Hotel A
3. User creates voucher for Hotel B
4. Both stored independently
5. Each sent separate emails

### Scenario 5: Multi-day Hotel
1. Hotel spans Days 1, 2, 3
2. Voucher shows "Days 1, 2, 3"
3. Single voucher covers all dates
4. Email includes all check-in/out dates

## Frontend Mock Data

Currently using `src/services/hotelVoucher.ts` with mock data:
- 2 sample cancellation policies
- In-memory storage for testing
- Simulated API delays (300-800ms)
- Ready to replace with real API calls

### Migration to Real API

Replace mock service functions with:
```typescript
// Example for getCancellationPolicies
export const HotelVoucherService = {
  getCancellationPolicies: async (itineraryPlanId: number) => {
    const response = await api.get('/hotel-voucher/cancellation-policies', {
      params: { itineraryPlanId }
    });
    return response.data.data;
  },
  // ... other methods
};
```

## UI/UX Features

- ✅ Day numbers calculated from itinerary dates
- ✅ Hotel information pre-filled from itinerary
- ✅ Rich text support for voucher terms
- ✅ Cancellation policy table with CRUD operations
- ✅ Form validation with error messages
- ✅ Loading states for async operations
- ✅ Success/error toasts
- ✅ Responsive modal design
- ✅ Readonly mode for confirmed itineraries
- ✅ Create Voucher button visible only in confirmed mode

## Notes

- Frontend uses mock data - ready for backend integration
- All API contracts defined with request/response formats
- Follows legacy PHP system structure and terminology
- Email functionality mentioned but not implemented in frontend
- Supports both single and multiple hotel vouchers
- Cancellation policies are required before voucher creation
- Invoice options match legacy system
- Status tracking for booking lifecycle

---

# Hotel Voucher System - Complete Flow Diagrams

## Overview of Trigger Points

The Hotel Voucher system is triggered when:
1. **Itinerary Status = Confirmed** (isConfirmed = true OR status = 'confirmed')
2. **User navigates to ItineraryDetails page** in readonly/confirmed mode
3. **User clicks "Create Voucher" button** next to a hotel in the HotelList component

## Flow 1: Page Load & Component Initialization

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER NAVIGATES TO PAGE                        │
│                 /itineraries/:quoteId (Confirmed)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ItineraryDetails.tsx - Component Mount              │
├─────────────────────────────────────────────────────────────────┤
│  1. useParams() → Extract quoteId                               │
│  2. useEffect() → fetchDetails()                                 │
│  3. API Call: GET /itineraries/details/:quoteId                 │
│  4. Set state:                                                   │
│     - itinerary data                                             │
│     - isConfirmed = true (if status = 'confirmed')              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Render HotelList Component (Readonly Mode)          │
├─────────────────────────────────────────────────────────────────┤
│  Props passed:                                                   │
│    - hotels: Array<HotelRow>                                     │
│    - readOnly: true (because isConfirmed = true)                │
│    - onCreateVoucher: callback function                          │
│    - planId: itinerary.planId                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   HotelList.tsx - Render                         │
├─────────────────────────────────────────────────────────────────┤
│  Conditional Rendering:                                          │
│    IF readOnly = true AND onCreateVoucher exists:               │
│      ✅ Show "Create Voucher" button for each hotel row         │
│    ELSE:                                                         │
│      ❌ Hide voucher button (edit mode)                         │
│                                                                  │
│  Table Display:                                                  │
│    Day | Destination | Hotel Name | Room Type | [Create Voucher]│
└─────────────────────────────────────────────────────────────────┘
```

## Flow 2: User Clicks "Create Voucher" Button

```
┌─────────────────────────────────────────────────────────────────┐
│        USER ACTION: Click "Create Voucher" Button               │
│        (In HotelList row for specific hotel)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│             HotelList.tsx - Button Click Handler                 │
├─────────────────────────────────────────────────────────────────┤
│  Extract hotel data from current row:                            │
│    {                                                             │
│      hotelId: hotel.hotelId,              // e.g., 101          │
│      hotelName: hotel.hotelName,          // e.g., "JVK PARK"   │
│      hotelEmail: '',                      // Default empty      │
│      hotelStateCity: hotel.destination,   // e.g., "Cochin"     │
│      routeDates: [hotel.date],            // e.g., ["2026-02-06"]│
│      dayNumbers: [parsedDayNumber],       // e.g., [1]          │
│      hotelDetailsIds: [hotel.itineraryPlanHotelDetailsId] // [1707]│
│    }                                                             │
│                                                                  │
│  Call: onCreateVoucher(hotelData) → Parent callback             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         ItineraryDetails.tsx - onCreateVoucher Callback          │
├─────────────────────────────────────────────────────────────────┤
│  setSelectedHotelForVoucher(hotelData)  // Store hotel data     │
│  setHotelVoucherModalOpen(true)         // Open modal           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          HotelVoucherModal.tsx - Modal Opens                     │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 3: Hotel Voucher Modal - Data Loading

```
┌─────────────────────────────────────────────────────────────────┐
│            HotelVoucherModal - Component Mount                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 useEffect Hook (on modal open)                   │
├─────────────────────────────────────────────────────────────────┤
│  IF open = true:                                                 │
│    loadVoucherData()                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              loadVoucherData() - Parallel API Calls              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Call 1: Get Existing Voucher (if any)              │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  Request:                                                │   │
│  │    GET /api/hotel-voucher                               │   │
│  │    ?itineraryPlanId=36041&hotelId=101                   │   │
│  │                                                          │   │
│  │  Response (if exists):                                   │   │
│  │    {                                                     │   │
│  │      confirmedBy: "Shruti",                             │   │
│  │      emailId: "hotel@example.com",                      │   │
│  │      mobileNumber: "6235002438",                        │   │
│  │      status: "confirmed",                               │   │
│  │      invoiceTo: "gst_bill_against_dvi",                 │   │
│  │      voucherTermsCondition: "<html>..."                 │   │
│  │    }                                                     │   │
│  │                                                          │   │
│  │  Action:                                                 │   │
│  │    - Pre-fill form fields with existing data            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Call 2: Get Default Terms (if no existing voucher) │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  Request:                                                │   │
│  │    GET /api/hotel-voucher/default-terms                 │   │
│  │                                                          │   │
│  │  Response:                                               │   │
│  │    {                                                     │   │
│  │      success: true,                                      │   │
│  │      data: "<h3>Package Includes...</h3>"               │   │
│  │    }                                                     │   │
│  │                                                          │   │
│  │  Action:                                                 │   │
│  │    - Set voucherTerms state with default HTML           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Call 3: Get Cancellation Policies                  │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  Request:                                                │   │
│  │    GET /api/hotel-voucher/cancellation-policies         │   │
│  │    ?itineraryPlanId=36041&hotelId=101                   │   │
│  │                                                          │   │
│  │  Response:                                               │   │
│  │    {                                                     │   │
│  │      success: true,                                      │   │
│  │      data: [                                             │   │
│  │        {                                                 │   │
│  │          id: 1,                                          │   │
│  │          hotelName: "JVK PARK",                         │   │
│  │          cancellationDate: "2026-02-01",                │   │
│  │          cancellationPercentage: 10,                    │   │
│  │          description: "Before 7 days - 10% deduction"   │   │
│  │        }                                                 │   │
│  │      ]                                                   │   │
│  │    }                                                     │   │
│  │                                                          │   │
│  │  Action:                                                 │   │
│  │    - Populate cancellation policy table                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Modal Renders with Data                          │
├─────────────────────────────────────────────────────────────────┤
│  Header:                                                         │
│    "Day 1 | [JVK PARK - Cochin] | Feb 06, 2026"                │
│                                                                  │
│  Form Fields (pre-filled if existing):                          │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ Confirmed By: [Shruti                    ]           │    │
│    │ Email ID:     [hotel@example.com         ]           │    │
│    │ Mobile Number:[6235002438                ]           │    │
│    │ Status:       [Confirmed ▼               ]           │    │
│    │ Invoice To:   [GST Bill Against DVI ▼   ]           │    │
│    │ Terms:        [<h3>Package Includes...</h3>]         │    │
│    └──────────────────────────────────────────────────────┘    │
│                                                                  │
│  Cancellation Policy Table:                                     │
│    ┌──────┬──────────┬───────┬──────┬──────────┬────────┐     │
│    │ S.NO │ HOTEL    │ DATE  │  %   │ DESC     │ DELETE │     │
│    ├──────┼──────────┼───────┼──────┼──────────┼────────┤     │
│    │  1   │ JVK PARK │ 02/01 │ 10%  │ Before...│  [🗑]  │     │
│    └──────┴──────────┴───────┴──────┴──────────┴────────┘     │
│                                                                  │
│  Buttons:                                                        │
│    [+ Add Cancellation Policy]  [Cancel]  [Submit]             │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 4: Add Cancellation Policy Sub-Flow

```
┌─────────────────────────────────────────────────────────────────┐
│    USER CLICKS: "+ Add Cancellation Policy" Button              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│       AddHotelCancellationPolicyModal Opens                      │
├─────────────────────────────────────────────────────────────────┤
│  Props received:                                                 │
│    - itineraryPlanId: 36041                                      │
│    - hotelId: 101                                                │
│    - hotelName: "JVK PARK"                                       │
│    - onSuccess: loadCancellationPolicies (callback)              │
│                                                                  │
│  Form Fields:                                                    │
│    ┌─────────────────────────────────────────────────────┐     │
│    │ Hotel Name: [JVK PARK] (read-only)                  │     │
│    │ Cancellation Date: [____-__-__] 📅                  │     │
│    │ Cancellation %: [____] % (0-100)                    │     │
│    │ Description: [_________________________]            │     │
│    │              [_________________________]            │     │
│    └─────────────────────────────────────────────────────┘     │
│                                                                  │
│  Buttons: [Cancel]  [Add Policy]                               │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ User fills form
                             │ Clicks "Add Policy"
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Form Validation & Submission                        │
├─────────────────────────────────────────────────────────────────┤
│  Validate:                                                       │
│    ✓ Date not empty                                             │
│    ✓ Percentage 0-100                                           │
│    ✓ Description not empty                                      │
│                                                                  │
│  IF valid:                                                       │
│    ┌──────────────────────────────────────────────────────┐   │
│    │  API Call: Add Cancellation Policy                   │   │
│    │  ──────────────────────────────────────────────────  │   │
│    │  Request:                                             │   │
│    │    POST /api/hotel-voucher/cancellation-policy       │   │
│    │    Body: {                                            │   │
│    │      itineraryPlanId: 36041,                         │   │
│    │      hotelId: 101,                                    │   │
│    │      cancellationDate: "2026-02-01",                 │   │
│    │      cancellationPercentage: 10,                     │   │
│    │      description: "Before 7 days - 10% deduction"    │   │
│    │    }                                                  │   │
│    │                                                       │   │
│    │  Response:                                            │   │
│    │    {                                                  │   │
│    │      success: true,                                   │   │
│    │      data: { id: 3, ...policyData }                  │   │
│    │    }                                                  │   │
│    └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Success Actions                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. Show toast: "Cancellation policy added successfully"        │
│  2. Close AddHotelCancellationPolicyModal                       │
│  3. Call onSuccess() callback                                    │
│     → Triggers loadCancellationPolicies() in parent              │
│  4. Parent fetches updated policy list                           │
│  5. Table refreshes with new policy row                          │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 5: Delete Cancellation Policy Sub-Flow

```
┌─────────────────────────────────────────────────────────────────┐
│    USER CLICKS: [🗑] Delete icon in policy table row            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Confirmation Dialog (Browser native)                │
├─────────────────────────────────────────────────────────────────┤
│  "Are you sure you want to delete this cancellation policy?"    │
│                                                                  │
│         [Cancel]                [OK]                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ IF user clicks OK
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           API Call: Delete Cancellation Policy                   │
├─────────────────────────────────────────────────────────────────┤
│  Request:                                                        │
│    DELETE /api/hotel-voucher/cancellation-policy/:id            │
│    Example: DELETE /api/hotel-voucher/cancellation-policy/3     │
│                                                                  │
│  Response:                                                       │
│    {                                                             │
│      success: true,                                              │
│      message: "Cancellation policy deleted successfully"         │
│    }                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Success Actions                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. Show toast: "Cancellation policy deleted successfully"      │
│  2. Refresh policy list (API call)                               │
│  3. Remove row from table (UI update)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 6: Submit Hotel Voucher (Final Step)

```
┌─────────────────────────────────────────────────────────────────┐
│         USER CLICKS: "Submit" Button in Main Modal               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Form Validation (Client-side)                  │
├─────────────────────────────────────────────────────────────────┤
│  Check:                                                          │
│    ✓ confirmedBy not empty                                      │
│    ✓ emailId valid format                                       │
│    ✓ mobileNumber not empty                                     │
│    ✓ At least 1 cancellation policy exists                      │
│                                                                  │
│  IF any validation fails:                                        │
│    → Show error toast                                            │
│    → Stop submission                                             │
│                                                                  │
│  IF all valid:                                                   │
│    → Proceed to API call                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            Prepare Voucher Data Payload                          │
├─────────────────────────────────────────────────────────────────┤
│  Build request body:                                             │
│  {                                                               │
│    itineraryPlanId: 36041,                                       │
│    vouchers: [                                                   │
│      {                                                           │
│        hotelId: 101,                                             │
│        hotelDetailsIds: [1707],                                  │
│        routeDates: ["2026-02-06"],                               │
│        confirmedBy: "Shruti",                                    │
│        emailId: "cgm@jvkpark.com.vsr@dvi.co.in",                │
│        mobileNumber: "6235002438",                               │
│        status: "confirmed",                                      │
│        invoiceTo: "gst_bill_against_dvi",                        │
│        voucherTermsCondition: "<h3>Package Includes...</h3>"     │
│      }                                                           │
│    ]                                                             │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│             API Call: Create Hotel Voucher                       │
├─────────────────────────────────────────────────────────────────┤
│  Request:                                                        │
│    POST /api/hotel-voucher/create                               │
│    Body: { ...payload from above }                              │
│                                                                  │
│  Backend Processing:                                             │
│    1. Validate itineraryPlanId exists                           │
│    2. Check cancellation policies exist (query DB)              │
│    3. IF no policies:                                            │
│         → Return 400 error                                       │
│    4. ELSE:                                                      │
│         → Upsert voucher record in DB                           │
│         → Generate voucher PDF                                   │
│         → Send email to hotel with PDF attachment               │
│         → CC DVI team                                            │
│         → Return success response                                │
│                                                                  │
│  Success Response:                                               │
│    {                                                             │
│      success: true,                                              │
│      message: "Hotel voucher successfully created and sent..."   │
│    }                                                             │
│                                                                  │
│  Error Response (No Policies):                                   │
│    {                                                             │
│      success: false,                                             │
│      message: "Please add at least one cancellation policy..."   │
│    }                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Handle Response                               │
├─────────────────────────────────────────────────────────────────┤
│  IF success = true:                                              │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ 1. Show success toast with message                   │    │
│    │ 2. Close HotelVoucherModal                           │    │
│    │ 3. Call onSuccess() callback                         │    │
│    │    → ItineraryDetails.fetchDetails()                 │    │
│    │    → Refresh entire page data                        │    │
│    │ 4. Reset modal state                                 │    │
│    └──────────────────────────────────────────────────────┘    │
│                                                                  │
│  IF success = false:                                             │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ 1. Show error toast with backend message             │    │
│    │ 2. Keep modal open                                    │    │
│    │ 3. User can add policies or fix errors               │    │
│    └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 7: Backend Email Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│         Backend: Voucher Created Successfully                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Generate Voucher PDF Document                       │
├─────────────────────────────────────────────────────────────────┤
│  Template includes:                                              │
│    • DVI Logo & Header                                           │
│    • Booking Reference: #DVI01202620                             │
│    • Guest Name: Vinayak Maid                                    │
│    • Check-in Date: Feb 06, 2026                                 │
│    • Check-out Date: Feb 07, 2026                                │
│    • Hotel Details:                                              │
│      - Name: JVK PARK                                            │
│      - Location: Cochin, Kerala                                  │
│      - Room Type: Deluxe Room                                    │
│      - Number of Rooms: 2                                        │
│    • Confirmed By: Shruti                                        │
│    • Contact: 6235002438 | cgm@jvkpark.com.vsr@dvi.co.in       │
│    • Voucher Terms & Conditions (HTML rendered)                  │
│    • Cancellation Policy Table:                                  │
│      ┌────────────────────────────────────────────────────┐    │
│      │ Date       │ Percentage │ Description              │    │
│      ├────────────┼────────────┼──────────────────────────┤    │
│      │ 2026-02-01 │    10%     │ Before 7 days - 10%...  │    │
│      │ 2026-01-30 │    25%     │ Before 7 days - 25%...  │    │
│      └────────────────────────────────────────────────────┘    │
│    • DVI Footer with contact information                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Send Email to Hotel                            │
├─────────────────────────────────────────────────────────────────┤
│  To: cgm@jvkpark.com.vsr@dvi.co.in (hotel email)                │
│  CC: bookings@dvi.co.in, admin@dvi.co.in                        │
│  Subject: Hotel Voucher - Booking #DVI01202620 - JVK PARK       │
│                                                                  │
│  Email Body (HTML):                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Dear Hotel Manager,                                      │   │
│  │                                                           │   │
│  │ Please find attached the hotel voucher for the           │   │
│  │ following booking:                                        │   │
│  │                                                           │   │
│  │ Guest Name: Vinayak Maid                                 │   │
│  │ Check-in: Feb 06, 2026 (2:00 PM)                         │   │
│  │ Check-out: Feb 07, 2026 (12:00 PM)                       │   │
│  │ Room Type: Deluxe Room (2 Rooms)                         │   │
│  │                                                           │   │
│  │ Confirmed By: Shruti                                      │   │
│  │ Contact: 6235002438                                       │   │
│  │                                                           │   │
│  │ Please confirm receipt of this voucher.                   │   │
│  │                                                           │   │
│  │ Best Regards,                                             │   │
│  │ DVI Holidays Team                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Attachment: hotel_voucher_DVI01202620.pdf (2.1 MB)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Log Email Activity                             │
├─────────────────────────────────────────────────────────────────┤
│  Store in database:                                              │
│    • email_log_id                                                │
│    • itinerary_plan_id: 36041                                    │
│    • hotel_id: 101                                               │
│    • email_to: cgm@jvkpark.com.vsr@dvi.co.in                    │
│    • email_status: 'sent' / 'failed'                            │
│    • sent_at: 2026-01-14 10:30:45                               │
│    • attachment_path: /uploads/vouchers/...pdf                   │
└─────────────────────────────────────────────────────────────────┘
```

## Complete System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          HOTEL VOUCHER SYSTEM                              │
│                          Complete Architecture                             │
└───────────────────────────────────────────────────────────────────────────┘

                              USER BROWSER
                                   │
                                   │ 1. Navigate to confirmed itinerary
                                   ▼
                    ┌──────────────────────────────┐
                    │  ItineraryDetails.tsx        │
                    │  ─────────────────────────   │
                    │  State:                      │
                    │  • isConfirmed = true        │
                    │  • hotelVoucherModalOpen     │
                    │  • selectedHotelForVoucher   │
                    └───────────┬──────────────────┘
                                │
                                │ 2. Render with readOnly=true
                                ▼
                    ┌──────────────────────────────┐
                    │  HotelList.tsx               │
                    │  ─────────────────────────   │
                    │  Displays hotels with:       │
                    │  [Create Voucher] buttons    │
                    └───────────┬──────────────────┘
                                │
                                │ 3. Click Create Voucher
                                ▼
                    ┌──────────────────────────────┐
                    │  HotelVoucherModal.tsx       │◄─────┐
                    │  ─────────────────────────   │      │
                    │  • Load existing data        │      │
                    │  • Show form                 │      │
                    │  • Policy table              │      │
                    │  • [+ Add Policy] button     │      │
                    └───────────┬──────────────────┘      │
                                │                          │
                                │ 4. Click Add Policy      │
                                ▼                          │
          ┌──────────────────────────────────────┐        │
          │ AddHotelCancellationPolicyModal      │        │
          │ ───────────────────────────────────  │        │
          │ • Date picker                        │        │
          │ • Percentage input                   │        │
          │ • Description                        │        │
          └───────────┬──────────────────────────┘        │
                      │                                    │
                      │ 5. Submit policy                   │
                      ▼                                    │
          ┌────────────────────────────┐                  │
          │  HotelVoucherService.ts    │                  │
          │  ────────────────────────  │◄─────────────────┘
          │  • addCancellationPolicy() │  6. Refresh policies
          │  • getCancellationPolicies()│
          │  • createHotelVouchers()    │
          └─────────────┬──────────────┘
                        │
                        │ 7. API Calls (Mock or Real)
                        ▼
            ┌───────────────────────────────────┐
            │      BACKEND API SERVER            │
            │      ─────────────────────────     │
            │  Endpoints:                        │
            │  • POST /hotel-voucher/            │
            │         cancellation-policy        │
            │  • GET  /hotel-voucher/            │
            │         cancellation-policies      │
            │  • DELETE /hotel-voucher/          │
            │         cancellation-policy/:id    │
            │  • GET  /hotel-voucher             │
            │  • POST /hotel-voucher/create      │
            │  • GET  /hotel-voucher/            │
            │         default-terms              │
            └─────────────┬─────────────────────┘
                          │
                          │ 8. Database Operations
                          ▼
              ┌──────────────────────────────┐
              │      DATABASE (MySQL)         │
              │      ──────────────────────   │
              │  Tables:                      │
              │  • dvi_confirmed_itinerary_   │
              │    plan_hotel_voucher_details │
              │  • dvi_confirmed_itinerary_   │
              │    plan_hotel_cancellation_   │
              │    policy                     │
              │  • dvi_confirmed_itinerary_   │
              │    plan_hotel_details         │
              │  • dvi_hotel_master           │
              └──────────────┬────────────────┘
                             │
                             │ 9. After voucher created
                             ▼
              ┌──────────────────────────────┐
              │   EMAIL SERVICE (SMTP)        │
              │   ────────────────────────   │
              │  • Generate PDF voucher       │
              │  • Send to hotel email        │
              │  • CC to DVI team             │
              │  • Log email status           │
              └───────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Component State Lifecycle                           │
└─────────────────────────────────────────────────────────────────┘

ItineraryDetails.tsx
├─ hotelVoucherModalOpen: boolean = false
│  └─ Changes to: true → Opens modal
│     Changes to: false → Closes modal
│
└─ selectedHotelForVoucher: HotelVoucherData | null = null
   └─ Stores: { hotelId, hotelName, email, dates, etc. }
      Used by: HotelVoucherModal as props

HotelVoucherModal.tsx
├─ confirmedBy: string = ""
├─ emailId: string = hotelEmail (from props)
├─ mobileNumber: string = ""
├─ status: 'confirmed' | 'cancelled' | 'pending' = 'confirmed'
├─ invoiceTo: string = 'gst_bill_against_dvi'
├─ voucherTerms: string = "<html>...</html>"
├─ cancellationPolicies: Array<Policy> = []
├─ isLoading: boolean = true/false
├─ isSubmitting: boolean = true/false
└─ showAddPolicyModal: boolean = false
   └─ Changes to: true → Opens AddHotelCancellationPolicyModal

AddHotelCancellationPolicyModal.tsx
├─ cancellationDate: string = ""
├─ cancellationPercentage: string = ""
├─ description: string = ""
└─ isSubmitting: boolean = false

Data Flow:
1. User action → Update local state
2. Local state → API call (on submit/save)
3. API response → Update state + Show feedback
4. State change → Re-render UI
```

## Key Trigger Conditions Summary

| Condition | Result |
|-----------|--------|
| `itinerary.isConfirmed = true` | HotelList renders in readonly mode |
| `itinerary.status = 'confirmed'` | "Create Voucher" buttons appear |
| `readOnly = true` AND `onCreateVoucher exists` | Voucher buttons visible |
| `readOnly = false` | Voucher buttons hidden (edit mode) |
| User clicks "Create Voucher" | Modal opens with hotel data |
| Modal opens (`open = true`) | Triggers useEffect → Load data |
| User clicks "+ Add Policy" | Sub-modal opens |
| Policy added successfully | Main modal table refreshes |
| User clicks "Submit" | Validates → API call → Email sent |
| Voucher created | Modal closes → Page refreshes |

## Performance Considerations

```
Optimization Points:
├─ Modal Data Loading
│  ├─ Parallel API calls (Promise.all)
│  ├─ Cache default terms (single fetch)
│  └─ Debounce policy refresh (avoid spam)
│
├─ Form State Management
│  ├─ Controlled inputs (React state)
│  ├─ Validation on blur + submit
│  └─ Optimistic UI updates
│
└─ API Calls
   ├─ Mock service with delays (300-800ms)
   ├─ Loading states prevent double-clicks
   └─ Error boundaries for failed calls
```



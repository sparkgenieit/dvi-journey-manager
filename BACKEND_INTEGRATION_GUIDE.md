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

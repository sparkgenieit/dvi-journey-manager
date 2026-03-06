# Locations Module Frontend-Backend Integration Summary

## Frontend Changes Completed

### 1. Service Layer Updated (`src/services/locations.ts`)
- ✅ Added new type `CreateLocationPayload` (source-only fields)
- ✅ Updated `locationsApi.create()` to accept `CreateLocationPayload` instead of full `LocationRow`
- ✅ Maintains backward compatibility for other endpoints

### 2. UI Components Aligned
- ✅ `AddLocationDialog.tsx` - Now only collects and sends 5 source fields
- ✅ `EditLocationDialog.tsx` - Accepts and sends full location data (including destination)
- ✅ `LocationsPreviewPage.tsx` - Displays location details and manages toll charges

### 3. API Endpoints Mapped
The frontend now expects these exact endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/locations` | List locations with filters & pagination |
| GET | `/locations/dropdowns` | Get source/destination dropdowns |
| GET | `/locations/:id` | Fetch single location |
| POST | `/locations` | Create new location (source-only) ✨ |
| PATCH | `/locations/:id` | Update location (full or partial) |
| DELETE | `/locations/:id` | Delete location |
| PATCH | `/locations/:id/modify-name` | Update location name (legacy feature) |
| GET | `/locations/:id/tolls` | Get toll charges |
| POST | `/locations/:id/tolls` | Save toll charges |

**✨ KEY CHANGE**: POST /locations now receives **source fields only** (no destination/distance/duration)

## Frontend Type Contracts

```typescript
// Source-only payload for Add Location modal
export type CreateLocationPayload = {
  source_location: string;
  source_city: string;
  source_state: string;
  source_latitude: string;
  source_longitude: string;
};

// Full location row (returned by all GET/PATCH endpoints)
export type LocationRow = {
  location_ID: number;
  source_location: string;
  source_city: string;
  source_state: string;
  source_latitude: string;
  source_longitude: string;
  destination_location: string;
  destination_city: string;
  destination_state: string;
  destination_latitude: string;
  destination_longitude: string;
  distance_km: number;
  duration_text: string;
  location_description?: string | null;
};

// Toll charge row
export type TollRow = {
  vehicle_type_id: number;
  vehicle_type_name: string;
  toll_charge: number;
};
```

## What Backend Needs to Implement

Use the file: **`BACKEND_LOCATIONS_API_IMPLEMENTATION_PROMPT.md`**

This is a copy-paste-ready prompt for backend development containing:
- ✅ All 9 endpoints with exact request/response shapes
- ✅ Field name mappings and normalization rules
- ✅ Query param specifications
- ✅ Pagination expectations
- ✅ Error handling defaults
- ✅ Testing checklist

### Quick Start for Backend Team
1. Read `BACKEND_LOCATIONS_API_IMPLEMENTATION_PROMPT.md`
2. Implement or verify each endpoint matches the spec
3. Return list of files created/modified
4. Test with attached checklist

## Build Status

✅ **Frontend builds successfully**
- All TypeScript types correct
- No compilation errors
- Ready for backend integration testing

## Files Modified

1. `src/services/locations.ts` - Added `CreateLocationPayload` type, updated `create()` signature
2. `src/pages/locations/components/AddLocationDialog.tsx` - Simplified form to source-only fields
3. `BACKEND_LOCATIONS_API_IMPLEMENTATION_PROMPT.md` - Created (backend reference)
4. This file - Integration summary

## Next Steps

1. **Backend Team**: Review `BACKEND_LOCATIONS_API_IMPLEMENTATION_PROMPT.md`
2. **Backend Team**: Implement/verify the 9 endpoints
3. **Backend Team**: Test endpoints using provided checklist
4. **Frontend Team**: Run frontend and test against backend
5. **QA**: Verify full flow (Add → List → Edit → Preview → Tolls)

## Testing the Integration

Once backend is ready:
```bash
# Frontend dev server
npm run dev

# Browser: http://localhost:5173
# Navigate to: Dashboard > Locations
# Test flow:
# 1. Click "Add Locations" → fill source fields only → Save
# 2. See new location in list
# 3. Click eye icon → see preview page with all details
# 4. Edit toll charges → save
# 5. Go back to list, click edit pencil → modify all fields → Update
```

---

**Generated**: March 4, 2026
**Status**: Ready for Backend Implementation

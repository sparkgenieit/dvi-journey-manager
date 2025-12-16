# Via Routes Architecture - Updated Design

## Summary
Via routes are now stored **only in frontend state** and saved to the database **only when the itinerary is submitted**. The session_id concept has been completely removed.

---

## Frontend Flow

### 1. User Selects Via Routes
When a user clicks the "VIA ROUTE" button in the route details table:

1. **ViaRouteDialog** opens
2. User selects via route locations from dropdown
3. Selected routes are validated against distance limits via API
4. On submit, via routes are **stored only in component state** (not saved to DB)

### 2. State Storage
```typescript
type RouteRow = {
  id: number;
  day: number;
  date: string;
  source: string;
  next: string;
  via: string; // display text: "Location1, Location2"
  via_routes: ViaRouteItem[]; // array for backend
  directVisit: "Yes" | "No";
};

type ViaRouteItem = {
  itinerary_via_location_ID: number;
  itinerary_via_location_name: string;
};
```

### 3. Itinerary Submission
When the user clicks "Create Itinerary":

```typescript
const routes = routeDetails.map((r) => ({
  location_name: r.source,
  next_visiting_location: r.next,
  itinerary_route_date: toISOFromDDMMYYYY(r.date),
  no_of_days: r.day,
  direct_to_next_visiting_place: r.directVisit === "Yes" ? 1 : 0,
  via_route: r.via, // comma-separated names
  via_routes: r.via_routes || [], // array of via route objects
}));

// POST to /api/v1/itineraries
// Entire plan + routes + via_routes sent together
```

---

## Backend Flow

### 1. Itinerary Creation Endpoint
```typescript
POST /api/v1/itineraries
```

Payload:
```json
{
  "plan": { /* plan details */ },
  "routes": [
    {
      "location_name": "Chennai",
      "next_visiting_location": "Bangalore",
      "via_routes": [
        {
          "itinerary_via_location_ID": 34,
          "itinerary_via_location_name": "Kanchipuram"
        }
      ]
    }
  ],
  "vehicles": [...],
  "travellers": [...]
}
```

### 2. Database Transaction
```typescript
async createPlan(dto: CreateItineraryDto) {
  await this.prisma.$transaction(async (tx) => {
    // 1. Create plan header
    const planId = await this.planEngine.upsertPlanHeader(...);
    
    // 2. Create routes
    const routes = await this.routeEngine.rebuildRoutes(...);
    
    // 3. Create via routes (NEW - no session_id needed)
    await this.viaRoutesEngine.rebuildViaRoutes(
      tx, 
      planId, 
      dto.routes, 
      routeIds, 
      userId
    );
    
    // 4. Continue with travellers, vehicles, hotels, hotspots...
  });
}
```

### 3. Via Routes Engine
```typescript
// src/modules/itineraries/engines/via-routes.engine.ts
async rebuildViaRoutes(
  tx: any,
  planId: number,
  routes: CreateRouteDto[],
  routeIds: number[],
  userId: number,
): Promise<void> {
  // 1. Delete old via routes for this plan
  await tx.dvi_itinerary_via_route_details.updateMany({
    where: { itinerary_plan_ID: planId },
    data: { deleted: 1 },
  });

  // 2. Insert new via routes from routes[].via_routes arrays
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const routeId = routeIds[i];

    if (!route.via_routes || route.via_routes.length === 0) continue;

    for (const viaRoute of route.via_routes) {
      await tx.dvi_itinerary_via_route_details.create({
        data: {
          itinerary_plan_ID: planId,
          itinerary_route_ID: routeId,
          itinerary_route_date: new Date(route.itinerary_route_date),
          source_location: route.location_name,
          destination_location: route.next_visiting_location,
          itinerary_via_location_ID: viaRoute.itinerary_via_location_ID,
          itinerary_via_location_name: viaRoute.itinerary_via_location_name,
          createdby: userId,
          status: 1,
          deleted: 0,
        },
      });
    }
  }
}
```

---

## Database Tables

### dvi_stored_locations
Stores route pairs with coordinates for lookup
- `location_ID` (BigInt, PK)
- `source_location` (String)
- `destination_location` (String)
- Coordinates for both source and destination

### dvi_stored_location_via_routes
Stores available via route options for each route pair
- `via_route_location_ID` (BigInt, PK)
- `location_id` (BigInt, FK → dvi_stored_locations.location_ID)
- `via_route_location` (String)

### dvi_itinerary_via_route_details
Stores selected via routes for actual itineraries
- `itinerary_via_route_ID` (Int, PK)
- `itinerary_plan_ID` (Int)
- `itinerary_route_ID` (Int)
- `itinerary_via_location_ID` (Int)
- `itinerary_via_location_name` (String)
- **No longer uses**: `itinerary_session_id`

---

## APIs Used

### GET /api/v1/itinerary-via-routes/form
Fetches available via route options for a route pair
```typescript
Query Params:
- selected_source_location: string
- selected_next_visiting_location: string
- itinerary_plan_ID: number (for edit mode)
- itinerary_route_ID: number (for edit mode)

Response:
{
  "success": true,
  "data": {
    "existing": [], // saved via routes (edit mode)
    "options": [    // available via routes
      { "id": "34", "label": "Kanchipuram" }
    ]
  }
}
```

### POST /api/v1/itinerary-via-routes/check-distance-limit
Validates via routes don't exceed distance limit
```typescript
Body:
{
  "source": "Chennai",
  "destination": "Bangalore",
  "via_routes": ["34", "35"]
}

Response:
{
  "success": true
}
// OR
{
  "success": false,
  "errors": { "result_error": "Distance KM Limit Exceeded !!!" }
}
```

### ~~POST /api/v1/itinerary-via-routes/add~~ (DEPRECATED)
**This endpoint is no longer used by the frontend**
Previously saved via routes immediately with session_id - now obsolete

---

## Benefits of New Architecture

✅ **No orphaned data** - Via routes only saved when itinerary is created
✅ **No session management** - Removed session_id generation and storage
✅ **Simpler flow** - All data submitted together in one transaction
✅ **Better UX** - User can modify via routes freely before final submit
✅ **Cleaner database** - No temporary via route records cluttering the DB
✅ **Atomic operations** - Via routes created in same transaction as itinerary

---

## Files Modified

### Frontend
- `CreateItinerary.tsx` - Removed session_id state and import
- `helpers/useItineraryRoutes.ts` - Removed session_id param, removed API calls to /add endpoint
- `helpers/itineraryUtils.ts` - Removed getOrCreateItinerarySessionId function
- `ViaRouteDialog.tsx` - No changes needed (already stores in state)

### Backend
- `via-routes.engine.ts` - Already handles via_routes array correctly
- No changes needed - existing code already works with new approach

---

## Testing Checklist

- [x] Via route dialog opens and loads options
- [x] Distance validation works before saving to state
- [ ] Via routes stored in component state correctly
- [ ] Via routes submitted with itinerary creation
- [ ] Via routes saved to database on itinerary submit
- [ ] Via routes loaded correctly when editing existing itinerary
- [ ] No session_id references in code or database

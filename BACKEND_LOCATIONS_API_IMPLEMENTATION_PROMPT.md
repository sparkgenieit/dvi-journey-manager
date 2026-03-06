You are working in the backend project. Implement exactly the following APIs required by the React Locations module (modern UI with Add/Edit modals + Preview page). Match request/response shapes EXACTLY as specified. Follow existing backend conventions (controllers/services/DTO/validation). Return the list of files changed.

CRITICAL: Frontend uses these exact field names and request/response shapes. Any deviation will break the UI.

================================================================================
ENDPOINT 1: GET /locations

Purpose: List all locations with optional filtering and pagination.

Auth/Headers: 
- Authorization: Bearer <token> (if required by your auth middleware)
- Content-Type: application/json (not needed for GET, but ensure JSON response)

Query Params:
- source: string (optional) - Filter by source location name
- destination: string (optional) - Filter by destination location name
- search: string (optional) - Free-text search across source/destination/city fields (client-side fallback expected)
- page: number (optional, default: 1) - Current page number
- pageSize: number (optional, default: 10) - Rows per page

Request Body: None (GET request)

Response: JSON object
{
  "rows": [
    {
      "location_ID": 1,
      "source_location": "Dindi, Telangana, India",
      "source_city": "Dindi",
      "source_state": "Telangana",
      "source_latitude": "16.5519319",
      "source_longitude": "78.688758",
      "destination_location": "Nagarhole, Karnataka",
      "destination_city": "Nagarhole",
      "destination_state": "Karnataka",
      "destination_latitude": "12.0734",
      "destination_longitude": "76.1511",
      "distance_km": 568.07,
      "duration_text": "22 hours 43 mins",
      "location_description": null
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 10
}

Notes:
- Return "rows" array (not "data" or "locations")
- Include "total" (total record count in DB, not just this page)
- Include "page" and "pageSize" in response for UI confirmation
- All latitude/longitude fields come as strings from DB and must remain strings (frontend converts to number)
- "distance_km" is numeric, "duration_text" is string (e.g., "5 hours 22 mins")
- "location_description" can be null or string
- Filtering should match on exact field values (source and destination are location names, not IDs)

================================================================================
ENDPOINT 2: GET /locations/dropdowns

Purpose: Get distinct source and destination location names for dropdown filters in list and preview pages.

Auth/Headers: 
- Authorization: Bearer <token> (if required)

Query Params: None

Request Body: None

Response: JSON object
{
  "sources": [
    "Dindi, Telangana, India",
    "Bangalore, Karnataka",
    "Chennai, Tamil Nadu"
  ],
  "destinations": [
    "Nagarhole, Karnataka",
    "Mysore, Karnataka",
    "Goa"
  ]
}

Notes:
- Return arrays of strings (location names, NOT IDs)
- Must include all distinct source locations in DB in "sources" array
- Must include all distinct destination locations in DB in "destinations" array
- Order by frequency or alphabetically (frontend doesn't enforce order)
- Strings should NOT be trimmed by frontend, so ensure no leading/trailing spaces

================================================================================
ENDPOINT 3: GET /locations/:id

Purpose: Fetch a single location by ID for the Preview page.

Auth/Headers:
- Authorization: Bearer <token> (if required)

Path Params:
- id: number (location_ID to fetch)

Query Params: None

Request Body: None

Response: JSON object (same shape as list rows)
{
  "location_ID": 1,
  "source_location": "Dindi, Telangana, India",
  "source_city": "Dindi",
  "source_state": "Telangana",
  "source_latitude": "16.5519319",
  "source_longitude": "78.688758",
  "destination_location": "Nagarhole, Karnataka",
  "destination_city": "Nagarhole",
  "destination_state": "Karnataka",
  "destination_latitude": "12.0734",
  "destination_longitude": "76.1511",
  "distance_km": 568.07,
  "duration_text": "22 hours 43 mins",
  "location_description": null
}

Notes:
- Return a single location object (NOT wrapped in { data: ... } or array)
- If location_ID not found, return 404 status (frontend will show error toast)
- All fields required (even if null)

================================================================================
ENDPOINT 4: POST /locations

Purpose: Create a new location with SOURCE FIELDS ONLY (Add Location modal).

Auth/Headers:
- Authorization: Bearer <token> (if required)
- Content-Type: application/json

Request Body: JSON object (SOURCE FIELDS ONLY - destination/distance/duration NOT included)
{
  "source_location": "New City, State, Country",
  "source_city": "New City",
  "source_state": "State",
  "source_latitude": "11.1234",
  "source_longitude": "77.5678"
}

Request Validation:
- All 5 fields REQUIRED (not null, not empty)
- source_latitude and source_longitude must be valid numbers (can be stored as string, but must parse as numeric)
- No destination fields will be sent; if backend requires them, set sensible defaults (empty strings or null)

Response: JSON object (full LocationRow with generated location_ID)
{
  "location_ID": 99,
  "source_location": "New City, State, Country",
  "source_city": "New City",
  "source_state": "State",
  "source_latitude": "11.1234",
  "source_longitude": "77.5678",
  "destination_location": "",
  "destination_city": "",
  "destination_state": "",
  "destination_latitude": "",
  "destination_longitude": "",
  "distance_km": 0,
  "duration_text": "",
  "location_description": null
}

Notes:
- Frontend sends ONLY source fields (no destination, no distance, no duration)
- Return FULL LocationRow object (frontend expects all fields to normalize)
- location_ID is auto-generated by backend
- Destination fields should default to empty strings for now (legacy system requirement)
- distance_km defaults to 0, duration_text to empty string, description to null
- Return 201 Created or 200 OK (frontend just checks response shape)
- Return 400/422 if validation fails (frontend shows error toast)

================================================================================
ENDPOINT 5: PATCH /locations/:id

Purpose: Update an existing location with any combination of fields (Edit Location modal).

Auth/Headers:
- Authorization: Bearer <token> (if required)
- Content-Type: application/json

Path Params:
- id: number (location_ID to update)

Request Body: JSON object (PARTIAL - any fields can be included, all optional)
{
  "source_location": "Updated Source",
  "source_city": "Updated City",
  "source_state": "Updated State",
  "source_latitude": "10.1234",
  "source_longitude": "76.5678",
  "destination_location": "Updated Destination",
  "destination_city": "Dest City",
  "destination_state": "Dest State",
  "destination_latitude": "15.5678",
  "destination_longitude": "80.1234",
  "distance_km": 450.5,
  "duration_text": "8 hours 30 mins",
  "location_description": "Updated address info"
}

Response: JSON object (full updated LocationRow)
{
  "location_ID": 1,
  "source_location": "Updated Source",
  "source_city": "Updated City",
  "source_state": "Updated State",
  "source_latitude": "10.1234",
  "source_longitude": "76.5678",
  "destination_location": "Updated Destination",
  "destination_city": "Dest City",
  "destination_state": "Dest State",
  "destination_latitude": "15.5678",
  "destination_longitude": "80.1234",
  "distance_km": 450.5,
  "duration_text": "8 hours 30 mins",
  "location_description": "Updated address info"
}

Notes:
- Only fields present in request body should be updated
- Return full LocationRow after update (frontend syncs with returned data)
- All fields can be partial (including empty strings if desired)
- Latitude/longitude must be numeric if provided
- Return 404 if location_ID not found
- Return 200 OK with updated object on success

================================================================================
ENDPOINT 6: DELETE /locations/:id

Purpose: Delete a location by ID.

Auth/Headers:
- Authorization: Bearer <token> (if required)

Path Params:
- id: number (location_ID to delete)

Query Params: None

Request Body: None

Response: Empty response (204 No Content) OR { "ok": true } (200 OK)

Notes:
- Frontend just checks status code (204 or 200)
- No body content expected (though { "ok": true } is acceptable)
- Return 404 if location_ID not found
- Return 200 or 204 on success
- Frontend shows toast "Location deleted" after success

================================================================================
ENDPOINT 7: PATCH /locations/:id/modify-name

Purpose: Update ONLY the source or destination location name (not used in current UI but exists in legacy and may be needed).

Auth/Headers:
- Authorization: Bearer <token> (if required)
- Content-Type: application/json

Path Params:
- id: number (location_ID to update)

Request Body: JSON object
{
  "scope": "source",
  "new_name": "New Source Location Name"
}

Where scope is either "source" or "destination"

Response: JSON object (full updated LocationRow)
{
  "location_ID": 1,
  "source_location": "New Source Location Name",
  "source_city": "City",
  "source_state": "State",
  ...
}

Notes:
- scope must be "source" or "destination"
- Updates either source_location or destination_location field only
- Return full LocationRow after update
- Return 404 if location_ID not found
- Frontend shows toast "Location name updated" on success

================================================================================
ENDPOINT 8: GET /locations/:id/tolls

Purpose: Get all vehicle toll charges for a specific location.

Auth/Headers:
- Authorization: Bearer <token> (if required)

Path Params:
- id: number (location_ID)

Query Params: None

Request Body: None

Response: JSON array of toll charge objects
[
  {
    "vehicle_type_id": 1,
    "vehicle_type_name": "Sedan",
    "toll_charge": 150
  },
  {
    "vehicle_type_id": 2,
    "vehicle_type_name": "Innova Crysta 6+1",
    "toll_charge": 0
  },
  {
    "vehicle_type_id": 3,
    "vehicle_type_name": "Tempo Traveller 10 Seater",
    "toll_charge": 0
  }
]

Notes:
- Return ARRAY of toll objects (not wrapped in { data: ... })
- Each object must have: vehicle_type_id (number), vehicle_type_name (string), toll_charge (number)
- vehicle_type_id and toll_charge must be numeric
- vehicle_type_name can be stored as "vehicle_type" in DB, frontend normalizes with: vehicle_type_name ?? vehicle_type
- tolls can be empty array if no tolls defined for location
- Return 404 if location_ID not found
- Frontend expects array; if empty, just return []

================================================================================
ENDPOINT 9: POST /locations/:id/tolls

Purpose: Save/update all vehicle toll charges for a specific location.

Auth/Headers:
- Authorization: Bearer <token> (if required)
- Content-Type: application/json

Path Params:
- id: number (location_ID)

Request Body: JSON object with array of items
{
  "items": [
    {
      "vehicle_type_id": 1,
      "toll_charge": 150
    },
    {
      "vehicle_type_id": 2,
      "toll_charge": 200
    }
  ]
}

Response: JSON object
{
  "ok": true
}

OR just empty 200/204 response (frontend only checks success status)

Notes:
- Request body has "items" array (not "tolls" or "charges")
- Each item has vehicle_type_id (number) and toll_charge (number)
- vehicle_type_name is NOT sent (backend looks it up from vehicle_type_id)
- Backend should INSERT or UPDATE toll_charge for each vehicle_type_id
- If vehicle_type_id doesn't exist in tolls table, INSERT new row
- If it exists, UPDATE the toll_charge value
- Return 200/204 on success
- Return 404 if location_ID not found
- Frontend shows toast "Toll charges updated" on success

================================================================================
SUMMARY OF FILE CHANGES EXPECTED

List all files created or modified:
[
  "src/controllers/LocationController.ts",       (or your route handlers file)
  "src/services/LocationService.ts",             (or business logic service)
  "src/dto/CreateLocationDto.ts",                (DTO for POST payload)
  "src/dto/UpdateLocationDto.ts",                (DTO for PATCH payload)
  "src/dto/LocationResponseDto.ts",              (Response shape)
  "src/dto/TollResponseDto.ts",                  (Toll response shape)
  "src/entities/Location.entity.ts",             (if ORM used)
  "src/entities/LocationToll.entity.ts",         (if ORM used for tolls)
  "src/migrations/[timestamp]_create_locations_table.ts",  (if migrations used)
  "src/migrations/[timestamp]_create_tolls_table.ts",
]

================================================================================
TESTING CHECKLIST FOR BACKEND DEVELOPER

After implementing:
1. Test GET /locations (with and without query params)
2. Test GET /locations/dropdowns
3. Test GET /locations/:id (valid and invalid IDs)
4. Test POST /locations with source-only payload
5. Test PATCH /locations/:id with partial payload
6. Test DELETE /locations/:id
7. Test PATCH /locations/:id/modify-name (source and destination cases)
8. Test GET /locations/:id/tolls
9. Test POST /locations/:id/tolls with items array
10. Ensure empty responses (404s) are handled gracefully

================================================================================
FRONTEND EXPECTATIONS (for reference)

The React frontend expects:
- All endpoints to return JSON (Content-Type: application/json)
- Successful operations to return 200/201/204
- Errors to return 4xx/5xx with error messages in response body
- Empty arrays instead of null for list endpoints
- Numeric fields (ID, lat, lng, distance) as numbers (not strings)
- String fields for location names and descriptions
- Consistent field naming (no database column name aliases)

Field Name Normalization (Frontend tolerates):
- location_ID or id → location_ID (normalized in frontend)
- source_location_city → source_city (normalized in frontend)
- source_location_latitude, source_location_lattitude → source_latitude (typo tolerant)
- vehicle_type → vehicle_type_name (normalized in frontend)
- distance → distance_km (normalized in frontend)

But BEST PRACTICE: Send exact field names above to avoid any surprises.

================================================================================

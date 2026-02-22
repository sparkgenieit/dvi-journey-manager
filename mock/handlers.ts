import { http, HttpResponse, bypass } from "msw";

import itineraryDetails from "./itineraryDetails.json";
import itineraryHotelDetails from "./itineraryHotelDetails.json";

function shouldForceReal() {
  // Devtools toggle:
  // localStorage.setItem("FORCE_REAL_API", "1"); location.reload();
  // localStorage.removeItem("FORCE_REAL_API"); location.reload();
  return localStorage.getItem("FORCE_REAL_API") === "1";
}

async function mockFirstThenReal(request: Request, mockBody: unknown) {
  // Force REAL (skip mock)
  if (shouldForceReal()) {
    const realRes = await fetch(bypass(request));
    const data = await realRes.json();
    return HttpResponse.json(data, { status: realRes.status });
  }

  // MOCK FIRST
  if (mockBody && typeof mockBody === "object") {
    return HttpResponse.json(mockBody, { status: 200 });
  }

  // fallback REAL
  const realRes = await fetch(bypass(request));
  const data = await realRes.json();
  return HttpResponse.json(data, { status: realRes.status });
}

export const handlers = [
  // Details: matches /itineraries/details/:quoteId (absolute or relative)
  http.get(/.*\/itineraries\/details\/.*/i, async ({ request }) => {
    return mockFirstThenReal(request, itineraryDetails);
  }),

  // Hotel details: matches /itineraries/hotel_details/:quoteId (absolute or relative)
  http.get(/.*\/itineraries\/hotel_details\/.*/i, async ({ request }) => {
    return mockFirstThenReal(request, itineraryHotelDetails);
  })
];

import { http, HttpResponse } from "msw";
import { addGuideOptionsDB } from "./data/addGuideMock";

export const handlers = [
 http.get("/mock-api/itineraries/:itineraryId/days/:dayId/add-guide-options", ({ params }) => {
    const { itineraryId, dayId } = params as { itineraryId: string; dayId: string };

    const data = addGuideOptionsDB?.[itineraryId]?.[dayId];

    if (!data) {
      return HttpResponse.json(
        { message: "Not found", itineraryId, dayId },
        { status: 404 }
      );
    }

    return HttpResponse.json(data, { status: 200 });
  }),
];

// FILE: src/services/itinerary.ts
import { api } from "@/lib/api";

export const ItineraryService = {
  async create(data) {
    return api("itineraries", {
      method: "POST",
      body: data,
    });
  },

  async update(id, data) {
    return api(`itineraries/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  async getOne(id) {
    return api(`itineraries/${id}`, {
      method: "GET",
    });
  },
};

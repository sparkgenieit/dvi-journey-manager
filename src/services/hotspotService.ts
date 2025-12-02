import { Hotspot } from "@/types/hotspot";

// Mock data
let hotspots: Hotspot[] = [
  {
    id: "1",
    name: "Ullal Beach",
    type: "Tourist Attraction",
    priority: 0,
    description: "Ullal Beach is a scenic coastal destination near Mangalore, Karnataka, known for its sparkling sand, clear water, and vibrant palm and casuarina trees.",
    landmark: "Ullal, Karnataka",
    address: "Ullal, Karnataka",
    adultCost: 0,
    childCost: 0,
    infantCost: 0,
    foreignAdultCost: 0,
    foreignChildCost: 0,
    foreignInfantCost: 0,
    rating: 4.2,
    duration: "01:00",
    latitude: "12.8075928193398199",
    longitude: "74.842164585740735",
    videoUrl: "https://youtu.be/6Z6oZZHvYlk?si=QQrC7i-wSVBcZKkg",
    locations: [
      "Mangalore, Central",
      "Mangalore, Bus Stop",
      "Mangalore, Railway Station",
      "Mangalore, Bus Stop, Bejai",
      "Mangalore, Karnataka, India",
      "Mangalore, international Airport",
      "Mangalore, Railway Station, Attavar"
    ],
    galleryImages: ["/placeholder.svg"],
    parkingCharges: {
      sedan: 60,
      innova: 60,
      innovaCrysta6: 60,
      tempoTraveller12: 80,
      muv6: 60,
      innova7: 60,
      innovaCrysta7: 60,
      benz26: 150,
      leyland36: 150,
      leyland40: 150,
      benzLarge45: 150,
      volvo43: 150
    },
    openingHours: {
      monday: { is24Hours: true, timeSlots: [] },
      tuesday: { is24Hours: true, timeSlots: [] },
      wednesday: { is24Hours: true, timeSlots: [] },
      thursday: { is24Hours: true, timeSlots: [] },
      friday: { is24Hours: true, timeSlots: [] },
      saturday: { is24Hours: true, timeSlots: [] },
      sunday: { is24Hours: true, timeSlots: [] }
    }
  },
  {
    id: "2",
    name: "Kadri Shree Manjunatha Temple",
    type: "Temple",
    priority: 0,
    description: "Ancient temple dedicated to Lord Manjunatha",
    landmark: "Kadri, Mangalore",
    address: "Kadri, Mangalore, Karnataka",
    adultCost: 0,
    childCost: 0,
    infantCost: 0,
    foreignAdultCost: 0,
    foreignChildCost: 0,
    foreignInfantCost: 0,
    rating: 4.5,
    duration: "01:30",
    latitude: "12.8911",
    longitude: "74.8425",
    videoUrl: "",
    locations: ["Mangalore, Central", "Mangalore, Bus Stop", "Mangalore, Railway Station"],
    galleryImages: ["/placeholder.svg"],
    parkingCharges: {
      sedan: 60,
      innova: 60,
      innovaCrysta6: 60,
      tempoTraveller12: 80,
      muv6: 60,
      innova7: 60,
      innovaCrysta7: 60,
      benz26: 150,
      leyland36: 150,
      leyland40: 150,
      benzLarge45: 150,
      volvo43: 150
    },
    openingHours: {
      monday: { is24Hours: true, timeSlots: [] },
      tuesday: { is24Hours: true, timeSlots: [] },
      wednesday: { is24Hours: true, timeSlots: [] },
      thursday: { is24Hours: true, timeSlots: [] },
      friday: { is24Hours: true, timeSlots: [] },
      saturday: { is24Hours: true, timeSlots: [] },
      sunday: { is24Hours: true, timeSlots: [] }
    }
  }
];

export const hotspotService = {
  listHotspots: async (): Promise<Hotspot[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...hotspots]), 100);
    });
  },

  getHotspot: async (id: string): Promise<Hotspot | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(hotspots.find(h => h.id === id)), 100);
    });
  },

  createHotspot: async (payload: Omit<Hotspot, "id">): Promise<Hotspot> => {
    return new Promise((resolve) => {
      const newHotspot = {
        ...payload,
        id: String(Date.now())
      };
      hotspots.push(newHotspot);
      setTimeout(() => resolve(newHotspot), 100);
    });
  },

  updateHotspot: async (id: string, payload: Partial<Hotspot>): Promise<Hotspot> => {
    return new Promise((resolve, reject) => {
      const index = hotspots.findIndex(h => h.id === id);
      if (index === -1) {
        reject(new Error("Hotspot not found"));
        return;
      }
      hotspots[index] = { ...hotspots[index], ...payload };
      setTimeout(() => resolve(hotspots[index]), 100);
    });
  },

  deleteHotspot: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      hotspots = hotspots.filter(h => h.id !== id);
      setTimeout(() => resolve(), 100);
    });
  }
};

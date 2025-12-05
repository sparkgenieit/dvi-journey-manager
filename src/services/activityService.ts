import { Activity, ActivityReview } from "@/types/activity";

const mockActivities: Activity[] = [
  {
    id: "1",
    title: "Clay Oven Restaurant",
    hotspot: "Clay Oven",
    hotspotPlace: "Munnar",
    maxAllowedPersonCount: 50,
    duration: "00:30:00",
    description: "Pure Vegetarian Restaurant",
    images: [],
    defaultAvailableTimes: [{ startTime: "13:00", endTime: "15:00" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 0,
      children: 0,
      infant: 0,
      foreignAdult: 0,
      foreignChildren: 0,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
  {
    id: "2",
    title: "Mysore Traditional Meal",
    hotspot: "--",
    hotspotPlace: "--",
    maxAllowedPersonCount: 30,
    duration: "01:00:00",
    description: "Traditional South Indian meal experience",
    images: [],
    defaultAvailableTimes: [{ startTime: "12:00", endTime: "14:00" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 500,
      children: 250,
      infant: 0,
      foreignAdult: 800,
      foreignChildren: 400,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
  {
    id: "3",
    title: "Kathakali Show",
    hotspot: "K V Kathakali center",
    hotspotPlace: "Cochin|Cochin Airport",
    maxAllowedPersonCount: 100,
    duration: "02:00:00",
    description: "Traditional Kerala dance performance",
    images: [],
    defaultAvailableTimes: [{ startTime: "18:00", endTime: "20:00" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 300,
      children: 150,
      infant: 0,
      foreignAdult: 500,
      foreignChildren: 250,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
  {
    id: "4",
    title: "Zip Line",
    hotspot: "Zip line ooty",
    hotspotPlace: "Ooty",
    maxAllowedPersonCount: 20,
    duration: "00:30:00",
    description: "Adventure zip line experience",
    images: [],
    defaultAvailableTimes: [{ startTime: "09:00", endTime: "17:00" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 800,
      children: 600,
      infant: 0,
      foreignAdult: 1200,
      foreignChildren: 900,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
  {
    id: "5",
    title: "Nature Walk",
    hotspot: "Spice plantation",
    hotspotPlace: "Thekkady",
    maxAllowedPersonCount: 25,
    duration: "01:30:00",
    description: "Guided nature walk through spice plantation",
    images: [],
    defaultAvailableTimes: [{ startTime: "07:00", endTime: "10:00" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 200,
      children: 100,
      infant: 0,
      foreignAdult: 400,
      foreignChildren: 200,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
  {
    id: "6",
    title: "Bird Watching Long Trekking",
    hotspot: "Spice plantation",
    hotspotPlace: "Thekkady",
    maxAllowedPersonCount: 15,
    duration: "03:00:00",
    description: "Long trek with bird watching opportunities",
    images: [],
    defaultAvailableTimes: [{ startTime: "06:00", endTime: "09:00" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 500,
      children: 300,
      infant: 0,
      foreignAdult: 800,
      foreignChildren: 500,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
  {
    id: "7",
    title: "Bird Watching Special Programme",
    hotspot: "Spice plantation",
    hotspotPlace: "Thekkady",
    maxAllowedPersonCount: 10,
    duration: "04:00:00",
    description: "Special bird watching programme with expert guide",
    images: [],
    defaultAvailableTimes: [{ startTime: "05:30", endTime: "09:30" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 800,
      children: 500,
      infant: 0,
      foreignAdult: 1200,
      foreignChildren: 750,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
  {
    id: "8",
    title: "Spice Plantation Tour",
    hotspot: "Spice plantation",
    hotspotPlace: "Thekkady",
    maxAllowedPersonCount: 30,
    duration: "01:00:00",
    description: "Guided tour of spice plantation",
    images: [],
    defaultAvailableTimes: [{ startTime: "09:00", endTime: "16:00" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 150,
      children: 75,
      infant: 0,
      foreignAdult: 300,
      foreignChildren: 150,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
  {
    id: "9",
    title: "Kerala Special Banana",
    hotspot: "Spice plantation",
    hotspotPlace: "Thekkady",
    maxAllowedPersonCount: 50,
    duration: "00:15:00",
    description: "Taste special Kerala bananas",
    images: [],
    defaultAvailableTimes: [{ startTime: "10:00", endTime: "17:00" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 50,
      children: 50,
      infant: 0,
      foreignAdult: 100,
      foreignChildren: 100,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
  {
    id: "10",
    title: "Kerala Special Banana Leaf Lunch",
    hotspot: "Spice plantation",
    hotspotPlace: "Thekkady",
    maxAllowedPersonCount: 40,
    duration: "01:00:00",
    description: "Traditional Kerala meal on banana leaf",
    images: [],
    defaultAvailableTimes: [{ startTime: "12:00", endTime: "14:00" }],
    isSpecialDay: false,
    specialDays: [],
    pricing: {
      startDate: "",
      endDate: "",
      adult: 350,
      children: 200,
      infant: 0,
      foreignAdult: 550,
      foreignChildren: 350,
      foreignInfant: 0,
    },
    reviews: [],
    status: true,
  },
];

let activities = [...mockActivities];

export const activityService = {
  listActivities: async (): Promise<Activity[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...activities]), 200);
    });
  },

  getActivity: async (id: string): Promise<Activity | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activity = activities.find((a) => a.id === id);
        resolve(activity ? { ...activity } : undefined);
      }, 200);
    });
  },

  createActivity: async (payload: Omit<Activity, "id">): Promise<Activity> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newActivity: Activity = {
          ...payload,
          id: String(Date.now()),
        };
        activities.push(newActivity);
        resolve(newActivity);
      }, 300);
    });
  },

  updateActivity: async (
    id: string,
    payload: Partial<Activity>
  ): Promise<Activity | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = activities.findIndex((a) => a.id === id);
        if (index !== -1) {
          activities[index] = { ...activities[index], ...payload };
          resolve({ ...activities[index] });
        } else {
          resolve(undefined);
        }
      }, 300);
    });
  },

  deleteActivity: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = activities.findIndex((a) => a.id === id);
        if (index !== -1) {
          activities.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  },

  addReview: async (
    activityId: string,
    review: Omit<ActivityReview, "id" | "createdOn">
  ): Promise<ActivityReview | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activity = activities.find((a) => a.id === activityId);
        if (activity) {
          const newReview: ActivityReview = {
            ...review,
            id: String(Date.now()),
            createdOn: new Date().toLocaleString(),
          };
          activity.reviews.push(newReview);
          resolve(newReview);
        } else {
          resolve(undefined);
        }
      }, 200);
    });
  },

  deleteReview: async (
    activityId: string,
    reviewId: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const activity = activities.find((a) => a.id === activityId);
        if (activity) {
          const index = activity.reviews.findIndex((r) => r.id === reviewId);
          if (index !== -1) {
            activity.reviews.splice(index, 1);
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      }, 200);
    });
  },
};

// src/services/hotels.ts
export type Hotel = {
  id: number;
  name: string;
  place: string;
  status: string;
  mobile: string[];
  email: string[];
  category: string;
  powerBackup: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  hotelCode: string;
  hotelMarginPercent: number;
  hotelMarginGstType: string;
  hotelMarginGstPercent: string;
  latitude: string;
  longitude: string;
  hotspotStatus: string;
  address: string;
};

let HOTELS: Hotel[] = [
  {
    id: 757,
    name: "ZiP By Spree Hotels",
    place: "Whitefield - Brookfield",
    status: "Active",
    mobile: ["90923 44111"],
    email: ["sales.chennai@spreehotels.com"],
    category: "STD",
    powerBackup: "No",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    pincode: "560037",
    hotelCode: "198",
    hotelMarginPercent: 12,
    hotelMarginGstType: "Excluded",
    hotelMarginGstPercent: "18% GST - %18",
    latitude: "12.964334679540796",
    longitude: "77.71592290674651",
    hotspotStatus: "Active",
    address: "627, 1st Main Rd, AECS Layout - C Block, AECS Layout, Brookefield, Bengaluru, Karnataka 560037"
  }
];

export async function getHotel(id: number): Promise<Hotel | undefined> {
  await new Promise(res => setTimeout(res, 100));
  return HOTELS.find(h => h.id === id);
}

export async function createHotel(payload: Partial<Hotel>): Promise<Hotel> {
  await new Promise(res => setTimeout(res, 200));
  const id = Math.floor(Math.random() * 1000) + 700;
  const hotel: Hotel = {
    id,
    name: payload.name || "",
    place: payload.place || "",
    status: payload.status || "Active",
    mobile: payload.mobile || [],
    email: payload.email || [],
    category: payload.category || "",
    powerBackup: payload.powerBackup || "No",
    country: payload.country || "",
    state: payload.state || "",
    city: payload.city || "",
    pincode: payload.pincode || "",
    hotelCode: payload.hotelCode || "",
    hotelMarginPercent: payload.hotelMarginPercent || 0,
    hotelMarginGstType: payload.hotelMarginGstType || "Included",
    hotelMarginGstPercent: payload.hotelMarginGstPercent || "5% GST - %5",
    latitude: payload.latitude || "",
    longitude: payload.longitude || "",
    hotspotStatus: payload.hotspotStatus || "In-Active",
    address: payload.address || ""
  };
  HOTELS.push(hotel);
  return hotel;
}

export async function updateHotel(id: number, payload: Partial<Hotel>): Promise<Hotel | undefined> {
  await new Promise(res => setTimeout(res, 200));
  const index = HOTELS.findIndex(h => h.id === id);
  if (index !== -1) {
    HOTELS[index] = { ...HOTELS[index], ...payload };
    return HOTELS[index];
  }
  return undefined;
}
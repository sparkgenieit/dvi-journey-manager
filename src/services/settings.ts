// FILE: src/services/settings.ts

import { api } from "@/lib/api";

// ==================== TYPES ====================

export interface GlobalSettings {
  global_settings_ID?: number;
  id?: number;
  
  // State Configuration
  state_name?: string;
  onground_support_number?: string;
  escalation_call_number?: string;
  
  // Hotel API
  tbo_eligible_country?: string;
  
  // Extra Occupancy
  extrabed_rate_percentage?: number;
  childwithbed_rate_percentage?: number;
  child_nobed_rate_percentage?: number;
  
  // Hotel Margin
  hotel_margin_in_percentage?: number;
  hotel_margin_gst_type?: boolean;
  hotel_margin_gst_percentage?: number;
  
  // Itinerary Distance
  itinerary_distance_limit?: number;
  allowed_km_per_day?: number;
  common_buffer_time?: string;
  
  // Site Seeing KM Limit
  site_seeing_km_limit?: number;
  
  // Travel Buffer Time
  flight_buffer_time?: string;
  train_buffer_time?: string;
  road_buffer_time?: string;
  
  // Customize Text
  journey_start_text?: string;
  between_day_start_text?: string;
  between_day_end_text?: string;
  hotel_terms_condition?: string;
  vehicle_terms_condition?: string;
  hotel_voucher_terms?: string;
  vehicle_voucher_terms?: string;
  
  // Travel Speed
  local_travel_speed_limit?: number;
  outstation_travel_speed_limit?: number;
  
  // Additional Margin
  additional_margin_percentage?: number;
  additional_margin_day_limit?: number;
  
  // Agent Settings
  referral_bonus_credit?: number;
  
  // Site Settings
  site_title?: string;
  company_name?: string;
  address?: string;
  pincode?: string;
  gstin_no?: string;
  pan_no?: string;
  contact_no?: string;
  email_id?: string;
  cc_email_id?: string;
  hotel_voucher_email?: string;
  vehicle_voucher_email?: string;
  accounts_email?: string;
  hotel_hsn?: string;
  vehicle_hsn?: string;
  guide_hotspot_activity_hsn?: string;
  logo_path?: string;
  cin_number?: string;
  youtube_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  linkedin_link?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  branch_name?: string;
}

export interface City {
  city_id: number;
  city_name: string;
  state_id: number;
  status: number;
  state?: {
    state_name: string;
  };
}

export interface HotelCategory {
  hotel_category_id: number;
  hotel_category: number;
  category_title: string;
  status?: number;
}

export interface State {
  id: number;
  name: string;
  vehicle_onground_support_number?: string;
  vehicle_escalation_call_number?: string;
}

// ==================== GLOBAL SETTINGS ====================

export async function getGlobalSettings(): Promise<GlobalSettings> {
  return api("/settings/global", { auth: true });
}

export async function updateGlobalSettings(
  data: Partial<GlobalSettings>
): Promise<GlobalSettings> {
  return api("/settings/global", {
    method: "PUT",
    body: data,
    auth: true,
  });
}

// ==================== CITIES ====================

export async function getCities(): Promise<City[]> {
  return api("/settings/cities", { auth: true });
}

export async function getCity(id: number): Promise<City> {
  return api(`/settings/cities/${id}`, { auth: true });
}

export async function createCity(data: {
  city_name: string;
  state_id: number;
  status?: number;
}): Promise<City> {
  return api("/settings/cities", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function updateCity(
  id: number,
  data: Partial<City>
): Promise<City> {
  return api(`/settings/cities/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  });
}

export async function deleteCity(id: number): Promise<{ message: string }> {
  return api(`/settings/cities/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// ==================== HOTEL CATEGORIES ====================

export async function getHotelCategories(): Promise<HotelCategory[]> {
  return api("/settings/hotel-categories", { auth: true });
}

export async function getHotelCategory(id: number): Promise<HotelCategory> {
  return api(`/settings/hotel-categories/${id}`, { auth: true });
}

export async function createHotelCategory(data: {
  hotel_category: number;
  category_title: string;
  status?: number;
}): Promise<HotelCategory> {
  return api("/settings/hotel-categories", {
    method: "POST",
    body: data,
    auth: true,
  });
}

export async function updateHotelCategory(
  id: number,
  data: Partial<HotelCategory>
): Promise<HotelCategory> {
  return api(`/settings/hotel-categories/${id}`, {
    method: "PUT",
    body: data,
    auth: true,
  });
}

export async function deleteHotelCategory(
  id: number
): Promise<{ message: string }> {
  return api(`/settings/hotel-categories/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// ==================== STATES ====================

export async function getStates(): Promise<State[]> {
  return api("/settings/states", { auth: true });
}

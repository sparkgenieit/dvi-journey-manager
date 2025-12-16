import { api } from "@/lib/api";

export interface DashboardStats {
  stats: {
    totalAgents: number;
    totalDrivers: number;
    totalGuides: number;
    totalItineraries: number;
    totalRevenue: number;
    confirmedBookings: number;
    cancelledBookings: number;
  };
  profit: {
    lastMonth: number;
    currentMonth: number;
    percentageChange: number;
  };
  vehicles: {
    total: number;
    onRoute: number;
    available: number;
    upcoming: number;
  };
  vendors: {
    total: number;
    branches: number;
    inactive: number;
  };
  drivers: {
    total: number;
    active: number;
    inactive: number;
    onRoute: number;
    available: number;
  };
  hotels: {
    total: number;
    rooms: number;
    amenities: number;
    bookings: number;
  };
  dailyMoment: Array<{
    quoteId: string;
    location: string;
  }>;
  starPerformer: {
    name: string;
    phone: string;
    performance: number;
  } | null;
}

export const DashboardService = {
  async getStats(): Promise<DashboardStats> {
    return api('dashboard/stats', {
      method: 'GET',
    });
  },
};

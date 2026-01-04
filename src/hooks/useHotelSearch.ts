import { useState, useCallback, useRef } from 'react';
import { ItineraryService } from '@/services/itinerary';

export type HotelSearchResult = {
  hotelCode: string;
  hotelName: string;
  address: string;
  rating: number;
  reviewCount?: number;
  price: number;
  currency?: string;
  roomTypes?: Array<{
    roomTypeName: string;
    roomCode: string;
    maxOccupancy: number;
    roomName?: string;
  }>;
  facilities?: string[];
  images?: string[];
  availableRooms?: number;
  // TBO-specific fields
  isFromTbo?: boolean;
  bookingCode?: string;
  totalCost?: number;
  totalRoomCost?: number;
};

interface UseHotelSearchOptions {
  debounceMs?: number;
}

export const useHotelSearch = (options: UseHotelSearchOptions = {}) => {
  const { debounceMs = 500 } = options;
  const [searchResults, setSearchResults] = useState<HotelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    async (
      searchQuery: string,
      cityCode: string,
      checkInDate: string,
      checkOutDate: string,
      roomCount: number = 1,
      guestCount: number = 2
    ) => {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // If query is empty, clear results
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setError(null);
        return;
      }

      // Set debounced search
      debounceTimerRef.current = setTimeout(async () => {
        setIsSearching(true);
        setError(null);

        try {
          const response = await ItineraryService.searchHotels({
            cityCode,
            checkInDate,
            checkOutDate,
            roomCount,
            guestCount,
            hotelName: searchQuery,
          });

          // Map searchReference from backend to bookingCode for TBO API
          const mapBookingCode = (hotel: any): HotelSearchResult => ({
            ...hotel,
            bookingCode: hotel.searchReference || hotel.bookingCode,
            isFromTbo: true,
          });

          if (response?.data?.hotels) {
            const hotels = response.data.hotels.map(mapBookingCode);
            setSearchResults(hotels);
          } else if (response?.hotels) {
            const hotels = response.hotels.map(mapBookingCode);
            setSearchResults(hotels);
          } else {
            setSearchResults([]);
          }
        } catch (err: any) {
          console.error('Hotel search error:', err);
          setError(
            err?.message ||
            'Failed to search hotels. Please try again.'
          );
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchResults([]);
    setError(null);
    setIsSearching(false);
  }, []);

  return {
    searchResults,
    isSearching,
    error,
    search,
    clearSearch,
  };
};

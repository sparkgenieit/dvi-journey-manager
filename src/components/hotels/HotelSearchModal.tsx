import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HotelSearchResultCard } from './HotelSearchResultCard';
import { useHotelSearch, HotelSearchResult } from '@/hooks/useHotelSearch';
import { toast } from 'sonner';

interface HotelSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityCode: string;
  cityName: string;
  checkInDate: string;
  checkOutDate: string;
  adultCount?: number;
  childCount?: number;
  infantCount?: number;
  onSelectHotel: (hotel: HotelSearchResult, mealPlan?: any) => Promise<void>;
  isSelectingHotel?: boolean;
}

export const HotelSearchModal: React.FC<HotelSearchModalProps> = ({
  open,
  onOpenChange,
  cityCode,
  cityName,
  checkInDate,
  checkOutDate,
  adultCount = 2,
  childCount = 0,
  infantCount = 0,
  onSelectHotel,
  isSelectingHotel = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealPlan, setSelectedMealPlan] = useState({
    all: false,
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [selectedHotel, setSelectedHotel] = useState<HotelSearchResult | null>(
    null
  );

  const { searchResults, isSearching, error, search, clearSearch } =
    useHotelSearch({ debounceMs: 500 });

  const totalGuests = adultCount + childCount + infantCount;

  // Handle search input changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      search(query, cityCode, checkInDate, checkOutDate, 1, totalGuests);
    } else {
      clearSearch();
    }
  };

  // Handle hotel selection
  const handleSelectHotel = async (hotelCode: string, hotelName: string) => {
    const hotel = searchResults.find((h) => h.hotelCode === hotelCode);
    if (!hotel) return;

    setSelectedHotel(hotel);

    try {
      await onSelectHotel(hotel, selectedMealPlan);
      onOpenChange(false);
      setSearchQuery('');
      setSelectedMealPlan({
        all: false,
        breakfast: false,
        lunch: false,
        dinner: false,
      });
      setSelectedHotel(null);
    } catch (err) {
      console.error('Failed to select hotel:', err);
      setSelectedHotel(null);
    }
  };

  // Clear search when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      clearSearch();
      setSearchQuery('');
      setSelectedHotel(null);
    }
    onOpenChange(newOpen);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <DialogTitle>Search Hotels in {cityName}</DialogTitle>
            <DialogDescription>
              Check-in: {formatDate(checkInDate)} • Check-out:{' '}
              {formatDate(checkOutDate)} • {totalGuests} guest
              {totalGuests !== 1 ? 's' : ''}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search hotel by name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4ba3c3] focus:border-transparent text-sm"
              disabled={isSearching}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#4ba3c3] animate-spin" />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
                <p className="text-xs text-red-700 mt-1">
                  Try adjusting your search dates or location
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {!isSearching && searchQuery.trim() && searchResults.length === 0 && !error && (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">
                No hotels found matching "{searchQuery}"
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Try different search terms or adjust your dates
              </p>
            </div>
          )}

          {isSearching && (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 text-[#4ba3c3] animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Searching for hotels...</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-3">
                Found {searchResults.length} hotel{searchResults.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((hotel) => (
                  <HotelSearchResultCard
                    key={hotel.hotelCode}
                    hotel={hotel}
                    onSelect={handleSelectHotel}
                    isLoading={isSelectingHotel && selectedHotel?.hotelCode === hotel.hotelCode}
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                  />
                ))}
              </div>
            </div>
          )}

          {!searchQuery.trim() && searchResults.length === 0 && !isSearching && (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Start typing to search for hotels</p>
            </div>
          )}
        </div>

        {/* Meal Plan Selection (shown when results exist) */}
        {searchResults.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <p className="text-xs font-medium text-[#4a4260] mb-3">
              Select Meal Plan (applies to selected hotel)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedMealPlan.all}
                  onChange={(e) =>
                    setSelectedMealPlan({
                      all: e.target.checked,
                      breakfast: e.target.checked,
                      lunch: e.target.checked,
                      dinner: e.target.checked,
                    })
                  }
                />
                <span className="text-sm text-[#4a4260]">All Meals</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedMealPlan.breakfast}
                  onChange={(e) =>
                    setSelectedMealPlan({
                      ...selectedMealPlan,
                      breakfast: e.target.checked,
                      all: false,
                    })
                  }
                />
                <span className="text-sm text-[#4a4260]">Breakfast</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedMealPlan.lunch}
                  onChange={(e) =>
                    setSelectedMealPlan({
                      ...selectedMealPlan,
                      lunch: e.target.checked,
                      all: false,
                    })
                  }
                />
                <span className="text-sm text-[#4a4260]">Lunch</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedMealPlan.dinner}
                  onChange={(e) =>
                    setSelectedMealPlan({
                      ...selectedMealPlan,
                      dinner: e.target.checked,
                      all: false,
                    })
                  }
                />
                <span className="text-sm text-[#4a4260]">Dinner</span>
              </label>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

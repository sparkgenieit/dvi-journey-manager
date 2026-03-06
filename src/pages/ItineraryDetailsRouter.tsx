import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ItineraryService } from '@/services/itinerary';
import { ItineraryDetails } from './ItineraryDetails';
import { Loader2 } from 'lucide-react';

/**
 * Smart router that checks if itinerary is confirmed
 * Renders ItineraryDetails in readOnly mode if confirmed, else in edit mode
 * No separate component needed - ItineraryDetails handles both modes via readOnly prop
 */
export const ItineraryDetailsRouter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Missing itinerary ID in URL');
      setIsConfirmed(false);
      return;
    }

    const checkConfirmationStatus = async () => {
      try {
        // 1) Detect if current URL path starts with "/confirmed-itinerary/"
        const isConfirmedRoute = location.pathname.startsWith("/confirmed-itinerary/");
        console.log('[Router] Route-based detection - isConfirmedRoute:', isConfirmedRoute);
        
        // 2) Fetch itinerary details from API
        const response = await ItineraryService.getDetails(id);
        
        console.log('[Router] API Response - isConfirmed:', response?.isConfirmed, 'status:', response?.status);
        
        // 3) Determine confirmed using API response (robust)
        const apiConfirmed = response?.isConfirmed === true || response?.status === "CONFIRMED";
        
        // 4) Final: confirmed if either route or API says so
        const confirmationStatus = isConfirmedRoute || apiConfirmed;
        setIsConfirmed(confirmationStatus);
        
        if (confirmationStatus) {
          console.log('✅ CONFIRMED MODE: Rendering ItineraryDetails in readOnly mode');
        } else {
          console.log('✏️ EDIT MODE: Rendering ItineraryDetails in editable mode');
        }

        setError(null);
      } catch (err: any) {
        console.error('Failed to check itinerary status:', err);
        // Default to edit mode on error
        setIsConfirmed(false);
        setError(err?.message || 'Failed to load itinerary');
      }
    };

    checkConfirmationStatus();
  }, [id, location.pathname]);

  // Loading state
  if (isConfirmed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#4ba3c3]" />
          <p className="text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  // Error state - default to edit mode
  if (error) {
    console.warn('Error checking confirmation status, loading in edit mode:', error);
    return <ItineraryDetails readOnly={false} />;
  }

  // Render based on confirmation status - SINGLE PAGE ONLY
  return <ItineraryDetails readOnly={isConfirmed} />;
};

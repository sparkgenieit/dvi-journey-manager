import { useEffect, useState } from 'react';
import { HotelVoucherService } from './hotelVoucher';

export function useHotelVoucherStatus(itineraryPlanId: number, hotelId: number) {
  const [status, setStatus] = useState<'confirmed' | 'cancelled' | 'pending' | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      const voucher = await HotelVoucherService.getHotelVoucher(itineraryPlanId, hotelId);
      if (mounted) setStatus(voucher?.status || null);
    }
    if (itineraryPlanId && hotelId) fetchStatus();
    return () => { mounted = false; };
  }, [itineraryPlanId, hotelId]);

  return status;
}

// Hotel Voucher and Cancellation Policy Service
// This service manages hotel vouchers and their cancellation policies

export interface HotelCancellationPolicy {
  id: number;
  hotelId: number;
  hotelName: string;
  cancellationDate: string;
  cancellationPercentage: number;
  description: string;
  itineraryPlanId: number;
}

export interface HotelVoucherData {
  id?: number;
  itineraryPlanId: number;
  hotelId: number;
  hotelName: string;
  hotelEmail: string;
  hotelStateCity: string;
  routeDates: string[];
  dayNumbers: number[];
  confirmedBy: string;
  emailId: string;
  mobileNumber: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  invoiceTo: 'gst_bill_against_dvi' | 'hotel_direct' | 'agent';
  voucherTermsCondition: string;
  hotelDetailsIds: number[];
}

export interface CreateVoucherPayload {
  itineraryPlanId: number;
  vouchers: Array<{
    hotelId: number;
    hotelDetailsIds: number[];
    routeDates: string[];
    confirmedBy: string;
    emailId: string;
    mobileNumber: string;
    status: string;
    invoiceTo: string;
    voucherTermsCondition: string;
  }>;
}

export interface AddCancellationPolicyPayload {
  itineraryPlanId: number;
  hotelId: number;
  cancellationDate: string;
  cancellationPercentage: number;
  description: string;
}

// Mock data for development
let mockCancellationPolicies: HotelCancellationPolicy[] = [
  {
    id: 1,
    hotelId: 101,
    hotelName: "JVK PARK",
    cancellationDate: "2026-02-01",
    cancellationPercentage: 10,
    description: "Cancellation before 7 days - 10% deduction",
    itineraryPlanId: 36041
  },
  {
    id: 2,
    hotelId: 102,
    hotelName: "MUNNAR QUEEN",
    cancellationDate: "2026-02-05",
    cancellationPercentage: 25,
    description: "Cancellation before 3 days - 25% deduction",
    itineraryPlanId: 36041
  }
];

// Utility functions for localStorage persistence
const VOUCHERS_KEY = 'mockHotelVouchers';
function loadVouchersFromStorage(): HotelVoucherData[] {
  try {
    const data = localStorage.getItem(VOUCHERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
function saveVouchersToStorage(vouchers: HotelVoucherData[]) {
  try {
    localStorage.setItem(VOUCHERS_KEY, JSON.stringify(vouchers));
  } catch {}
}
let mockVouchers: HotelVoucherData[] = loadVouchersFromStorage();
let nextPolicyId = 3;
let nextVoucherId = 1;

export const HotelVoucherService = {
  /**
   * Get all cancellation policies for an itinerary
   */
  getCancellationPolicies: async (itineraryPlanId: number): Promise<HotelCancellationPolicy[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockCancellationPolicies.filter(
      policy => policy.itineraryPlanId === itineraryPlanId
    );
  },

  /**
   * Get cancellation policies for a specific hotel
   */
  getHotelCancellationPolicies: async (
    itineraryPlanId: number,
    hotelId: number
  ): Promise<HotelCancellationPolicy[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockCancellationPolicies.filter(
      policy => policy.itineraryPlanId === itineraryPlanId && policy.hotelId === hotelId
    );
  },

  /**
   * Add a new cancellation policy
   */
  addCancellationPolicy: async (
    payload: AddCancellationPolicyPayload
  ): Promise<{ success: boolean; data: HotelCancellationPolicy }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock: Get hotel name (in real app, fetch from hotel ID)
    const hotelNames: Record<number, string> = {
      101: "JVK PARK",
      102: "MUNNAR QUEEN",
      103: "SPICE GROVE",
      104: "Classic Regency",
      105: "COUNTRY CLUB BEACH RESORT"
    };

    const newPolicy: HotelCancellationPolicy = {
      id: nextPolicyId++,
      hotelId: payload.hotelId,
      hotelName: hotelNames[payload.hotelId] || `Hotel ${payload.hotelId}`,
      cancellationDate: payload.cancellationDate,
      cancellationPercentage: payload.cancellationPercentage,
      description: payload.description,
      itineraryPlanId: payload.itineraryPlanId
    };

    mockCancellationPolicies.push(newPolicy);

    return {
      success: true,
      data: newPolicy
    };
  },

  /**
   * Delete a cancellation policy
   */
  deleteCancellationPolicy: async (policyId: number): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = mockCancellationPolicies.findIndex(p => p.id === policyId);
    if (index !== -1) {
      mockCancellationPolicies.splice(index, 1);
      return { success: true };
    }

    throw new Error('Cancellation policy not found');
  },

  /**
   * Get existing voucher data for a hotel
   */
  getHotelVoucher: async (
    itineraryPlanId: number,
    hotelId: number
  ): Promise<HotelVoucherData | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const voucher = mockVouchers.find(
      v => v.itineraryPlanId === itineraryPlanId && v.hotelId === hotelId
    );
    return voucher || null;
  },

  /**
   * Create or update hotel vouchers
   */
  createHotelVouchers: async (
    payload: CreateVoucherPayload
  ): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate: Check if cancellation policies exist
    const policiesExist = await HotelVoucherService.getCancellationPolicies(
      payload.itineraryPlanId
    );

    if (policiesExist.length === 0) {
      return {
        success: false,
        message: 'Please add at least one cancellation policy before creating voucher'
      };
    }

    // Create/update vouchers
    payload.vouchers.forEach(voucherData => {
      const existingIndex = mockVouchers.findIndex(
        v => v.itineraryPlanId === payload.itineraryPlanId && v.hotelId === voucherData.hotelId
      );

      const voucher: HotelVoucherData = {
        id: existingIndex !== -1 ? mockVouchers[existingIndex].id : nextVoucherId++,
        itineraryPlanId: payload.itineraryPlanId,
        hotelId: voucherData.hotelId,
        hotelName: voucherData.hotelDetailsIds[0] ? `Hotel ${voucherData.hotelId}` : '',
        hotelEmail: voucherData.emailId,
        hotelStateCity: '',
        routeDates: voucherData.routeDates,
        dayNumbers: [],
        confirmedBy: voucherData.confirmedBy,
        emailId: voucherData.emailId,
        mobileNumber: voucherData.mobileNumber,
        status: voucherData.status as any,
        invoiceTo: voucherData.invoiceTo as any,
        voucherTermsCondition: voucherData.voucherTermsCondition,
        hotelDetailsIds: voucherData.hotelDetailsIds
      };

      if (existingIndex !== -1) {
        mockVouchers[existingIndex] = voucher;
      } else {
        mockVouchers.push(voucher);
      }
    });
    saveVouchersToStorage(mockVouchers);
    return {
      success: true,
      message: 'Hotel voucher successfully created and sent to respective hotels'
    };
  },

  /**
   * Get default voucher terms and conditions
   */
  getDefaultVoucherTerms: async (): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    return `
<h3>Package Includes: (Inclusion)</h3>
<p>All Hotel Taxes & Service Taxes</p>
<ul>
  <li>Accommodation on double/triple sharing basis</li>
  <li>Daily breakfast at the hotel</li>
  <li>All transfers and sightseeing by private vehicle</li>
  <li>All applicable hotel taxes</li>
</ul>

<h3>Package Excludes: (Exclusion)</h3>
<ul>
  <li>Any airfare or train tickets</li>
  <li>Personal expenses such as laundry, telephone calls, tips & gratuity</li>
  <li>Any optional activities or services</li>
  <li>Travel insurance</li>
</ul>

<h3>Cancellation Policy:</h3>
<p>Please refer to the cancellation policy table above for specific charges based on cancellation date.</p>

<h3>Important Notes:</h3>
<ul>
  <li>Check-in time: 2:00 PM | Check-out time: 11:00 AM</li>
  <li>Valid ID proof required at the time of check-in</li>
  <li>Hotel reserves the right to admission</li>
</ul>
    `.trim();
  }
};

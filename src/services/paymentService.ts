import { api } from '../lib/api';

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentService = {
  createOrder: async (amount: number): Promise<CreateOrderResponse> => {
    return api('/payments/create-order', { method: 'POST', body: { amount } });
  },

  createSubscriptionOrder: async (planId: number, agentSubscribedPlanId?: number): Promise<CreateOrderResponse> => {
    return api('/payments/create-subscription-order', { method: 'POST', body: { planId, agentSubscribedPlanId } });
  },

  verifyPayment: async (data: VerifyPaymentData): Promise<any> => {
    return api('/payments/verify-payment', { method: 'POST', body: data });
  },

  getWalletHistory: async (): Promise<any[]> => {
    return api('/payments/wallet-history');
  }
};

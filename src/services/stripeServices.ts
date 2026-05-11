import axios from 'axios';
import { getDomainParams } from '@/utils/company';
import { getBookingTokenHeaders } from '@/utils/booking-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// API Types
export interface ApiStripePublishableKeyResponse {
  publishable_key: string;
}

export interface ApiCheckoutSessionRequest {
  booking_id: number;
  customer_id: number;
  payment_method: 'card';
  success_url: string;
  cancel_url: string;
}

export interface ApiCheckoutSessionResponse {
  checkout_session_url: string;
}

// Frontend Types
export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  status: string;
}

// Get Stripe publishable key for the company (public endpoint with domain)
export async function getStripePublishableKey(): Promise<string | null> {
  const domainParams = getDomainParams();

  try {
    const res = await axios.get<ApiStripePublishableKeyResponse>(
      `${API_URL}/api/stripe/public/publishable-key/`,
      {
        params: domainParams,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return res.data.publishable_key;
  } catch {
    return null;
  }
}

// Create a Stripe checkout session for a booking (uses X-Booking-Token)
export async function createCheckoutSession(
  bookingId: number,
  customerId: number,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession> {
  const payload: ApiCheckoutSessionRequest = {
    booking_id: bookingId,
    customer_id: customerId,
    payment_method: 'card',
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  const res = await axios.post<ApiCheckoutSessionResponse>(
    `${API_URL}/api/payments/create-checkout-session/`,
    payload,
    { headers: getBookingTokenHeaders() }
  );
  return {
    sessionId: '',
    checkoutUrl: res.data.checkout_session_url,
    status: 'created',
  };
}

// Create a payment intent (uses X-Booking-Token)
export async function createPaymentIntent(
  bookingId: number,
  paymentMethodId: string,
  holdDeposit: boolean = true
): Promise<{ paymentIntentId: string; clientSecret: string; status: string }> {
  const res = await axios.post<{
    payment_intent_id: string;
    client_secret: string;
    status: string;
  }>(
    `${API_URL}/api/payments/create-payment/`,
    {
      booking_id: bookingId,
      payment_method_id: paymentMethodId,
      hold_deposit: holdDeposit,
    },
    { headers: getBookingTokenHeaders() }
  );
  return {
    paymentIntentId: res.data.payment_intent_id,
    clientSecret: res.data.client_secret,
    status: res.data.status,
  };
}

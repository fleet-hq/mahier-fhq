import axios from 'axios';
import { getBookingTokenHeaders } from '@/utils/booking-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// API Types
export interface ApiIdentitySession {
  client_secret: string;
  session_url: string;
}

// Frontend Types
export interface IdentityVerificationSession {
  sessionId: string;
  url: string;
  status: string;
}

// Create Stripe Identity verification session (uses X-Booking-Token)
// Calls /api/identity/create-session/ which returns a Stripe hosted verification URL
export async function createIdentityVerificationSession(
  customerId: number | string
): Promise<IdentityVerificationSession> {
  const res = await axios.post<ApiIdentitySession>(
    `${API_URL}/api/identity/create-session/`,
    { customer_id: customerId },
    { headers: getBookingTokenHeaders() }
  );
  return {
    sessionId: res.data.client_secret,
    url: res.data.session_url,
    status: 'requires_input',
  };
}

// Get verification status for a booking (uses X-Booking-Token)
export async function getVerificationStatus(
  bookingId: number | string
): Promise<{ idVerification: string; insuranceVerification: string }> {
  try {
    // id_verification_status is a string ("verified" / "pending"),
    // insurance_verification_status is an object {status, carrier, ...}.
    const res = await axios.get<{
      id_verification_status: string;
      insurance_verification_status:
        | string
        | { status?: string; [key: string]: unknown };
    }>(
      `${API_URL}/api/bookings/${bookingId}/`,
      { headers: getBookingTokenHeaders() }
    );

    const ins = res.data.insurance_verification_status;
    const insStatus =
      typeof ins === 'string' ? ins : ins?.status || 'pending';

    return {
      idVerification: res.data.id_verification_status || 'pending',
      insuranceVerification: insStatus,
    };
  } catch {
    return {
      idVerification: 'pending',
      insuranceVerification: 'pending',
    };
  }
}

// Create insurance verification via Modives (uses X-Booking-Token)
// Backend routes consumer (booking-token) requests to the manual flow:
// Modives emails the customer directly — no magic_link is returned.
export async function createInsuranceVerification(
  customerId: number | string,
  rentalStartDate: string,
  rentalEndDate: string,
  bookingId?: number | string
): Promise<{ magicLink?: string }> {
  const res = await axios.post<{ magic_link?: string }>(
    `${API_URL}/api/modives/verifications/create_verification/`,
    {
      customer_id: customerId,
      rental_start_date: rentalStartDate,
      rental_end_date: rentalEndDate,
      ...(bookingId ? { booking_id: bookingId } : {}),
    },
    { headers: getBookingTokenHeaders() }
  );
  return {
    magicLink: res.data.magic_link,
  };
}

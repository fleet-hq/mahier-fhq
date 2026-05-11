// Utility for managing the booking token returned by the public create booking endpoint.
// This token is sent as X-Booking-Token header for post-booking API calls.
// Uses sessionStorage so the token is cleared when the browser tab closes.

const BOOKING_TOKEN_KEY = 'booking_token';

export function setBookingToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(BOOKING_TOKEN_KEY, token);
  }
}

export function getBookingToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(BOOKING_TOKEN_KEY);
  }
  return null;
}

export function clearBookingToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(BOOKING_TOKEN_KEY);
  }
}

/**
 * Build headers object with X-Booking-Token for post-booking API calls.
 */
export function getBookingTokenHeaders(): Record<string, string> {
  const token = getBookingToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['X-Booking-Token'] = token;
  }
  return headers;
}

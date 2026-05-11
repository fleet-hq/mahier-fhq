'use client';

import { useQuery } from '@tanstack/react-query';

import {
  BookingBalanceSnapshot,
  getBookingBalance,
} from '@/services/billingServices';

/**
 * Polls the customer's booking balance every 30s. Used by:
 *   • /pay/booking/[id]            — the dedicated payment page
 *   • /booking/[id]                — the post-checkout summary, to
 *                                    decide whether to show the
 *                                    "Payment Pending" banner.
 *
 * X-Booking-Token must already be set in storage (utils/booking-token).
 */
export const useBookingBalance = (enabled: boolean = true) =>
  useQuery<BookingBalanceSnapshot>({
    queryKey: ['public-booking-balance'],
    queryFn: () => getBookingBalance(),
    enabled,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });

'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getStripePublishableKey,
  createCheckoutSession,
  createPaymentIntent,
} from '@/services/stripeServices';

export const useStripePublishableKey = () =>
  useQuery({
    queryKey: ['stripePublishableKey'],
    queryFn: getStripePublishableKey,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

export const useCreateCheckoutSession = () =>
  useMutation({
    mutationFn: ({
      bookingId,
      customerId,
      successUrl,
      cancelUrl,
    }: {
      bookingId: number;
      customerId: number;
      successUrl: string;
      cancelUrl: string;
    }) => createCheckoutSession(bookingId, customerId, successUrl, cancelUrl),
  });

export const useCreatePaymentIntent = () =>
  useMutation({
    mutationFn: ({
      bookingId,
      paymentMethodId,
      holdDeposit = true,
    }: {
      bookingId: number;
      paymentMethodId: string;
      holdDeposit?: boolean;
    }) => createPaymentIntent(bookingId, paymentMethodId, holdDeposit),
  });

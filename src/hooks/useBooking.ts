'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getInsuranceOptions,
  getBookingById,
  createBooking,
  getBookingDrivers,
  createBookingDriver,
  type CreateBookingPayload,
} from '@/services/bookingServices';

export const useInsuranceOptions = (args?: {
  pickupDatetime?: string;
  dropoffDatetime?: string;
}) =>
  useQuery({
    queryKey: [
      'insuranceOptions',
      args?.pickupDatetime ?? null,
      args?.dropoffDatetime ?? null,
    ],
    queryFn: () => getInsuranceOptions(args),
    staleTime: 5 * 60 * 1000,
  });

export const useBookingDetails = (bookingId?: string | number) =>
  useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingById(bookingId!),
    enabled: !!bookingId,
  });

export const useCreateBooking = () =>
  useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
  });

export const useBookingDrivers = (bookingId?: string | number) =>
  useQuery({
    queryKey: ['bookingDrivers', bookingId],
    queryFn: () => getBookingDrivers(bookingId!),
    enabled: !!bookingId,
  });

export const useCreateBookingDriver = () =>
  useMutation({
    mutationFn: ({ bookingId, driver }: { bookingId: string | number; driver: { full_name: string; email: string; phone: string } }) =>
      createBookingDriver(bookingId, driver),
  });

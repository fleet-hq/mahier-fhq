'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  createIdentityVerificationSession,
  getVerificationStatus,
  createInsuranceVerification,
} from '@/services/verificationServices';

export const useCreateIdentityVerification = () =>
  useMutation({
    mutationFn: ({ customerId }: { customerId: number | string }) =>
      createIdentityVerificationSession(customerId),
  });

export const useVerificationStatus = (bookingId?: number | string) =>
  useQuery({
    queryKey: ['verificationStatus', bookingId],
    queryFn: () => getVerificationStatus(bookingId!),
    enabled: !!bookingId,
    refetchInterval: 30 * 1000, // Poll every 30 seconds for status updates
  });

export const useCreateInsuranceVerification = () =>
  useMutation({
    mutationFn: ({
      customerId,
      rentalStartDate,
      rentalEndDate,
      bookingId,
    }: {
      customerId: number | string;
      rentalStartDate: string;
      rentalEndDate: string;
      bookingId?: number | string;
    }) => createInsuranceVerification(customerId, rentalStartDate, rentalEndDate, bookingId),
  });

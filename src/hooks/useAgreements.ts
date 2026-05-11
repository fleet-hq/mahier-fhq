'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAgreementById,
  getAgreementByBookingId,
  acceptAgreement,
  getCompanySettings,
  getDefaultAgreementTemplate,
} from '@/services/agreementServices';

export const useAgreement = (agreementId?: string | number) =>
  useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: () => getAgreementById(agreementId!),
    enabled: !!agreementId,
  });

export const useAgreementByBooking = (bookingId?: string | number) =>
  useQuery({
    queryKey: ['agreement-by-booking', bookingId],
    queryFn: () => getAgreementByBookingId(bookingId!),
    enabled: !!bookingId,
  });

export const useCompanySettings = () =>
  useQuery({
    queryKey: ['company-settings'],
    queryFn: getCompanySettings,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

export const useDefaultAgreementTemplate = () =>
  useQuery({
    queryKey: ['default-agreement-template'],
    queryFn: getDefaultAgreementTemplate,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

export const useAcceptAgreement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agreementId, signatureData }: { agreementId: string | number; signatureData: string }) =>
      acceptAgreement(agreementId, signatureData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agreement', data.id] });
      queryClient.invalidateQueries({ queryKey: ['agreement-by-booking'] });
    },
  });
};

'use client';

import { useQuery } from '@tanstack/react-query';
import { getDefaultTaxProfile } from '@/services/taxServices';
import { parseTaxProfile } from '@/types/vehicle';

export const useDefaultTaxProfile = () =>
  useQuery({
    queryKey: ['defaultTaxProfile'],
    queryFn: async () => {
      const raw = await getDefaultTaxProfile();
      return parseTaxProfile(raw);
    },
    staleTime: 5 * 60 * 1000,
  });

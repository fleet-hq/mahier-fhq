'use client';

import { useQuery } from '@tanstack/react-query';
import { getBranchLocations, getCompanyLocations } from '@/services/locationServices';

export const useBranchLocations = (branchId?: string | number) =>
  useQuery({
    queryKey: ['branchLocations', branchId],
    queryFn: () => getBranchLocations(branchId!),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

export const useCompanyLocations = () =>
  useQuery({
    queryKey: ['companyLocations'],
    queryFn: getCompanyLocations,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

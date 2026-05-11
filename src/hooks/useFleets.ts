'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  listFleets,
  getFleetById,
  checkBulkAvailability,
  getFleetUnavailableRanges,
} from '@/services/fleetServices';

export const useFleets = (page: number = 1, name: string = '', pageSize?: number) =>
  useQuery({
    queryKey: ['fleets', { page, name, pageSize }],
    queryFn: () => listFleets({ page, name, page_size: pageSize }),
  });

export const useFleet = (
  id?: string | number,
  enabled: boolean = true,
  args?: { pickupDatetime?: string; dropoffDatetime?: string },
) =>
  useQuery({
    queryKey: ['fleet', id, args?.pickupDatetime ?? null, args?.dropoffDatetime ?? null],
    queryFn: () => getFleetById(id!, args),
    enabled: !!id && enabled,
    // Keep the prior fleet data visible while a refetch (e.g. after the
    // customer changes pickup/dropoff dates) is in flight, so the form
    // doesn't flash a "loading" state on every date tweak.
    placeholderData: keepPreviousData,
  });

export const useFleetAvailability = (
  fleetIds: string[],
  pickupDatetime: string | null,
  dropoffDatetime: string | null,
) =>
  useQuery({
    queryKey: ['fleet-availability', fleetIds, pickupDatetime, dropoffDatetime],
    queryFn: () => checkBulkAvailability(fleetIds, pickupDatetime!, dropoffDatetime!),
    enabled: fleetIds.length > 0 && !!pickupDatetime && !!dropoffDatetime,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

/** Fetch every blocked / booked range for a fleet so the booking
 *  form's date pickers can pre-disable unavailable days. Pass
 *  excludeBookingId on the trip-modification flow so the booking
 *  being edited doesn't block its own current window. */
export const useFleetUnavailableRanges = (
  id?: string | number,
  opts?: { excludeBookingId?: string | number },
) =>
  useQuery({
    queryKey: ['fleet-unavailable-ranges', id, opts?.excludeBookingId ?? null],
    queryFn: () => getFleetUnavailableRanges(id!, opts),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

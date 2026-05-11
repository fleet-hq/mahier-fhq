import axios from 'axios';
import {
  ApiVehicle,
  ApiPaginatedResponse,
  Vehicle,
  transformApiVehicle,
} from '@/types/vehicle';
import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ListFleetsParams {
  page?: number;
  name?: string;
  page_size?: number;
  /** When supplied, the backend FleetFilter excludes fleets that
   *  have overlapping bookings or admin-set unavailability blocks
   *  in the given window — used by the swap picker so unavailable
   *  vehicles never show up. */
  pickup_datetime?: string;
  dropoff_datetime?: string;
  /** Booking ID to ignore when computing overlap — lets the
   *  customer's own current booking still surface (irrelevant to
   *  swap, but kept for completeness). */
  exclude_booking?: number | string;
}

export interface ListFleetsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vehicle[];
}

// Fetch fleets using public endpoint with domain param
export async function listFleets(
  params?: ListFleetsParams,
): Promise<ListFleetsResponse> {
  const domainParams = getDomainParams();

  const res = await axios.get<ApiPaginatedResponse<ApiVehicle>>(
    `${API_URL}/api/fleets/public/`,
    {
      params: {
        ...params,
        ...domainParams,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return {
    count: res.data.count,
    next: res.data.next,
    previous: res.data.previous,
    results: res.data.results.map(transformApiVehicle),
  };
}

// Check availability for a single vehicle
// Returns null when the availability status is unknown (e.g. network error)
export async function checkFleetAvailability(
  fleetId: number | string,
  pickupDatetime: string,
  dropoffDatetime: string,
): Promise<boolean | null> {
  try {
    const domainParams = getDomainParams();
    const res = await axios.get<{ available: boolean }>(
      `${API_URL}/api/bookings/public/availability/`,
      {
        params: {
          fleet_id: fleetId,
          pickup_datetime: pickupDatetime,
          dropoff_datetime: dropoffDatetime,
          ...domainParams,
        },
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return res.data.available;
  } catch {
    // Return null to indicate unknown availability state
    return null;
  }
}

// Fetch every blocked / booked range for a fleet so the date pickers
// can pre-disable days the customer can't actually book. Each range
// is { start, end, reason } — reason is "blocked" (admin
// FleetUnavailability) or "booked" (existing booking).
export interface UnavailableRange {
  start: string;
  end: string;
  reason: 'blocked' | 'booked';
}
export async function getFleetUnavailableRanges(
  fleetId: number | string,
  opts?: { excludeBookingId?: number | string },
): Promise<UnavailableRange[]> {
  try {
    const params: Record<string, unknown> = {
      fleet_id: fleetId,
      ...getDomainParams(),
    };
    if (opts?.excludeBookingId) params.exclude_booking_id = opts.excludeBookingId;
    const res = await axios.get<{ ranges: UnavailableRange[] }>(
      `${API_URL}/api/bookings/public/unavailable-ranges/`,
      {
        params,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return res.data.ranges ?? [];
  } catch {
    return [];
  }
}

// Check availability for multiple vehicles in parallel
export async function checkBulkAvailability(
  fleetIds: (number | string)[],
  pickupDatetime: string,
  dropoffDatetime: string,
): Promise<Record<string, boolean | null>> {
  const results = await Promise.all(
    fleetIds.map(async (id) => {
      const available = await checkFleetAvailability(id, pickupDatetime, dropoffDatetime);
      return [String(id), available] as const;
    }),
  );
  return Object.fromEntries(results);
}

export async function getFleetById(
  id: number | string,
  args?: { pickupDatetime?: string; dropoffDatetime?: string },
): Promise<Vehicle> {
  const domainParams = getDomainParams();
  const dateParams: Record<string, string> = {};
  if (args?.pickupDatetime) dateParams.pickup_datetime = args.pickupDatetime;
  if (args?.dropoffDatetime) dateParams.dropoff_datetime = args.dropoffDatetime;

  const res = await axios.get<ApiVehicle>(`${API_URL}/api/fleets/public/${id}/`, {
    params: { ...domainParams, ...dateParams },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return transformApiVehicle(res.data);
}

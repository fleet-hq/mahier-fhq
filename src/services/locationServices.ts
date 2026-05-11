import axios from 'axios';
import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// API Types
export interface ApiLocation {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
  type?: string;
  price?: number | string;
  is_active?: boolean;
}

// Frontend Types
export interface Location {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  type: 'pickup' | 'dropoff' | 'both';
  price: number;
}

// Map backend location types to frontend pickup/dropoff types
function mapLocationType(apiType?: string): 'pickup' | 'dropoff' | 'both' {
  if (apiType === 'pickup' || apiType === 'dropoff' || apiType === 'both') return apiType;
  // Backend types like 'airport', 'office', 'custom' etc. are usable for both pickup and dropoff
  return 'both';
}

// Transform API response to frontend format
function transformLocation(api: ApiLocation): Location {
  return {
    id: String(api.id),
    name: api.name,
    address: api.address,
    latitude: api.latitude,
    longitude: api.longitude,
    isDefault: api.is_default ?? false,
    type: mapLocationType(api.type),
    price: Number(api.price) || 0,
  };
}

// Fetch locations for a branch (public endpoint)
export async function getBranchLocations(branchId: number | string): Promise<Location[]> {
  try {
    const domainParams = getDomainParams();
    const res = await axios.get<ApiLocation[] | { results: ApiLocation[] }>(
      `${API_URL}/api/companies/public/locations/`,
      {
        params: { ...domainParams, branch: branchId },
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const locations = Array.isArray(res.data) ? res.data : res.data.results || [];
    return locations.filter((loc) => loc.is_active !== false).map(transformLocation);
  } catch {
    return [];
  }
}

// Fetch all company locations (public endpoint)
export async function getCompanyLocations(): Promise<Location[]> {
  try {
    const domainParams = getDomainParams();
    const res = await axios.get<ApiLocation[] | { results: ApiLocation[] }>(
      `${API_URL}/api/companies/public/locations/`,
      {
        params: domainParams,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const locations = Array.isArray(res.data) ? res.data : res.data.results || [];
    return locations.filter((loc) => loc.is_active !== false).map(transformLocation);
  } catch {
    return [];
  }
}

import axios from 'axios';
import { getDomainParams } from '@/utils/company';
import { ApiTaxProfile } from '@/types/vehicle';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getDefaultTaxProfile(): Promise<ApiTaxProfile | null> {
  try {
    const domainParams = getDomainParams();
    const res = await axios.get<ApiTaxProfile[] | { results: ApiTaxProfile[] }>(
      `${API_URL}/api/companies/public/tax-profiles/`,
      {
        params: domainParams,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const profiles = Array.isArray(res.data) ? res.data : res.data.results || [];
    return profiles.find((p) => p.is_default) || profiles[0] || null;
  } catch {
    return null;
  }
}

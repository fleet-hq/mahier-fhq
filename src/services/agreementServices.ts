import axios from 'axios';
import { getDomainParams } from '@/utils/company';
import { getBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import { formatDate, formatDateTime } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// API response types
export interface ApiClause {
  id: number;
  title: string;
  content: string;
}

export interface ApiTemplateClause {
  id: number;
  clause: ApiClause;
  order: number;
}

export interface ApiAgreement {
  id: number;
  booking: number;
  template: {
    id: number;
    title: string;
    description: string;
    header: string;
    footer: string;
    template_clauses: ApiTemplateClause[];
  };
  status: string;
  signed_at: string | null;
  signature_image: string | null;
  created_at: string;
  updated_at: string;
  // Populated from booking
  booking_details?: {
    id: number;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      phone_no?: string;
      dob?: string;
      license_no?: string;
      drivers_license_state?: string;
      identity_verified?: boolean;
      identity_verification_details?: {
        first_name: string;
        last_name: string;
        dob: string;
        phone: string;
        document_type: string;
        document_number: string;
        document_issuance_date: string;
        document_expiration_date: string;
        status: string;
        city: string;
        state: string;
        country: string;
        street_address_1: string;
        street_address_2: string;
        postal_code: string;
      } | null;
    };
    fleet: {
      id: number;
      name: string;
      vin: string;
      license_plate: string;
      year: number;
      image: string;
      booking_rule?: {
        min_driver_age: number | null;
        max_driver_age: number | null;
        miles_unlimited: boolean;
        miles_per_day: string | null;
        miles_overage_rate: string | null;
      } | null;
    };
    pickup_datetime: string;
    dropoff_datetime: string;
    pickup_location: {
      id: number;
      name: string;
      address: string;
    };
    dropoff_location: {
      id: number;
      name: string;
      address: string;
    };
    insurance_option?: {
      name: string;
      description: string;
      price_per_day: number;
    };
    insurance_details?: {
      policy_id: string;
      premium_amount: string;
      status: string;
      coverage: {
        cdw_cover: boolean;
        rcli_cover: boolean;
        sli_cover: boolean;
        pai_cover: boolean;
      };
    };
    created_at: string;
  };
  company?: {
    id: number;
    name: string;
    email: string;
    phone_no: string;
    country: string;
    company_picture: string | null;
  };
}

// Transformed types for frontend
export interface AgreementData {
  id: number;
  status: string;
  signedAt: string | null;
  signatureImage: string | null;
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
    logo: string | null;
  };
  customer: {
    name: string;
    homeAddress: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    birthDate: string;
    licenseNumber: string;
    licenseExpiry: string;
  };
  insurance: {
    carrierName: string;
    policyNumber: string;
    expires: string;
    policyDetails: string;
    premiumAmount?: number;
    status?: string;
  };
  vehicle: {
    pickupDateTime: string;
    dropoffDateTime: string;
    bookedAt: string;
    vin: string;
    vehicleName: string;
    minimumMiles: string;
    maximumMiles: string;
    overageFee: string;
    minDriverAge?: number | null;
    maxDriverAge?: number | null;
  };
  invoice?: {
    rentalTotal: string;
    fees?: string;
    discount?: string;
    insurance?: string;
    tax?: string;
    total: string;
    deposit?: string;
  };
  clauses: {
    id: number;
    title: string;
    content: string;
  }[];
  template: {
    title: string;
    description: string;
  };
}

// formatDate and formatDateTime are imported from @/lib/utils

// Local wrappers to match the original signatures used in this file
// (the shared formatDate accepts Date | string | null and defaults to 'short' month,
//  but this service needs 'long' month format)
function formatDateLong(dateStr: string | null): string {
  return formatDate(dateStr, { year: 'numeric', month: 'long', day: 'numeric' });
}

function transformAgreement(api: ApiAgreement): AgreementData {
  const booking = api.booking_details;
  const customer = booking?.customer;
  const fleet = booking?.fleet;
  const company = api.company;

  return {
    id: api.id,
    status: api.status,
    signedAt: api.signed_at,
    signatureImage: api.signature_image,
    company: {
      name: company?.name || 'N/A',
      address: company?.country || 'N/A',
      email: company?.email || 'N/A',
      phone: company?.phone_no || 'N/A',
      logo: company?.company_picture || null,
    },
    customer: {
      name: customer ? `${customer.first_name} ${customer.last_name}` : 'N/A',
      homeAddress: customer?.identity_verification_details?.street_address_1 || 'N/A',
      city: customer?.identity_verification_details?.city || 'N/A',
      state: customer?.identity_verification_details?.state || customer?.drivers_license_state || 'N/A',
      zip: customer?.identity_verification_details?.postal_code || 'N/A',
      phone: customer?.phone || customer?.phone_no || 'N/A',
      birthDate: formatDateLong(customer?.dob || customer?.identity_verification_details?.dob || null),
      licenseNumber: customer?.license_no || customer?.identity_verification_details?.document_number || 'N/A',
      licenseExpiry: formatDateLong(customer?.identity_verification_details?.document_expiration_date || null),
    },
    insurance: {
      carrierName: booking?.insurance_details ? 'Bonzah' : (booking?.insurance_option?.name || 'N/A'),
      policyNumber: booking?.insurance_details?.policy_id || 'N/A',
      expires: 'N/A',
      policyDetails: booking?.insurance_details?.coverage
        ? [
            booking.insurance_details.coverage.cdw_cover && 'Collision Damage Waiver (CDW)',
            booking.insurance_details.coverage.rcli_cover && 'Rental Car Liability (RCLI)',
            booking.insurance_details.coverage.sli_cover && 'Supplemental Liability (SLI)',
            booking.insurance_details.coverage.pai_cover && 'Personal Accident (PAI)',
          ].filter(Boolean).join(', ') || 'No coverage selected'
        : (booking?.insurance_option?.description || 'N/A'),
      premiumAmount: booking?.insurance_details?.premium_amount
        ? Number(booking.insurance_details.premium_amount)
        : undefined,
      status: booking?.insurance_details?.status || undefined,
    },
    vehicle: {
      pickupDateTime: formatDateTime(booking?.pickup_datetime || null),
      dropoffDateTime: formatDateTime(booking?.dropoff_datetime || null),
      bookedAt: formatDateLong(booking?.created_at || null),
      vin: fleet?.vin || 'N/A',
      vehicleName: fleet ? `${fleet.year} ${fleet.name}` : 'N/A',
      minimumMiles: fleet?.booking_rule?.miles_unlimited
        ? 'Unlimited'
        : Number(fleet?.booking_rule?.miles_per_day || 0) > 0
          ? `${Number(fleet?.booking_rule?.miles_per_day)} miles/day`
          : 'N/A',
      maximumMiles: fleet?.booking_rule?.miles_unlimited
        ? 'Unlimited'
        : Number(fleet?.booking_rule?.miles_per_day || 0) > 0
          ? `${Number(fleet?.booking_rule?.miles_per_day)} miles/day`
          : 'N/A',
      overageFee: Number(fleet?.booking_rule?.miles_overage_rate || 0) > 0
        ? `$${Number(fleet?.booking_rule?.miles_overage_rate).toFixed(2)}/mile`
        : '$0.00',
      minDriverAge: fleet?.booking_rule?.min_driver_age ?? null,
      maxDriverAge: fleet?.booking_rule?.max_driver_age ?? null,
    },
    invoice: undefined,
    clauses: api.template?.template_clauses?.map((tc) => ({
      id: tc.clause.id,
      title: tc.clause.title,
      content: tc.clause.content,
    })) || [],
    template: {
      title: api.template?.title || 'Rental Agreement',
      description: api.template?.description || '',
    },
  };
}

// Fetch agreement by ID (uses X-Booking-Token)
export async function getAgreementById(agreementId: number | string): Promise<AgreementData> {
  try {
    const res = await axios.get<ApiAgreement>(
      `${API_URL}/api/agreements/signatures/${agreementId}/`,
      { headers: getBookingTokenHeaders() }
    );
    return transformAgreement(res.data);
  } catch (error) {
    throw error;
  }
}

// Fetch agreement by booking ID (uses X-Booking-Token)
export async function getAgreementByBookingId(bookingId: number | string): Promise<AgreementData | null> {
  try {
    const res = await axios.get<{ results: ApiAgreement[] }>(
      `${API_URL}/api/agreements/signatures/`,
      {
        params: { booking__id: bookingId },
        headers: getBookingTokenHeaders(),
      }
    );
    const firstResult = res.data.results?.[0];
    if (firstResult) {
      return transformAgreement(firstResult);
    }
    return null;
  } catch (error) {
    throw error;
  }
}

// Accept/sign agreement (uses X-Booking-Token)
export async function acceptAgreement(
  agreementId: number | string,
  signatureData: string
): Promise<AgreementData> {
  try {
    const res = await axios.post<ApiAgreement>(
      `${API_URL}/api/agreements/signatures/${agreementId}/accept-agreement/`,
      {
        template_variables: {},
        signature_image: signatureData,
      },
      { headers: getBookingTokenHeaders() }
    );
    return transformAgreement(res.data);
  } catch (error) {
    throw error;
  }
}

// Submit signature for a booking (uses X-Booking-Token)
export async function submitBookingSignature(
  bookingId: number | string,
  signatureImage: string
): Promise<void> {
  await axios.post(
    `${API_URL}/api/agreements/signatures/`,
    {
      booking_id: bookingId,
      signature_image: signatureImage,
    },
    { headers: getBookingTokenHeaders() }
  );
}

// Default company values when API is unavailable
const DEFAULT_COMPANY: CompanySettings = {
  name: 'Fleet HQ',
  address: 'United States',
  email: 'support@fleethq.com',
  phone: '+1 (555) 000-0000',
  logo: null,
  defaultBranch: null,
};

// Get company settings from public API (no auth required)
export interface DefaultBranchInfo {
  id: number;
  name: string;
  /** IANA timezone (e.g. ``"America/Anchorage"``) or null when unset. */
  timezone: string | null;
  /** ``HH:mm:ss`` — branch operational start time, or null when unset. */
  operationalStartTime: string | null;
  /** ``HH:mm:ss`` — branch operational end time, or null when unset. */
  operationalEndTime: string | null;
}

export interface CompanySettings {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo: string | null;
  /** Company's default operational branch (timezone + opening hours). */
  defaultBranch: DefaultBranchInfo | null;
}

interface ApiDefaultBranch {
  id?: number;
  name?: string;
  timezone?: string | null;
  operational_start_time?: string | null;
  operational_end_time?: string | null;
}

function transformDefaultBranch(api?: ApiDefaultBranch | null): DefaultBranchInfo | null {
  if (!api || api.id == null) return null;
  return {
    id: api.id,
    name: api.name ?? '',
    timezone: api.timezone ?? null,
    operationalStartTime: api.operational_start_time ?? null,
    operationalEndTime: api.operational_end_time ?? null,
  };
}

export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const domainParams = getDomainParams();
    const res = await axios.get<{
      name?: string;
      address?: string;
      country?: string;
      email?: string;
      phone_no?: string;
      company_picture?: string | null;
      default_branch?: ApiDefaultBranch | null;
    }>(
      `${API_URL}/api/companies/public/details/`,
      {
        params: domainParams,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const company = res.data;
    if (!company?.name) return DEFAULT_COMPANY;

    return {
      name: company.name || DEFAULT_COMPANY.name,
      address: company.address || company.country || DEFAULT_COMPANY.address,
      email: company.email || DEFAULT_COMPANY.email,
      phone: company.phone_no || DEFAULT_COMPANY.phone,
      logo: company.company_picture || null,
      defaultBranch: transformDefaultBranch(company.default_branch),
    };
  } catch {
    return DEFAULT_COMPANY;
  }
}

// Get active clauses for agreement (public endpoint — no auth needed)
export interface AgreementTemplate {
  id: number;
  title: string;
  description: string;
  clauses: { id: number; title: string; content: string }[];
}

export async function getDefaultAgreementTemplate(): Promise<AgreementTemplate | null> {
  const domainParams = getDomainParams();

  if (Object.keys(domainParams).length === 0) {
    return null;
  }

  try {
    const res = await axios.get<{ results?: ApiClause[] } | ApiClause[]>(`${API_URL}/api/agreements/public/clauses/`, {
      params: { ...domainParams, is_active: true, page_size: 100 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const rawData = res.data;
    const clauses: ApiClause[] = Array.isArray(rawData)
      ? rawData
      : rawData?.results || [];

    // Map clauses to the expected format
    const formattedClauses = clauses.map((clause) => ({
      id: clause.id,
      title: clause.title,
      content: clause.content,
    }));

    return {
      id: 0,
      title: 'Vehicle Rental Agreement',
      description: 'Please review and sign this rental agreement before pickup.',
      clauses: formattedClauses,
    };
  } catch {
    return null;
  }
}

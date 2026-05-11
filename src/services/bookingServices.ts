import axios from 'axios';
import { getDomainParams } from '@/utils/company';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Check fleet availability for a given date range (public endpoint, no auth)
export async function checkFleetAvailability(
  fleetId: number | string,
  pickupDatetime: string,
  dropoffDatetime: string
): Promise<boolean> {
  try {
    const domainParams = getDomainParams();
    const res = await axios.get<{ available: boolean }>(
      `${API_URL}/api/bookings/public/availability/`,
      {
        params: {
          ...domainParams,
          fleet_id: fleetId,
          pickup_datetime: pickupDatetime,
          dropoff_datetime: dropoffDatetime,
        },
      }
    );
    return res.data.available;
  } catch {
    // If the check fails, let the create endpoint handle it
    return true;
  }
}

// Insurance option from public API
export interface ApiInsuranceOption {
  type: string;
  name: string;
  description: string;
  price: number;
  recommended: boolean;
}

interface ApiInsuranceResponse {
  has_bonzah_account: boolean;
  insurance_options: ApiInsuranceOption[];
  total_price: number;
}

// Transformed for frontend
export interface InsuranceOption {
  id: string;
  title: string;
  price: number;
  description?: string;
  features: string[];
}

function transformInsuranceOption(api: ApiInsuranceOption): InsuranceOption {
  return {
    id: api.type.toLowerCase(),
    title: api.name,
    price: Number(api.price),
    description: api.description,
    features: [api.description],
  };
}

// Fetch insurance options (public endpoint).
// When the booking window is known we pass it through so Bonzah
// quotes per-day rates for THOSE dates / drop_off_time — otherwise
// the rates come from a generic 1-day Same-day quote and the
// pre-checkout total drifts from the binding quote.
export async function getInsuranceOptions(args?: {
  pickupDatetime?: string;
  dropoffDatetime?: string;
}): Promise<InsuranceOption[]> {
  try {
    const dateParams: Record<string, string> = {};
    if (args?.pickupDatetime) dateParams.pickup_datetime = args.pickupDatetime;
    if (args?.dropoffDatetime) dateParams.dropoff_datetime = args.dropoffDatetime;
    const res = await axios.get<ApiInsuranceResponse>(
      `${API_URL}/api/bookings/public/insurance-options/`,
      {
        params: { ...getDomainParams(), ...dateParams },
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const ownInsurance: InsuranceOption = {
      id: 'own',
      title: 'I have my own insurance',
      price: 0,
      features: ['Use your personal coverage'],
    };

    const apiOptions = Array.isArray(res.data.insurance_options)
      ? res.data.insurance_options.map(transformInsuranceOption)
      : [];

    return [ownInsurance, ...apiOptions];
  } catch {
    return [
      {
        id: 'own',
        title: 'I have my own insurance',
        price: 0,
        features: ['Use your personal coverage'],
      },
    ];
  }
}

// Booking Details Types (matches actual API response)
export interface ApiBooking {
  id: number;
  status: string;
  payment_status: string;
  booking_reference: string;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    dob?: string;
    license_no?: string;
    drivers_license_state?: string;
    identity_verified?: boolean;
    identity_verification_details?: {
      dob: string;
      document_number: string;
      document_expiration_date: string;
      document_type: string;
      city: string;
      state: string;
      street_address_1: string;
      postal_code: string;
    } | null;
  };
  fleet: {
    id: number;
    name: string;
    year: string;
    make: string;
    model: string;
    plate_number: string;
    vin_number?: string;
    description: string;
    seats: number;
    doors: number;
    extras: {
      id: number;
      name: string;
      icon: string | null;
      description: string;
      period: string;
      price: string;
    }[];
    images: {
      id: number;
      fleet: number;
      image: string;
      is_thumbnail: boolean;
    }[];
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
    branch_name: string;
  };
  dropoff_location: {
    id: number;
    name: string;
    address: string;
    branch_name: string;
  };
  base_price: string;
  subtotal: string;
  total_price: string;
  total_discount: string;
  tax: string;
  security_deposit: string;
  location_charges: string;
  fees: string;
  extras_price: string;
  extras: {
    id: number;
    name: string;
    description: string;
    price: string;
    period: string;
    quantity?: number;
  }[];
  insurance_selected: boolean;
  insurance_details: {
    policy_id: string;
    premium_amount: string;
    status: string;
    coverage: {
      cdw_cover: boolean;
      rcli_cover: boolean;
      sli_cover: boolean;
      pai_cover: boolean;
    };
  } | null;
  offer: unknown | null;
  created_at: string;
  updated_at: string;
  can_modify?: {
    cancel: boolean;
    swap: boolean;
    reduce: boolean;
    extend: boolean;
  };
}

export interface BookingDetails {
  id: string;
  fleetId: number;
  customerId: number;
  status: string;
  vehicle: {
    name: string;
    licensePlate: string;
    vin: string;
    image: string;
    year: number;
    minDriverAge?: number | null;
    maxDriverAge?: number | null;
    milesUnlimited?: boolean;
    milesPerDay?: number | null;
    milesOverageRate?: number | null;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    dob?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    homeAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  bookedOn: string;
  pickUp: {
    address: string;
    date: string;
    time: string;
    rawDatetime: string;
  };
  dropOff: {
    address: string;
    date: string;
    time: string;
    rawDatetime: string;
  };
  invoice: {
    number: string;
    items: {
      name: string;
      image: string;
      quantity: number;
      pricePerDay: number;
      unit?: 'day' | 'hour';
      periodLabel?: string;
    }[];
    extras: {
      name: string;
      price: number;
    }[];
    rentalTotal: number;
    fees: number;
    insurancePremium: number;
    subtotal: number;
    discount: number;
    discountCode: string;
    tax: number;
    locationCharges: number;
    total: number;
    deposit: number;
    balance: number;
  };
  hasOwnInsurance: boolean;
  insuranceCoverage: {
    cdw: boolean;
    rcli: boolean;
    sli: boolean;
    pai: boolean;
    premiumAmount: number;
    policyId: string;
    status: string;
  } | null;
  verifications: {
    idVerification: string;
    insuranceVerification: string;
  };
  agreementId?: number;
  agreementStatus?: string;
  canModify: {
    cancel: boolean;
    swap: boolean;
    reduce: boolean;
    extend: boolean;
  };
}

function formatBookingDate(dateStr: string): string {
  // Parse without browser timezone conversion — treat the stored time as the display time
  const datePart = dateStr.split('T')[0] || '';
  const parts = datePart.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 1;
  const day = parts[2] || 1;
  const date = new Date(year, month - 1, day);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}. ${day.toString().padStart(2, '0')} ${months[month - 1]}, ${year}`;
}

function formatBookingTime(dateStr: string): string {
  // Parse time directly from ISO string without browser timezone conversion
  const timePart = dateStr.split('T')[1]?.replace('Z', '').split(/[+-]/)[0] || '00:00:00';
  const parts = timePart.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatCreatedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${day}${suffix} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function calculateDays(pickupDate: string, dropoffDate: string): number {
  // Calendar-dates-touched: matches the backend day count (every
  // calendar date the rental spans counts as a billable day).
  // Sun 1 PM → Wed 1 PM = Sun, Mon, Tue, Wed = 4 days.
  const start = new Date(pickupDate);
  const end = new Date(dropoffDate);
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const calendarDiff = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
  return Math.max(1, calendarDiff + 1);
}

function calculateHours(pickupDate: string, dropoffDate: string): number {
  const start = new Date(pickupDate);
  const end = new Date(dropoffDate);
  return Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60)));
}

function transformBooking(api: ApiBooking): BookingDetails {
  const rentalDays = calculateDays(api.pickup_datetime, api.dropoff_datetime);
  const rentalHours = calculateHours(api.pickup_datetime, api.dropoff_datetime);
  const HOURLY_RATE_MAX_HOURS = 23;
  const isHourly = rentalHours <= HOURLY_RATE_MAX_HOURS;
  const pricePerDay = Number(api.base_price) || 0;
  const subtotal = Number(api.subtotal) || pricePerDay * rentalDays;
  const discount = Number(api.total_discount) || 0;
  const tax = Number(api.tax) || 0;
  const locationCharges = Number(api.location_charges) || 0;
  const fees = Number(api.fees) || 0;
  // The API's subtotal already bakes in peak/promo dynamic-pricing per
  // day, plus location_charges and extras. To recover the bare rental
  // sum we strip those back out — without this the post-booking invoice
  // showed base_price × days (e.g. \$320 × 7 = \$2240) and silently
  // hid any peak-day surcharges already paid (real rental was \$4960).
  const extrasFromApi = (api.extras || []).reduce(
    (sum, e) => sum + Number(e.price) * (e.quantity || 1),
    0,
  );
  const rentalSum = Math.max(0, subtotal - locationCharges - extrasFromApi);
  const total = Number(api.total_price) || subtotal - discount + tax + locationCharges + fees;
  const deposit = Number(api.security_deposit) || 0;
  const balance = total - deposit;

  const PLACEHOLDER = '/images/vehicles/car_placeholder.png';
  const thumbnailImg = api.fleet.images?.find((img) => img.is_thumbnail);
  const firstImg = api.fleet.images?.[0];
  const imageUrl = thumbnailImg?.image || firstImg?.image || '';
  const vehicleImage = imageUrl && imageUrl.trim() !== '' ? imageUrl : PLACEHOLDER;

  // Build invoice items. unitPrice is the AVERAGE per-unit cost across
  // the booking — for daily bookings with peak/promo dynamic pricing
  // the per-day rate isn't constant, so dividing the actual rental sum
  // by day count gives the right "$X / day" headline AND ensures
  // rentalTotal = unitPrice × quantity matches what was actually
  // charged. Falls back to base_price when the math can't be derived.
  const quantity = isHourly ? rentalHours : rentalDays;
  const unitPrice =
    quantity > 0 && rentalSum > 0
      ? rentalSum / quantity
      : pricePerDay;
  const invoiceItems: BookingDetails['invoice']['items'] = [
    {
      name: `${api.fleet.name} - ${api.fleet.plate_number || 'N/A'}`,
      image: vehicleImage,
      quantity,
      pricePerDay: unitPrice,
      unit: isHourly ? 'hour' : 'day',
    },
  ];


  // Build extras list separately
  const invoiceExtras = (api.extras || []).map((extra) => ({
    name: extra.description || extra.name,
    price: Number(extra.price) * (extra.quantity || 1),
  }));

  return {
    id: String(api.id),
    fleetId: api.fleet.id,
    customerId: api.customer.id,
    status: api.status,
    vehicle: {
      name: api.fleet.name,
      licensePlate: api.fleet.plate_number || 'N/A',
      vin: api.fleet.vin_number || 'N/A',
      image: vehicleImage,
      year: Number(api.fleet.year) || 0,
      minDriverAge: api.fleet.booking_rule?.min_driver_age ?? null,
      maxDriverAge: api.fleet.booking_rule?.max_driver_age ?? null,
      milesUnlimited: api.fleet.booking_rule?.miles_unlimited ?? false,
      milesPerDay: api.fleet.booking_rule?.miles_per_day != null
        ? Number(api.fleet.booking_rule.miles_per_day)
        : null,
      milesOverageRate: api.fleet.booking_rule?.miles_overage_rate != null
        ? Number(api.fleet.booking_rule.miles_overage_rate)
        : null,
    },
    customer: {
      name: `${api.customer.first_name} ${api.customer.last_name}`,
      email: api.customer.email,
      phone: api.customer.phone || 'N/A',
      dob: api.customer.dob || api.customer.identity_verification_details?.dob || undefined,
      licenseNumber: api.customer.license_no || api.customer.identity_verification_details?.document_number || undefined,
      licenseExpiry: api.customer.identity_verification_details?.document_expiration_date || undefined,
      homeAddress: api.customer.identity_verification_details?.street_address_1 || undefined,
      city: api.customer.identity_verification_details?.city || undefined,
      state: api.customer.identity_verification_details?.state || api.customer.drivers_license_state || undefined,
      zip: api.customer.identity_verification_details?.postal_code || undefined,
    },
    bookedOn: formatCreatedDate(api.created_at),
    pickUp: {
      address: api.pickup_location?.address || api.pickup_location?.name || 'N/A',
      date: formatBookingDate(api.pickup_datetime),
      time: formatBookingTime(api.pickup_datetime),
      rawDatetime: api.pickup_datetime,
    },
    dropOff: {
      address: api.dropoff_location?.address || api.dropoff_location?.name || 'N/A',
      date: formatBookingDate(api.dropoff_datetime),
      time: formatBookingTime(api.dropoff_datetime),
      rawDatetime: api.dropoff_datetime,
    },
    invoice: {
      number: api.booking_reference || String(api.id),
      items: invoiceItems,
      extras: invoiceExtras,
      rentalTotal: rentalSum,
      fees,
      insurancePremium: Number(api.insurance_details?.premium_amount) || 0,
      subtotal,
      discount,
      discountCode: '',
      tax,
      locationCharges,
      total,
      deposit,
      balance,
    },
    hasOwnInsurance: !api.insurance_selected,
    insuranceCoverage: api.insurance_selected && api.insurance_details
      ? {
          cdw: api.insurance_details?.coverage?.cdw_cover || false,
          rcli: api.insurance_details?.coverage?.rcli_cover || false,
          sli: api.insurance_details?.coverage?.sli_cover || false,
          pai: api.insurance_details?.coverage?.pai_cover || false,
          premiumAmount: Number(api.insurance_details?.premium_amount) || 0,
          policyId: api.insurance_details?.policy_id || '',
          status: api.insurance_details?.status || '',
        }
      : null,
    verifications: {
      idVerification: 'pending',
      insuranceVerification: 'pending',
    },
    canModify: api.can_modify || { cancel: false, swap: false, reduce: false, extend: false },
  };
}

// Fetch booking by ID (uses X-Booking-Token)
export async function getBookingById(bookingId: number | string): Promise<BookingDetails> {
  try {
    const res = await axios.get<ApiBooking>(
      `${API_URL}/api/bookings/${bookingId}/`,
      { headers: getBookingTokenHeaders() }
    );
    return transformBooking(res.data);
  } catch (error) {
    throw error;
  }
}

// Validate a promo code (public endpoint with domain)
export async function validatePromoCode(params: {
  code: string;
  base_price: number;
  extras_price?: number;
  fees?: number;
  location_charges?: number;
}): Promise<{
  valid: boolean;
  error?: string;
  promo_code_id?: number;
  discount_type?: string;
  discount_value?: string;
  discount_amount?: string;
}> {
  const domainParams = getDomainParams();
  const res = await axios.post(
    `${API_URL}/api/promo-codes/public/validate/`,
    params,
    { params: domainParams, headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
}

// Customer data for booking
export interface CustomerData {
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
}

// Create booking request payload
export interface CreateBookingPayload {
  fleet_id: number;
  customer: CustomerData;
  pickup_datetime: string;
  dropoff_datetime: string;
  pickup_location_id: number;
  dropoff_location_id?: number;
  insurance_selected: boolean;
  cdw_cover: boolean;
  rcli_cover: boolean;
  sli_cover: boolean;
  pai_cover: boolean;
  extras?: { id: number; quantity: number }[];
  discount_code?: string;
  promo_code?: string;
}

// Create booking API response
interface CreateBookingResponse {
  booking_id: number;
  booking_reference: string;
  access_token: string;
  token_expires_at: string;
  total_price: string;
  status: string;
  customer_id?: number;
}

// Create a new booking via public endpoint (handles customer creation server-side)
export async function createBooking(payload: CreateBookingPayload): Promise<{ id: number; bookingToken: string; customerId: number }> {
  try {
    const domainParams = getDomainParams();
    const bookingPayload = {
      first_name: payload.customer.first_name,
      last_name: payload.customer.last_name,
      email: payload.customer.email,
      phone: payload.customer.phone_no.slice(0, 15),
      fleet_id: payload.fleet_id,
      pickup_location_id: payload.pickup_location_id,
      dropoff_location_id: payload.dropoff_location_id || payload.pickup_location_id,
      pickup_datetime: payload.pickup_datetime,
      dropoff_datetime: payload.dropoff_datetime,
      extras: payload.extras || [],
      additional_drivers: 0,
      fuel_pre_purchase: false,
      return_car_to_different_branch: false,
      notes: '',
      insurance_selected: payload.insurance_selected,
      cdw_cover: payload.cdw_cover,
      rcli_cover: payload.rcli_cover,
      sli_cover: payload.sli_cover,
      pai_cover: payload.pai_cover,
      ...(payload.promo_code ? { promo_code: payload.promo_code } : {}),
    };

    const res = await axios.post<CreateBookingResponse>(
      `${API_URL}/api/bookings/public/create/`,
      bookingPayload,
      {
        params: domainParams,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    // Store booking token for subsequent API calls
    const token = res.data.access_token;
    if (token) {
      setBookingToken(token);
    }

    const bookingId = res.data.booking_id;

    // Get customer_id: prefer from create response, otherwise fetch from booking details
    let customerId = res.data.customer_id || 0;

    if (!customerId && token) {
      try {
        // Raw GET to extract customer_id — avoids fragile transformBooking
        const bookingRes = await axios.get<{ customer?: { id?: number } }>(
          `${API_URL}/api/bookings/${bookingId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Booking-Token': token,
            },
          }
        );
        customerId = bookingRes.data?.customer?.id || 0;
      } catch {
        // Could not fetch booking details for customer_id; continue with default
      }
    }

    return {
      id: bookingId,
      bookingToken: token,
      customerId,
    };
  } catch (error) {
    throw error;
  }
}

// Cancel a booking (uses X-Booking-Token)
export async function cancelBooking(
  bookingId: number | string,
  reason: string = 'Payment failed'
): Promise<void> {
  await axios.post(
    `${API_URL}/api/bookings/${bookingId}/cancel/`,
    { cancellation_reason: reason },
    { headers: getBookingTokenHeaders() }
  );
}

// Lookup a booking by ID + last name/email (public, no auth)
export interface BookingLookupPayload {
  booking_id: string;
  last_name?: string;
  email?: string;
}

export interface LookupBookingItem {
  id: number;
  booking_reference: string;
  booking_token: string;
  status: string;
  payment_status: string;
  pickup_datetime: string;
  dropoff_datetime: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  vehicle: {
    name: string;
    plate_number: string;
    image: string | null;
  };
}

export interface BookingLookupResponse {
  searched_booking_id: number;
  booking_token: string;
  customer_name: string;
  bookings: LookupBookingItem[];
}

export async function lookupBooking(payload: BookingLookupPayload): Promise<BookingLookupResponse> {
  const domainParams = getDomainParams();
  const res = await axios.post<BookingLookupResponse>(
    `${API_URL}/api/bookings/public/lookup/`,
    payload,
    {
      params: domainParams,
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return res.data;
}

// Booking Driver Types
export interface BookingDriver {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  identity_verified: boolean;
}

// Get booking drivers (uses X-Booking-Token)
export async function getBookingDrivers(bookingId: number | string): Promise<BookingDriver[]> {
  try {
    const res = await axios.get<BookingDriver[] | { results: BookingDriver[] }>(
      `${API_URL}/api/bookings/${bookingId}/booking-driver/`,
      { headers: getBookingTokenHeaders() }
    );
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  } catch {
    return [];
  }
}

// Create a booking driver (uses X-Booking-Token)
export async function createBookingDriver(
  bookingId: number | string,
  driver: { full_name: string; email: string; phone: string }
): Promise<BookingDriver> {
  const res = await axios.post<BookingDriver>(
    `${API_URL}/api/bookings/${bookingId}/booking-driver/`,
    driver,
    { headers: getBookingTokenHeaders() }
  );
  return res.data;
}

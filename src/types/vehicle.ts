// API response types (from backend)
export interface ApiVehicleImage {
  id: number;
  image: string;
  is_thumbnail: boolean;
}

export interface ApiBookingPrice {
  id?: number;
  price_per_day?: number | null;
  price_per_hour?: number | null;
  discounts?: {
    unit_type?: string;
    number_of_days: number;
    discount_percentage: number;
    is_active: boolean;
  }[];
  /** True when any day in the requested booking window has a dynamic-pricing
   *  override applied (could be a peak-day premium OR a promotional rate). */
  is_dynamic?: boolean;
  /** True when the override RAISES the average per-day rate above base. */
  is_peak?: boolean;
  /** True when the override LOWERS the average per-day rate below base. */
  is_promo?: boolean;
}

export interface ApiFleetExtra {
  id: number;
  description: string;
  price: number;
  period: 'per_day' | 'per_trip';
  icon?: string;
}

export interface ApiTaxItem {
  id?: number;
  tax_name: string;
  tax_type: 'percentage' | 'fixed_amount';
  percentage?: number;
  fixed_amount?: number;
  trip_type: 'per_trip' | 'per_day';
  display_order?: number;
}

export interface ApiTaxProfile {
  id?: number;
  name?: string;
  applicable_on_base_price?: boolean;
  applicable_on_extras?: boolean;
  applicable_on_fees?: boolean;
  applicable_on_security_deposit?: boolean;
  applicable_on_location_charges?: boolean;
  is_default?: boolean;
  tax_items?: ApiTaxItem[];
}

export interface ApiBookingRule {
  id?: number;
  available_at?: number[];
  miles_per_day?: number;
  miles_overage_rate?: number;
  security_deposit?: number;
  use_default_security_deposit?: boolean;
  booking_fee?: number;
  extras?: ApiFleetExtra[];
  tax_profile?: ApiTaxProfile | number | null;
  use_default_tax_profile?: boolean;
}

export interface ApiFleetClass {
  id: number;
  name: string;
  description: string;
}

export interface ApiVehicle {
  id: number;
  name: string;
  year?: number;
  make?: string;
  model?: string;
  color?: string;
  plate_number?: string;
  vin_number?: string;
  seats?: number;
  doors?: number;
  transmission?: string;
  fuel_type?: string;
  fleet_class?: ApiFleetClass;
  location?: string;
  description?: string;
  status?: string;
  images?: ApiVehicleImage[];
  company?: number;
  // Nested objects from detail endpoint
  booking_price?: ApiBookingPrice;
  booking_rule?: ApiBookingRule;
  // Flat fields from list endpoint (if included)
  price_per_day?: number;
}

export interface ApiPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Frontend types (for UI)
export interface TaxItem {
  name: string;
  type: 'percentage' | 'fixed_amount';
  percentage?: number;
  fixedAmount?: number;
  tripType: 'per_trip' | 'per_day';
}

export interface TaxProfile {
  applicableOnBasePrice: boolean;
  applicableOnExtras: boolean;
  applicableOnFees: boolean;
  applicableOnSecurityDeposit: boolean;
  applicableOnLocationCharges: boolean;
  items: TaxItem[];
}

export interface Vehicle {
  id: string;
  name: string;
  year: number;
  image: string;
  images: string[];
  location: string;
  seats: number;
  transmission: string;
  fuelType: string;
  vehicleType: string;
  make: string;
  model: string;
  color: string;
  pricePerDay: number;
  pricePerHour: number;
  /** Surfaced from the public fleet endpoint when called with booking
   *  dates — true if any day in the window has a dynamic-pricing entry. */
  isDynamicPricing?: boolean;
  /** Override actually raises the rate vs base — show "peak pricing" hint. */
  isPeakPricing?: boolean;
  /** Override actually lowers the rate vs base — show "promo pricing" hint. */
  isPromoPricing?: boolean;
  maxDiscount?: number;
  discounts?: { unitType: string; units: number; percentage: number }[];
  licensePlate: string;
  vin: string;
  description: string;
  status?: string;
  availableLocations?: number[];
  milesPerDay?: number;
  milesOverageRate?: number;
  securityDeposit?: number;
  bookingFee?: number;
  taxProfile?: TaxProfile | null;
  extras: VehicleExtra[];
}

export interface VehicleExtra {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  hasQuantity: boolean;
  icon?: string;
}

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.png';

export function parseTaxProfile(raw: ApiTaxProfile | number | null | undefined): TaxProfile | null {
  if (!raw || typeof raw === 'number') return null;
  if (!raw.tax_items || raw.tax_items.length === 0) return null;
  return {
    applicableOnBasePrice: raw.applicable_on_base_price ?? true,
    applicableOnExtras: raw.applicable_on_extras ?? false,
    applicableOnFees: raw.applicable_on_fees ?? false,
    applicableOnSecurityDeposit: raw.applicable_on_security_deposit ?? false,
    applicableOnLocationCharges: raw.applicable_on_location_charges ?? false,
    items: raw.tax_items.map((item) => ({
      name: item.tax_name,
      type: item.tax_type,
      percentage: item.percentage != null ? Number(item.percentage) : undefined,
      fixedAmount: item.fixed_amount != null ? Number(item.fixed_amount) : undefined,
      tripType: item.trip_type,
    })),
  };
}

/**
 * Calculate tax based on a tax profile and pricing components.
 */
export function calculateTax(
  taxProfile: TaxProfile | null | undefined,
  amounts: {
    basePrice: number;
    extrasCost: number;
    fees: number;
    securityDeposit: number;
    locationCharges: number;
    rentalDays: number;
  },
): number {
  if (!taxProfile || taxProfile.items.length === 0) return 0;

  // Determine taxable amount based on profile settings
  let taxableAmount = 0;
  if (taxProfile.applicableOnBasePrice) taxableAmount += amounts.basePrice;
  if (taxProfile.applicableOnExtras) taxableAmount += amounts.extrasCost;
  if (taxProfile.applicableOnFees) taxableAmount += amounts.fees;
  if (taxProfile.applicableOnSecurityDeposit) taxableAmount += amounts.securityDeposit;
  if (taxProfile.applicableOnLocationCharges) taxableAmount += amounts.locationCharges;

  let totalTax = 0;
  for (const item of taxProfile.items) {
    if (item.type === 'percentage') {
      totalTax += taxableAmount * (item.percentage ?? 0) / 100;
    } else {
      // Fixed amount — multiply by days if per_day
      const fixedAmt = item.fixedAmount ?? 0;
      totalTax += item.tripType === 'per_day' ? fixedAmt * amounts.rentalDays : fixedAmt;
    }
  }

  return Math.round(totalTax * 100) / 100;
}

// Transformer function to convert API data to frontend format
export function transformApiVehicle(apiVehicle: ApiVehicle): Vehicle {
  const thumbnailImage = apiVehicle.images?.find((img) => img.is_thumbnail);
  const mainImage =
    thumbnailImage?.image ||
    apiVehicle.images?.[0]?.image ||
    PLACEHOLDER_IMAGE;

  // Price can be nested in booking_price or flat at top level
  const pricePerDay = Number(
    apiVehicle.booking_price?.price_per_day ??
      apiVehicle.price_per_day ??
      0,
  );
  const pricePerHour = Number(apiVehicle.booking_price?.price_per_hour ?? 0);
  const activeDiscounts = (apiVehicle.booking_price?.discounts || []).filter((d) => d.is_active);
  const maxDiscount = activeDiscounts.length > 0
    ? Math.max(...activeDiscounts.map((d) => d.discount_percentage))
    : 0;

  return {
    id: String(apiVehicle.id),
    name: apiVehicle.name || 'Unknown Vehicle',
    year: apiVehicle.year || new Date().getFullYear(),
    image: mainImage,
    images: apiVehicle.images?.map((img) => img.image) || [mainImage],
    location: apiVehicle.location || '',
    seats: apiVehicle.seats || 4,
    transmission: apiVehicle.transmission || '',
    fuelType: apiVehicle.fuel_type || '',
    vehicleType: apiVehicle.fleet_class?.description || '',
    make: apiVehicle.make || '',
    model: apiVehicle.model || '',
    color: apiVehicle.color || '',
    pricePerDay,
    pricePerHour,
    isDynamicPricing: !!apiVehicle.booking_price?.is_dynamic,
    isPeakPricing: !!apiVehicle.booking_price?.is_peak,
    isPromoPricing: !!apiVehicle.booking_price?.is_promo,
    maxDiscount,
    discounts: activeDiscounts.map((d) => ({
      unitType: d.unit_type || 'day',
      units: d.number_of_days,
      percentage: d.discount_percentage,
    })),
    licensePlate: apiVehicle.plate_number || '',
    vin: apiVehicle.vin_number || '',
    description: apiVehicle.description || '',
    status: apiVehicle.status,
    availableLocations: apiVehicle.booking_rule?.available_at || [],
    milesPerDay: apiVehicle.booking_rule?.miles_per_day,
    milesOverageRate: apiVehicle.booking_rule?.miles_overage_rate,
    securityDeposit: Number(apiVehicle.booking_rule?.security_deposit) || 0,
    bookingFee: Number(apiVehicle.booking_rule?.booking_fee) || 0,
    taxProfile: parseTaxProfile(apiVehicle.booking_rule?.tax_profile),
    extras: (apiVehicle.booking_rule?.extras || []).map((e) => ({
      id: String(e.id),
      title: e.description,
      description: e.description,
      price: Number(e.price),
      priceUnit: e.period === 'per_day' ? '/day' : '/trip',
      hasQuantity: false,
      icon: e.icon,
    })),
  };
}

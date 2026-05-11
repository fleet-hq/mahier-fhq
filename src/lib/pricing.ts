export type RateUnit = 'day' | 'hour';

export interface BasePriceResult {
  /** Total base price (subtotal before extras/fees/tax) */
  total: number;
  /** Which rate was applied — drives the invoice display */
  unit: RateUnit;
  /** Quantity in the chosen unit (days or hours) */
  quantity: number;
  /** Per-unit price */
  unitPrice: number;
}

/** Bookings of 23 hours or less use the hourly rate (when available). */
const HOURLY_RATE_MAX_HOURS = 23;

interface CalculateBasePriceArgs {
  pricePerDay: number;
  pricePerHour: number;
  rentalDays: number;
  rentalHours: number;
}

/**
 * Mirrors the backend `BasePriceCalculator.calculate()` logic so the
 * customer sees the same total as the backend will compute. The backend
 * remains the source of truth — this is for UI preview only.
 *
 * Rules:
 * - 23 hours or less → hourly rate (if available, else daily)
 * - 24 hours or more → daily rate (if available, else hourly)
 */
export function calculateBasePrice({
  pricePerDay,
  pricePerHour,
  rentalDays,
  rentalHours,
}: CalculateBasePriceArgs): BasePriceResult {
  const hasDaily = pricePerDay > 0;
  const hasHourly = pricePerHour > 0;

  if (rentalHours <= HOURLY_RATE_MAX_HOURS && hasHourly) {
    return { total: pricePerHour * rentalHours, unit: 'hour', quantity: rentalHours, unitPrice: pricePerHour };
  }

  if (hasDaily) {
    return { total: pricePerDay * rentalDays, unit: 'day', quantity: rentalDays, unitPrice: pricePerDay };
  }

  // Fallback: only hourly rate set for a long booking
  if (hasHourly) {
    return { total: pricePerHour * rentalHours, unit: 'hour', quantity: rentalHours, unitPrice: pricePerHour };
  }

  return { total: 0, unit: 'day', quantity: rentalDays, unitPrice: 0 };
}


// ─────────────────────────────────────────────────────────────────
// Pure end-to-end pricing helper used by useBookingInvoice and
// tested directly against the backend's PricingService output.
//
// Backend invariant (bookings/services.py PricingService):
//   discounted_price = base − fleet_discount − applied_discount
//   tax              = TaxCalculator(...).calculate(base_price=discounted_price)
//   total            = discounted_price + extras + location + fees + tax
//
// Pre-checkout used to tax baseSubtotal (un-discounted) which made
// the form preview run high by tax_rate × discount. The helper now
// taxes the discounted base, matching the backend.
// ─────────────────────────────────────────────────────────────────

export interface FleetDiscountTier {
  unitType: 'day' | 'hour';
  units: number;
  percentage: number;
}

export interface SimpleTaxItem {
  type: 'percentage' | 'fixed';
  percentage?: number;
  fixedAmount?: number;
  tripType?: 'per_day' | 'per_trip';
}

export interface SimpleTaxProfile {
  items: SimpleTaxItem[];
  applicableOnBasePrice: boolean;
  applicableOnExtras: boolean;
  applicableOnFees: boolean;
  applicableOnSecurityDeposit: boolean;
  applicableOnLocationCharges: boolean;
}

export interface ComputeBookingPricingArgs {
  pricePerDay: number;
  pricePerHour: number;
  rentalDays: number;
  rentalHours: number;
  insuranceCost: number;
  extrasCost: number;
  locationCharges: number;
  bookingFee: number;
  securityDeposit: number;
  fleetDiscounts: FleetDiscountTier[];
  appliedDiscount: number;
  taxProfile: SimpleTaxProfile | null;
}

export interface ComputedBookingPricing {
  baseSubtotal: number;
  fleetDiscount: number;
  discount: number;
  taxableBase: number;
  tax: number;
  total: number;
  rateUnit: RateUnit;
  quantity: number;
}

function pickFleetDiscount(
  discounts: FleetDiscountTier[], unit: RateUnit, quantity: number,
): FleetDiscountTier | null {
  const matching = discounts
    .filter((d) => d.unitType === unit && d.units <= quantity)
    .sort((a, b) => b.units - a.units);
  return matching[0] ?? null;
}

function calcTax(profile: SimpleTaxProfile | null, taxableAmounts: {
  basePrice: number; extrasCost: number; fees: number;
  securityDeposit: number; locationCharges: number; rentalDays: number;
}): number {
  if (!profile || profile.items.length === 0) return 0;
  let taxable = 0;
  if (profile.applicableOnBasePrice) taxable += taxableAmounts.basePrice;
  if (profile.applicableOnExtras) taxable += taxableAmounts.extrasCost;
  if (profile.applicableOnFees) taxable += taxableAmounts.fees;
  if (profile.applicableOnSecurityDeposit) taxable += taxableAmounts.securityDeposit;
  if (profile.applicableOnLocationCharges) taxable += taxableAmounts.locationCharges;
  let total = 0;
  for (const item of profile.items) {
    if (item.type === 'percentage') {
      total += taxable * (item.percentage ?? 0) / 100;
    } else {
      const a = item.fixedAmount ?? 0;
      total += item.tripType === 'per_day' ? a * taxableAmounts.rentalDays : a;
    }
  }
  return Math.round(total * 100) / 100;
}

export function computeBookingPricing(
  args: ComputeBookingPricingArgs,
): ComputedBookingPricing {
  const base = calculateBasePrice({
    pricePerDay: args.pricePerDay,
    pricePerHour: args.pricePerHour,
    rentalDays: args.rentalDays,
    rentalHours: args.rentalHours,
  });
  const baseSubtotal = base.total;

  // Fleet discount (tier-based) — mirrors backend DiscountCalculator
  const tier = pickFleetDiscount(args.fleetDiscounts, base.unit, base.quantity);
  const fleetDiscount = tier ? baseSubtotal * (tier.percentage / 100) : 0;
  const discount = fleetDiscount + args.appliedDiscount;

  // Backend taxes the discounted rental — see PricingService.
  const taxableBase = Math.max(0, baseSubtotal - discount);
  const tax = calcTax(args.taxProfile, {
    basePrice: taxableBase,
    extrasCost: args.extrasCost,
    fees: args.bookingFee,
    securityDeposit: args.securityDeposit,
    locationCharges: args.locationCharges,
    rentalDays: args.rentalDays,
  });

  const total =
    baseSubtotal
    + args.insuranceCost
    + args.extrasCost
    + args.locationCharges
    + args.bookingFee
    + tax
    - discount;

  return {
    baseSubtotal,
    fleetDiscount,
    discount,
    taxableBase,
    tax,
    total: Math.round(total * 100) / 100,
    rateUnit: base.unit,
    quantity: base.quantity,
  };
}

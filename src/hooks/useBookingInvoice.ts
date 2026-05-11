import { useMemo } from 'react';
import { calculateTax } from '@/types/vehicle';
import type { TaxProfile, VehicleExtra } from '@/types/vehicle';
import type { InsuranceOption } from '@/services/bookingServices';
import type { Location } from '@/services/locationServices';
import { calculateBasePrice, type RateUnit } from '@/lib/pricing';

// IMPORTANT — the pricing math here must stay in lock-step with the
// backend bookings/services.py PricingService. Pure parity coverage
// lives in src/lib/pricing.ts (computeBookingPricing) and is asserted
// by src/lib/pricing.test.ts which mirrors bookings/test_pricing_parity.py.
// If you change the formula, run `npx tsx src/lib/pricing.test.ts`
// AND `python manage.py test bookings.test_pricing_parity` and update
// both fixtures together.

export interface InvoiceItem {
  image: string;
  name: string;
  licensePlate: string;
  quantity: number;
  /** Per-unit price (per day or per hour) */
  unitPrice: number;
  /** Whether the quantity represents days or hours */
  unit: RateUnit;
  /** @deprecated kept for backwards compat — use `unitPrice` */
  pricePerDay?: number;
  periodLabel?: string;
}

export interface ExtraInvoiceItem {
  name: string;
  price: number;
}

export interface BookingPricing {
  subtotal: number;
  insuranceCost: number;
  extrasCost: number;
  locationCharges: number;
  discount: number;
  tax: number;
  total: number;
  deposit: number;
  bookingFee: number;
  /** Which rate was applied — drives the invoice display */
  rateUnit: RateUnit;
}

export interface UseBookingInvoiceParams {
  vehicleData: {
    pricePerDay: number;
    pricePerHour?: number;
    discounts?: { unitType: string; units: number; percentage: number }[];
    securityDeposit?: number;
    bookingFee?: number;
    taxProfile?: TaxProfile | null;
    image: string;
    name: string;
    licensePlate: string;
    description: string;
    extras: VehicleExtra[];
  } | null;
  rentalDays: number;
  /** Total booked hours (rounded up to nearest hour, min 1) */
  rentalHours: number;
  /** Pickup date as YYYY-MM-DD — used to compute Bonzah-style insurance day count */
  pickupDate?: string;
  /** Dropoff date as YYYY-MM-DD */
  dropoffDate?: string;
  selectedInsurance: Set<string>;
  insuranceOptions: InsuranceOption[];
  selectedExtras: Record<string, { enabled: boolean; quantity: number }>;
  companyLocations: Location[];
  pickupLocationId: string | null;
  dropoffLocationId: string | null;
  appliedDiscount: number;
  discountCode?: string;
  defaultTaxProfile?: TaxProfile | null;
}

export interface BookingInvoiceResult {
  pricing: BookingPricing;
  invoiceItems: InvoiceItem[];
  extraInvoiceItems: ExtraInvoiceItem[];
  insuranceLabel: string;
}

export function useBookingInvoice({
  vehicleData,
  rentalDays,
  rentalHours,
  selectedInsurance,
  insuranceOptions,
  selectedExtras,
  companyLocations,
  pickupLocationId,
  dropoffLocationId,
  appliedDiscount,
  discountCode,
  defaultTaxProfile,
}: UseBookingInvoiceParams): BookingInvoiceResult {
  const extras = vehicleData?.extras ?? [];

  // Compute base price using the same strategy as the backend
  const basePrice = useMemo(() => {
    if (!vehicleData) return null;
    return calculateBasePrice({
      pricePerDay: vehicleData.pricePerDay || 0,
      pricePerHour: vehicleData.pricePerHour || 0,
      rentalDays,
      rentalHours,
    });
  }, [vehicleData, rentalDays, rentalHours]);

  const pricing = useMemo<BookingPricing>(() => {
    if (!vehicleData || !basePrice) {
      return {
        subtotal: 0, insuranceCost: 0, extrasCost: 0, locationCharges: 0,
        discount: 0, tax: 0, total: 0, deposit: 0, bookingFee: 0,
        rateUnit: 'day',
      };
    }

    const baseSubtotal = basePrice.total;

    // Insurance day count now matches rentalDays — the rental and
    // insurance lines on a single booking always agree under the
    // calendar-dates-touched policy. Previously these diverged
    // (rental = ceil-of-seconds, insurance = calendar_diff + 1) which
    // confused customers seeing "3-day rental, 4-day insurance" on
    // the same booking.
    let insuranceCost = 0;
    if (selectedInsurance.size > 0 && !selectedInsurance.has('own')) {
      selectedInsurance.forEach((id) => {
        const option = insuranceOptions.find((opt) => opt.id === id);
        if (option) insuranceCost += option.price * rentalDays;
      });
    }

    // Extras cost
    let extrasCost = 0;
    Object.entries(selectedExtras).forEach(([id, state]) => {
      if (state.enabled) {
        const extra = extras.find((e) => e.id === id);
        if (extra) {
          const quantity = state.quantity || 1;
          const cost = extra.priceUnit === '/day'
            ? extra.price * quantity * rentalDays
            : extra.price * quantity;
          extrasCost += cost;
        }
      }
    });

    // Location charges from selected pickup + dropoff locations
    const pickupPrice = companyLocations.find((loc) => loc.id === pickupLocationId)?.price || 0;
    const dropoffPrice = pickupLocationId === dropoffLocationId
      ? 0
      : (companyLocations.find((loc) => loc.id === dropoffLocationId)?.price || 0);
    const locationCharges = pickupPrice + dropoffPrice;

    // Fleet discount based on duration (mirrors backend DiscountCalculator)
    let fleetDiscount = 0;
    if (vehicleData.discounts && vehicleData.discounts.length > 0) {
      const isHourly = basePrice.unit === 'hour';
      const quantity = basePrice.quantity;
      const matching = vehicleData.discounts
        .filter((d) => d.unitType === (isHourly ? 'hour' : 'day') && d.units <= quantity)
        .sort((a, b) => b.units - a.units);
      const best = matching[0];
      if (best) {
        fleetDiscount = baseSubtotal * (best.percentage / 100);
      }
    }

    const subtotal = baseSubtotal + insuranceCost + extrasCost;
    const discount = appliedDiscount + fleetDiscount;
    const deposit = vehicleData.securityDeposit || 0;
    const bookingFee = vehicleData.bookingFee || 0;

    // Use vehicle's own tax profile, or fall back to company default.
    // Tax must run against the DISCOUNTED rental base — the backend
    // applies tax after duration/promo discounts are deducted, so taxing
    // the undiscounted figure here would over-quote (off by tax%×discount).
    const taxableBase = Math.max(0, baseSubtotal - fleetDiscount - appliedDiscount);
    const effectiveTaxProfile = vehicleData.taxProfile ?? defaultTaxProfile ?? null;
    const tax = calculateTax(effectiveTaxProfile, {
      basePrice: taxableBase,
      extrasCost,
      fees: bookingFee,
      securityDeposit: deposit,
      locationCharges,
      rentalDays,
    });

    const total = subtotal - discount + tax + locationCharges + bookingFee;

    return {
      subtotal, insuranceCost, extrasCost, locationCharges,
      discount, tax, total, deposit, bookingFee,
      rateUnit: basePrice.unit,
    };
  }, [vehicleData, rentalDays, basePrice, appliedDiscount, selectedInsurance, insuranceOptions, selectedExtras, extras, companyLocations, pickupLocationId, dropoffLocationId, defaultTaxProfile]);

  const invoiceItems = useMemo<InvoiceItem[]>(() => {
    if (!vehicleData || !basePrice) return [];
    return [
      {
        image: vehicleData.image,
        name: `${vehicleData.name}${vehicleData.licensePlate ? ` - ${vehicleData.licensePlate}` : ''}`,
        licensePlate: vehicleData.licensePlate,
        quantity: basePrice.quantity,
        unitPrice: basePrice.unitPrice,
        unit: basePrice.unit,
        pricePerDay: vehicleData.pricePerDay,
      },
    ];
  }, [vehicleData, basePrice]);

  const extraInvoiceItems = useMemo<ExtraInvoiceItem[]>(() => {
    const items: ExtraInvoiceItem[] = [];
    Object.entries(selectedExtras).forEach(([id, state]) => {
      if (state.enabled) {
        const extra = extras.find((e) => e.id === id);
        if (extra) {
          const quantity = state.quantity || 1;
          const cost = extra.priceUnit === '/day'
            ? extra.price * quantity * rentalDays
            : extra.price * quantity;
          items.push({ name: extra.title, price: cost });
        }
      }
    });
    return items;
  }, [selectedExtras, extras, rentalDays]);

  const insuranceLabel = useMemo(() => {
    if (selectedInsurance.size > 0 && !selectedInsurance.has('own')) {
      return [...selectedInsurance].map((id) => id.toUpperCase()).join(', ');
    }
    return '';
  }, [selectedInsurance]);

  return { pricing, invoiceItems, extraInvoiceItems, insuranceLabel };
}

/**
 * FE pricing parity tests.
 *
 * Mirrors bookings/test_pricing_parity.py on the backend — the same
 * fixtures and the same expected numbers. Run via:
 *   npx tsx src/lib/pricing.test.ts
 *
 * If the backend formula changes (or the FE diverges), this script
 * exits non-zero and prints which scenario broke.
 */

import {
  computeBookingPricing,
  type ComputeBookingPricingArgs,
  type SimpleTaxProfile,
} from './pricing';

let failures = 0;

function eq(label: string, actual: number, expected: number, eps = 0.005) {
  if (Math.abs(actual - expected) > eps) {
    console.error(`  ✗ ${label}: got ${actual}, expected ${expected}`);
    failures += 1;
  } else {
    console.log(`  ✓ ${label}: ${actual.toFixed(2)}`);
  }
}

const TAX_PROFILE_10_PCT_BASE: SimpleTaxProfile = {
  items: [{ type: 'percentage', percentage: 10 }],
  applicableOnBasePrice: true,
  applicableOnExtras: false,
  applicableOnFees: false,
  applicableOnSecurityDeposit: false,
  applicableOnLocationCharges: false,
};

const NO_TAX: SimpleTaxProfile = {
  items: [],
  applicableOnBasePrice: true,
  applicableOnExtras: false,
  applicableOnFees: false,
  applicableOnSecurityDeposit: false,
  applicableOnLocationCharges: false,
};

const baseArgs = (over: Partial<ComputeBookingPricingArgs> = {}): ComputeBookingPricingArgs => ({
  pricePerDay: 200,
  pricePerHour: 0,
  rentalDays: 6,
  rentalHours: 144,
  insuranceCost: 0,
  extrasCost: 0,
  locationCharges: 0,
  bookingFee: 5,
  securityDeposit: 50,
  fleetDiscounts: [],
  appliedDiscount: 0,
  taxProfile: TAX_PROFILE_10_PCT_BASE,
  ...over,
});

console.log('Booking creation parity');

// ── 1. Base, no discount ─────────────────────────────────────
{
  const r = computeBookingPricing(baseArgs());
  // base $1200 + tax 10% on $1200 = $120 + fee $5 = $1325
  console.log('Test: base no-discount');
  eq('  baseSubtotal', r.baseSubtotal, 1200);
  eq('  fleetDiscount', r.fleetDiscount, 0);
  eq('  tax', r.tax, 120);
  eq('  total', r.total, 1325);
}

// ── 2. The discount-tax bug fixture ──────────────────────────
{
  const r = computeBookingPricing(baseArgs({
    fleetDiscounts: [{ unitType: 'day', units: 5, percentage: 5 }],
  }));
  // base $1200, discount $60 → discounted $1140; tax 10% × $1140 = $114
  // total = $1140 + $5 + $114 = $1259
  console.log('Test: discount-tax bug — tax must run on discounted base');
  eq('  baseSubtotal', r.baseSubtotal, 1200);
  eq('  fleetDiscount', r.fleetDiscount, 60);
  eq('  taxableBase', r.taxableBase, 1140);
  eq('  tax (must be $114, not $120)', r.tax, 114);
  eq('  total (must be $1259, not $1265)', r.total, 1259);
}

// ── 3. Tier doesn't apply below threshold ────────────────────
{
  const r = computeBookingPricing(baseArgs({
    rentalDays: 4,
    rentalHours: 96,
    fleetDiscounts: [{ unitType: 'day', units: 5, percentage: 5 }],
  }));
  // 4 days × $200 = $800, no tier match, tax 10% = $80, fee $5 → $885
  console.log('Test: discount tier does not apply below threshold');
  eq('  baseSubtotal', r.baseSubtotal, 800);
  eq('  fleetDiscount', r.fleetDiscount, 0);
  eq('  tax', r.tax, 80);
  eq('  total', r.total, 885);
}

// ── 4. Higher tier supersedes lower ──────────────────────────
{
  const r = computeBookingPricing(baseArgs({
    rentalDays: 12,
    rentalHours: 288,
    fleetDiscounts: [
      { unitType: 'day', units: 5, percentage: 5 },
      { unitType: 'day', units: 10, percentage: 10 },
    ],
  }));
  // 12 days × $200 = $2400, 10% tier → $240 discount, discounted $2160
  // tax 10% × $2160 = $216, total = $2160 + $5 + $216 = $2381
  console.log('Test: 10% tier wins over 5% on 12-day booking');
  eq('  fleetDiscount', r.fleetDiscount, 240);
  eq('  tax', r.tax, 216);
  eq('  total', r.total, 2381);
}

// ── 5. Insurance + location + extras pass through ────────────
{
  const r = computeBookingPricing(baseArgs({
    insuranceCost: 100,
    extrasCost: 30,
    locationCharges: 200,
    fleetDiscounts: [{ unitType: 'day', units: 5, percentage: 5 }],
  }));
  // discounted $1140; tax 10% × $1140 = $114
  // total = $1140 + $100 ins + $30 extras + $200 loc + $5 fee + $114 tax = $1589
  console.log('Test: insurance + extras + location pass through');
  eq('  total', r.total, 1589);
}

// ── 6. No tax profile ────────────────────────────────────────
{
  const r = computeBookingPricing(baseArgs({
    taxProfile: NO_TAX,
    fleetDiscounts: [{ unitType: 'day', units: 5, percentage: 5 }],
  }));
  // discounted $1140 + fee $5 + 0 tax = $1145
  console.log('Test: zero tax profile');
  eq('  tax', r.tax, 0);
  eq('  total', r.total, 1145);
}

// ── 7. Hourly booking under 23h uses hourly rate ─────────────
{
  const r = computeBookingPricing(baseArgs({
    rentalDays: 1,
    rentalHours: 5,
    pricePerHour: 30,
    pricePerDay: 200,
    bookingFee: 0,
    taxProfile: NO_TAX,
  }));
  // 5h × $30 = $150 base, no discount, no tax → $150
  console.log('Test: short hourly booking');
  eq('  baseSubtotal', r.baseSubtotal, 150);
  eq('  rateUnit', r.rateUnit === 'hour' ? 1 : 0, 1);
  eq('  total', r.total, 150);
}

// ── 8. Promo code on top of fleet tier ───────────────────────
{
  const r = computeBookingPricing(baseArgs({
    fleetDiscounts: [{ unitType: 'day', units: 5, percentage: 5 }],
    appliedDiscount: 100, // explicit promo
  }));
  // base $1200, fleet discount $60, promo $100 → total discount $160
  // discounted base for tax = $1040, tax 10% = $104
  // total = $1200 + $5 + $104 - $160 = $1149
  console.log('Test: promo + fleet tier stack');
  eq('  discount', r.discount, 160);
  eq('  taxableBase', r.taxableBase, 1040);
  eq('  tax', r.tax, 104);
  eq('  total', r.total, 1149);
}

console.log('');
if (failures > 0) {
  console.error(`✗ ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log('✓ All FE pricing parity assertions passed');

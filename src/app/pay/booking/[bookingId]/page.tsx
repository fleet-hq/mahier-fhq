'use client';

/**
 * Customer-facing permanent payment page.
 *   /pay/booking/:bookingId?token=…
 *
 * Phase 3: read-only — displays outstanding balance, unpaid charges,
 * and payment history pulled from the new billing ledger. The
 * "Pay Now" button is rendered but disabled with a clear note that
 * payment integration is wired up in Phase 4. The legacy per-fee
 * Stripe Checkout URLs that customers received by email continue to
 * work unchanged.
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Spinner } from '@/components/ui';
import { useBookingBalance } from '@/hooks/useBookingBalance';
import { useBookingDetails } from '@/hooks';
import { getBookingToken, setBookingToken } from '@/utils/booking-token';
import {
  createBillingCheckoutSession,
  type BillingChargeRow,
} from '@/services/billingServices';

const CHARGE_TYPE_LABELS: Record<string, string> = {
  booking_fee: 'Booking',
  late_fee: 'Late fee',
  damage_fee: 'Damage fee',
  modification_charge: 'Trip modification',
  insurance_premium: 'Insurance',
  security_deposit: 'Security deposit',
  manual: 'Additional charge',
  adjustment: 'Adjustment',
  other: 'Other',
};

function formatMoney(value: string | number | undefined | null) {
  const n = Number(value ?? 0);
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function formatLongDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusPill({ charge }: { charge: BillingChargeRow }) {
  if (charge.is_voided) {
    return (
      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        Voided
      </span>
    );
  }
  if (charge.status === 'paid') {
    return (
      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
        Paid
      </span>
    );
  }
  if (charge.status === 'partially_paid') {
    return (
      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
        Partial
      </span>
    );
  }
  if (
    charge.status === 'refunded' ||
    charge.status === 'partially_refunded'
  ) {
    return (
      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
        Refunded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
      Pending
    </span>
  );
}

function PayBookingPageInner() {
  const params = useParams();
  const search = useSearchParams();
  const bookingId = params?.bookingId as string;
  const tokenFromUrl = search.get('token');

  // Persist the token so subsequent API calls (modify, balance) can reuse it.
  useEffect(() => {
    if (tokenFromUrl) setBookingToken(tokenFromUrl);
  }, [tokenFromUrl]);

  // Re-evaluate after mount so the sessionStorage check (only valid
  // client-side) actually runs — first render is server-side where
  // window is undefined and would otherwise lock us out forever.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tokenReady = useMemo(() => {
    if (tokenFromUrl) return true;
    if (!mounted) return false;
    return !!getBookingToken();
  }, [tokenFromUrl, mounted]);

  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
  } = useBookingBalance(tokenReady);
  const { data: booking } = useBookingDetails(tokenReady ? bookingId : undefined);

  if (!tokenReady) {
    return (
      <CenterMessage
        title="Booking link required"
        body="Open this page from the link in your booking confirmation email."
      />
    );
  }

  if (balanceLoading) {
    return (
      <main className="flex-1 flex items-center justify-center pt-14 pb-20">
        <Spinner size="lg" />
      </main>
    );
  }

  if (balanceError || !balance) {
    return (
      <CenterMessage
        title="Could not load your balance"
        body="Please refresh the page or use the payment link from your email."
      />
    );
  }

  const outstanding = Number(balance.outstanding_balance);
  const totalPaid = Number(balance.total_paid);
  const totalCharged = Number(balance.total_charged);

  const unpaid = balance.charges.filter(
    (c) => !c.is_voided && (c.status === 'pending' || c.status === 'partially_paid'),
  );
  const paidHistory = balance.charges.filter(
    (c) => !c.is_voided && (c.status === 'paid' || c.status === 'refunded' || c.status === 'partially_refunded'),
  );

  // Surface the original booking payment in the history even when
  // the ledger doesn't carry a booking_fee Charge yet (pre-ledger
  // bookings or tenants without dual-write). Skip it once the
  // ledger has its own booking_fee row so we don't double-count.
  const ledgerHasBookingFee = balance.charges.some((c) => c.type === 'booking_fee');
  const syntheticBookingTotal = Number(booking?.invoice?.total ?? 0);
  const showSyntheticBooking =
    !ledgerHasBookingFee && !!booking && syntheticBookingTotal > 0;

  return (
    <main className="mx-auto w-full pt-10 pb-20" style={{ maxWidth: 720, paddingLeft: 16, paddingRight: 16 }}>
      <Link
        href={`/booking/${bookingId}${tokenFromUrl ? `?token=${tokenFromUrl}` : ''}`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition"
        style={{ fontFamily: 'Manrope, sans-serif' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to booking
      </Link>

      <h1
        className="mt-3 text-navy"
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em' }}
      >
        Booking payment
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Booking #{booking?.invoice?.number ?? bookingId}
      </p>

      {/* Outstanding balance / Pay Now */}
      <section
        className={`mt-6 rounded-xl border ${
          outstanding > 0 ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'
        } p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
      >
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              outstanding > 0 ? 'text-red-600' : 'text-emerald-700'
            }`}
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {outstanding > 0 ? 'Amount due' : 'No balance owed'}
          </p>
          <p
            className="mt-1 text-navy"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em' }}
          >
            {formatMoney(outstanding)}
          </p>
          {outstanding > 0 && (
            <p className="mt-1 text-xs text-slate-600">
              Across {unpaid.length} unpaid {unpaid.length === 1 ? 'item' : 'items'}.
            </p>
          )}
        </div>

        {outstanding > 0 ? <PayNowButton bookingId={bookingId} token={tokenFromUrl} /> : null}
      </section>

      {/* Booking summary */}
      {booking && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          {booking.vehicle?.image && (
            <div className="h-14 w-20 overflow-hidden rounded bg-slate-100 shrink-0 relative">
              <Image src={booking.vehicle.image} alt={booking.vehicle.name} fill className="object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy truncate">
              {booking.vehicle?.name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {booking.pickUp?.date} → {booking.dropOff?.date}
            </p>
          </div>
        </section>
      )}

      {/* Outstanding charges */}
      {unpaid.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-navy" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Outstanding charges
          </h2>
          <div className="mt-2 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {unpaid.map((c) => (
              <ChargeRow key={c.id} charge={c} />
            ))}
          </div>
        </section>
      )}

      {/* Paid history */}
      {(showSyntheticBooking || paidHistory.length > 0) && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-navy" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Payment history
          </h2>
          <div className="mt-2 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {showSyntheticBooking && (
              <SyntheticBookingRow
                amount={syntheticBookingTotal}
                bookedOn={booking?.bookedOn ?? ''}
                vehicleName={booking?.vehicle?.name ?? 'Booking'}
              />
            )}
            {paidHistory.map((c) => (
              <ChargeRow key={c.id} charge={c} />
            ))}
          </div>
        </section>
      )}

      {/* Totals footer */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <Row
          label="Total charge"
          value={formatMoney(totalCharged + (showSyntheticBooking ? syntheticBookingTotal : 0))}
        />
        <Row
          label="Total paid"
          value={formatMoney(totalPaid + (showSyntheticBooking ? syntheticBookingTotal : 0))}
        />
        <div className="mt-2 pt-3 border-t border-slate-100">
          <Row
            label="Outstanding balance"
            value={formatMoney(outstanding)}
            emphasis
            highlight={outstanding > 0}
          />
        </div>
      </section>
    </main>
  );
}

function SyntheticBookingRow({
  amount,
  bookedOn,
  vehicleName,
}: {
  amount: number;
  bookedOn: string;
  vehicleName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-navy truncate">Booking</p>
          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            Paid
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{vehicleName}</p>
        {bookedOn ? (
          <p className="text-[11px] text-slate-400 mt-0.5">{bookedOn}</p>
        ) : null}
      </div>
      <p className="text-sm font-semibold text-navy shrink-0">
        {formatMoney(amount)}
      </p>
    </div>
  );
}

function ChargeRow({ charge }: { charge: BillingChargeRow }) {
  const label = CHARGE_TYPE_LABELS[charge.type] ?? charge.type;
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-navy truncate">{label}</p>
          <StatusPill charge={charge} />
        </div>
        {charge.description ? (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{charge.description}</p>
        ) : null}
        <p className="text-[11px] text-slate-400 mt-0.5">{formatLongDate(charge.created_at)}</p>
      </div>
      <p className="text-sm font-semibold text-navy shrink-0">
        {formatMoney(charge.amount)}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis = false,
  highlight = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`${emphasis ? 'text-sm font-semibold text-navy' : 'text-xs text-slate-500'}`}>
        {label}
      </span>
      <span
        className={`${
          emphasis
            ? `text-base font-bold ${highlight ? 'text-red-600' : 'text-navy'}`
            : 'text-sm font-medium text-navy'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function CenterMessage({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto w-full pt-14 pb-20 flex-1 flex items-center justify-center" style={{ maxWidth: 460, paddingLeft: 16, paddingRight: 16 }}>
      <div className="text-center">
        <h1 className="text-navy text-xl font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{body}</p>
      </div>
    </main>
  );
}

function PayNowButton({
  bookingId,
  token,
}: {
  bookingId: string;
  token: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const tokenSuffix = token ? `?token=${token}` : '';
      const result = await createBillingCheckoutSession({
        successUrl: `${origin}/booking/${bookingId}${tokenSuffix}`,
        cancelUrl: `${origin}/pay/booking/${bookingId}${tokenSuffix}`,
      });
      // Hard nav — Stripe handles the rest.
      window.location.href = result.checkout_url;
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Could not start checkout. Please try again.';
      setError(detail);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="h-12 px-6 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirecting…' : 'Pay Now'}
      </button>
      {error && (
        <p className="text-[11px] text-red-600 max-w-65 text-right">
          {error}
        </p>
      )}
    </div>
  );
}


export default function PayBookingPage() {
  return (
    <>
      <Header showBorderBottom />
      <Suspense fallback={null}>
        <PayBookingPageInner />
      </Suspense>
      <Footer />
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { Button } from '@/components/ui';
import { getBookingById, type BookingDetails } from '@/services/bookingServices';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDomainParams } from '@/utils/company';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function PriceRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">{label}</span>
        {children}
      </div>
      {value && <span className="text-sm text-slate-900">{value}</span>}
    </div>
  );
}

function BigPrice({ label, amount }: { label: string; amount: number }) {
  const [whole, cents] = amount.toFixed(2).split('.');
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-base font-semibold text-slate-900">{label}</span>
      <div>
        <span className="text-xs text-slate-500">USD </span>
        <span className="text-xl font-bold text-slate-900">${whole}</span>
        <span className="text-xs font-bold text-slate-900">.{cents}</span>
      </div>
    </div>
  );
}

export default function SwapCheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const urlToken = searchParams.get('token');
  const newFleetId = searchParams.get('new_fleet_id') || '';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [newFleet, setNewFleet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlToken) setBookingToken(urlToken);
  }, [urlToken]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBookingById(bookingId);
        setBooking(data);

        // Get swap preview
        const previewRes = await axios.get(`${API_URL}/api/bookings/public/modify/`, {
          headers: getBookingTokenHeaders(),
          params: { type: 'swap', new_fleet_id: newFleetId },
        });
        setPreview(previewRes.data);

        // Fetch new fleet details
        try {
          const fleetRes = await axios.get(`${API_URL}/api/fleets/public/${newFleetId}/`, {
            params: getDomainParams(),
            headers: { 'Content-Type': 'application/json' },
          });
          setNewFleet(fleetRes.data);
        } catch {
          // Fleet details are optional — checkout still works without them
        }
      } catch {
        setError('Could not load swap details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId, newFleetId]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    setError('');

    try {
      const successUrl = `${window.location.origin}/booking/${bookingId}?token=${urlToken || ''}`;
      const cancelUrl = `${window.location.origin}/booking/${bookingId}/swap?token=${urlToken || ''}`;

      const res = await axios.post(
        `${API_URL}/api/bookings/public/modify/`,
        {
          type: 'swap',
          new_fleet_id: newFleetId,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
        { headers: getBookingTokenHeaders() }
      );

      if (res.data.status === 'checkout_required' && res.data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = res.data.checkout_url;
      } else {
        // Direct execution (swap with refund, no charge needed)
        router.push(`/booking/${bookingId}?token=${urlToken || ''}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.reason || 'Failed to swap vehicle.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header showBorderBottom />
        <main className="mx-auto w-full pt-14 pb-20 flex-1 flex items-center justify-center" style={{ maxWidth: 580 }}>
          <p className="text-gray-500">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!booking || !preview) {
    return (
      <>
        <Header showBorderBottom />
        <main className="mx-auto w-full pt-14 pb-20 flex-1" style={{ maxWidth: 580, paddingLeft: 16, paddingRight: 16 }}>
          <p className="text-red-500">{error || 'Something went wrong.'}</p>
        </main>
        <Footer />
      </>
    );
  }

  const priceDiff = parseFloat(preview.price_difference || '0');
  const swapFee = parseFloat(preview.modification_fee || '0');
  const newTotal = parseFloat(preview.new_total || booking.invoice.total);
  const refundAmount = parseFloat(preview.refund_amount || '0');
  const additionalCharge = parseFloat(preview.additional_charge || '0');
  const deposit = booking.invoice.deposit || 0;
  const balance = Math.max(0, newTotal - deposit);

  // New fleet image
  const newFleetImage = newFleet?.images?.find((img: any) => img.is_thumbnail)?.image
    || newFleet?.images?.[0]?.image
    || '/images/vehicles/car_placeholder.png';
  const newFleetName = newFleet ? `${newFleet.year || ''} ${newFleet.make || ''} ${newFleet.model || ''}`.trim() || newFleet.name : 'New Vehicle';
  const newFleetPlate = newFleet?.plate_number || '';

  return (
    <>
      <Header showBorderBottom />
      <main className="mx-auto w-full pt-14 pb-20" style={{ maxWidth: 580, paddingLeft: 16, paddingRight: 16 }}>
        <Link
          href={`/booking/${bookingId}/swap?token=${urlToken || ''}`}
          className="inline-flex items-center text-primary underline hover:text-primary-hover"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 12, lineHeight: '100%' }}
        >
          Go Back
        </Link>

        <h1 className="mt-2 text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: '100%' }}>
          Swap your Vehicle
        </h1>
        <p className="mt-1 text-sm text-gray-500">Pick a new vehicle from the available ones below.</p>

        {/* Invoice Card */}
        <div className="mt-8 rounded-lg border border-slate-200 bg-surface px-6 py-5">
          <div className="h-px w-full bg-border-muted mb-4" />

          {/* Current Car */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {booking.vehicle.image && (
                <div className="relative h-12 w-16 overflow-hidden rounded bg-slate-200 shrink-0">
                  <Image src={booking.vehicle.image} alt={booking.vehicle.name} fill className="object-cover" />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-primary">Current Car</p>
                <p className="text-sm font-medium text-slate-900">{booking.vehicle.name} - {booking.vehicle.licensePlate}</p>
                <p className="text-xs text-slate-500">
                  {booking.invoice.items[0]?.quantity || 1}x Base price per {booking.invoice.items[0]?.periodLabel || 'day'}
                </p>
              </div>
            </div>
            <p className="font-medium text-slate-900">${booking.invoice.total.toFixed(2)}</p>
          </div>

          {/* New Car */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-16 overflow-hidden rounded bg-slate-200 shrink-0">
                <Image src={newFleetImage} alt={newFleetName} fill className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">New Car</p>
                <p className="text-sm font-medium text-slate-900">{newFleetName}{newFleetPlate ? ` - ${newFleetPlate}` : ''}</p>
                <p className="text-xs text-slate-500">
                  {booking.invoice.items[0]?.quantity || 1}x Base price per {booking.invoice.items[0]?.periodLabel || 'day'}
                </p>
              </div>
            </div>
            <p className="font-medium text-slate-900">${newTotal.toFixed(2)}</p>
          </div>

          {/* Price Breakdown */}
          <div className="h-px w-full bg-border-muted my-4" />
          <div className="space-y-1">
            {preview?.new_breakdown && (
              <>
                <p className="text-xs text-gray-400 mb-1">New Vehicle Breakdown</p>
                <PriceRow label="Base Price" value={`$${parseFloat(preview.new_breakdown?.base_price || 0).toFixed(2)}`} />
                {parseFloat(preview.new_breakdown?.fees || 0) > 0 && (
                  <PriceRow label="Fees" value={`$${parseFloat(preview.new_breakdown.fees).toFixed(2)}`} />
                )}
                {parseFloat(preview.new_breakdown?.location_charges || 0) > 0 && (
                  <PriceRow label="Location charges" value={`$${parseFloat(preview.new_breakdown.location_charges).toFixed(2)}`} />
                )}
                {parseFloat(preview.new_breakdown?.tax || 0) > 0 && (
                  <PriceRow label="Tax" value={`$${parseFloat(preview.new_breakdown.tax).toFixed(2)}`} />
                )}
              </>
            )}
            {/* Only render the insurance row when there's an actual
                refund happening. The "non-refundable" line was reading
                like a deduction even though refund math already
                excludes it — confusing customers into thinking $X was
                being subtracted from their refund. */}
            {parseFloat(preview?.new_breakdown?.insurance || 0) > 0 && parseFloat(preview?.insurance_refund || 0) > 0 && (
              <PriceRow label="Insurance (refundable)" value={`$${parseFloat(preview.insurance_refund).toFixed(2)}`} />
            )}
            {swapFee > 0 && <PriceRow label="Swap Fee" value={`+$${swapFee.toFixed(2)}`} />}
          </div>

          {/* Refund or Charge */}
          <div className="h-px w-full bg-border-muted my-4" />
          <div className="flex items-center justify-between py-2">
            <span className="text-base font-semibold text-slate-900">
              {additionalCharge > 0 ? 'Additional Charge' : refundAmount > 0 ? 'Refund Amount' : 'No Change'}
            </span>
            <div>
              <span className="text-xs text-slate-500">USD </span>
              <span className="text-xl font-bold text-slate-900">
                ${additionalCharge > 0 ? additionalCharge.toFixed(2) : refundAmount > 0 ? refundAmount.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          <div className="h-px w-full bg-border-muted mt-4" />
        </div>

        {/* Error */}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* Pay Section */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
          <div>
            <p className="text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, lineHeight: '100%', letterSpacing: '-0.02em' }}>
              ${additionalCharge > 0 ? additionalCharge.toFixed(2) : refundAmount > 0 ? refundAmount.toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-gray-500">
              {additionalCharge > 0 ? 'New Charges' : refundAmount > 0 ? 'Refund Amount' : 'No Change'}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handlePay}
            disabled={paying || preview?.allowed === false}
            style={{ width: 248, height: 48, borderRadius: 6, padding: '15px 20px' }}
            className="text-sm font-medium"
          >
            {paying
              ? 'Processing...'
              : refundAmount > 0
                ? 'Confirm Refund'
                : additionalCharge > 0
                  ? 'Pay'
                  : 'Confirm'}
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}

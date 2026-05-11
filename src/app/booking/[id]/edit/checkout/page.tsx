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

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function PriceRow({ label, value, bold, children }: { label: string; value?: string; bold?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className={`text-sm ${bold ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{label}</span>
        {children}
      </div>
      {value && <span className={`text-sm ${bold ? 'font-bold text-slate-900' : 'text-slate-900'}`}>{value}</span>}
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

export default function EditCheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const urlToken = searchParams.get('token');
  const newPickupDate = searchParams.get('pickup_date') || '';
  const newPickupTime = searchParams.get('pickup_time') || '';
  const newDropoffDate = searchParams.get('dropoff_date') || '';
  const newDropoffTime = searchParams.get('dropoff_time') || '';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [preview, setPreview] = useState<any>(null);
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

        // Get preview
        const newPickup = `${newPickupDate}T${newPickupTime || '00:00'}:00`;
        const newDropoff = `${newDropoffDate}T${newDropoffTime || '00:00'}:00`;
        const isExtension = newDropoff > data.dropOff.rawDatetime;

        const res = await axios.get(`${API_URL}/api/bookings/public/modify/`, {
          headers: getBookingTokenHeaders(),
          params: {
            type: isExtension ? 'extend' : 'reduce',
            new_pickup_datetime: newPickup,
            new_dropoff_datetime: newDropoff,
          },
        });
        setPreview(res.data);
      } catch {
        setError('Could not load booking details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId, newPickupDate, newPickupTime, newDropoffDate, newDropoffTime]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    setError('');

    const newPickup = `${newPickupDate}T${newPickupTime || '00:00'}:00`;
    const newDropoff = `${newDropoffDate}T${newDropoffTime || '00:00'}:00`;
    const isExtension = newDropoff > booking.dropOff.rawDatetime;

    try {
      const successUrl = `${window.location.origin}/booking/${bookingId}?token=${urlToken || ''}`;
      const cancelUrl = `${window.location.origin}/booking/${bookingId}/edit?token=${urlToken || ''}`;

      const res = await axios.post(
        `${API_URL}/api/bookings/public/modify/`,
        {
          type: isExtension ? 'extend' : 'reduce',
          new_pickup_datetime: newPickup,
          new_dropoff_datetime: newDropoff,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
        { headers: getBookingTokenHeaders() }
      );

      if (res.data.status === 'checkout_required' && res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        router.push(`/booking/${bookingId}?token=${urlToken || ''}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to modify trip.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header showBorderBottom />
        <main className="mx-auto w-full pt-14 pb-20 flex-1 flex items-center justify-center" style={{ maxWidth: 460 }}>
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
        <main className="mx-auto w-full pt-14 pb-20 flex-1" style={{ maxWidth: 460, paddingLeft: 16, paddingRight: 16 }}>
          <p className="text-red-500">{error || 'Something went wrong.'}</p>
        </main>
        <Footer />
      </>
    );
  }

  const priceDiff = parseFloat(preview.price_difference || '0');
  const modificationFee = parseFloat(preview.modification_fee || '0');
  const newTotal = parseFloat(preview.new_total || booking.invoice.total);
  const deposit = booking.invoice.deposit || 0;
  const balance = Math.max(0, newTotal - deposit);

  return (
    <>
      <Header showBorderBottom />
      <main className="mx-auto w-full pt-14 pb-20" style={{ maxWidth: 580, paddingLeft: 16, paddingRight: 16 }}>
        <Link
          href={`/booking/${bookingId}/edit?token=${urlToken || ''}`}
          className="inline-flex items-center text-primary underline hover:text-primary-hover"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 12, lineHeight: '100%' }}
        >
          Go Back
        </Link>

        <h1 className="mt-2 text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: '100%' }}>
          Modify your trip
        </h1>
        <p className="mt-1 text-sm text-gray-500">Access your booking using your booking ID.</p>

        {/* Invoice Card */}
        <div className="mt-8 rounded-lg border border-slate-200 bg-surface px-6 py-5">
          {/* Divider top */}
          <div className="h-px w-full bg-border-muted mb-4" />

          {/* Vehicle item */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {booking.vehicle.image && (
                <div className="relative h-12 w-16 overflow-hidden rounded bg-slate-200 shrink-0">
                  <Image src={booking.vehicle.image} alt={booking.vehicle.name} fill className="object-cover" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-900">{booking.vehicle.name} - {booking.vehicle.licensePlate}</p>
                <p className="text-xs text-slate-500">
                  {preview?.new_days || booking.invoice.items[0]?.quantity || 1}x Base price per {booking.invoice.items[0]?.unit || 'day'}
                </p>
              </div>
            </div>
            <p className="font-medium text-slate-900">${newTotal.toFixed(2)}</p>
          </div>

          {/* Invoice Breakdown */}
          <div className="h-px w-full bg-border-muted my-4" />
          {priceDiff >= 0 ? (
            <div className="space-y-1">
              {preview?.new_breakdown ? (
                !parseFloat(preview.new_breakdown.fees || 0) ? (
                  /* Pure extension — show extension charges */
                  <>
                    <p className="text-xs text-gray-400 mb-1">Extension Charges</p>
                    <PriceRow label={`Additional rental${parseFloat(preview.price_per_day || 0) > 0 ? ` (${Math.round(parseFloat(preview.new_breakdown.base_price || 0) / parseFloat(preview.price_per_day))} days)` : ''}`} value={`$${parseFloat(preview.new_breakdown.base_price || 0).toFixed(2)}`} />
                    {parseFloat(preview.new_breakdown.tax || 0) > 0 && (
                      <PriceRow label="Tax" value={`$${parseFloat(preview.new_breakdown.tax).toFixed(2)}`} />
                    )}
                    {parseFloat(preview.extension_insurance || preview.new_breakdown.insurance || 0) > 0 && (
                      <PriceRow label="Insurance (additional days)" value={`$${parseFloat(preview.extension_insurance || preview.new_breakdown.insurance).toFixed(2)}`} />
                    )}
                    <div className="h-px w-full bg-border-muted my-3" />
                    <PriceRow label="Previous Total" value={`$${parseFloat(preview?.original_total || 0).toFixed(2)}`} />
                    <BigPrice label="New Total" amount={newTotal} />
                  </>
                ) : (
                  /* Date shift — show full new invoice */
                  <>
                    {(() => {
                      const base = parseFloat(preview.new_breakdown.base_price || 0);
                      const discounted = parseFloat(preview.new_breakdown.discounted_price || preview.new_breakdown.base_price || 0);
                      const fleetDiscount = base - discounted;
                      return (
                        <>
                          <PriceRow label="Rental total" value={`$${base.toFixed(2)}`} />
                          {fleetDiscount > 0 && (
                            <PriceRow label="Fleet discount" value={`-$${fleetDiscount.toFixed(2)}`} />
                          )}
                        </>
                      );
                    })()}
                    {parseFloat(preview.new_breakdown.location_charges || 0) > 0 && (
                      <PriceRow label="Location charges" value={`$${parseFloat(preview.new_breakdown.location_charges).toFixed(2)}`} />
                    )}
                    {parseFloat(preview.new_breakdown.fees || 0) > 0 && (
                      <PriceRow label="Booking fees" value={`$${parseFloat(preview.new_breakdown.fees).toFixed(2)}`} />
                    )}
                    {parseFloat(preview.new_breakdown.insurance || 0) > 0 && (
                      <>
                        <PriceRow label="Insurance" value={`$${parseFloat(preview.new_breakdown.insurance).toFixed(2)}`} />
                        {parseFloat(preview.extension_insurance || 0) > 0 && (
                          <p className="text-[10px] text-slate-400 italic pl-1 -mt-1 leading-snug">
                            Premium is recalculated by your insurance provider for the new dates; you pay the difference between the original and the new premium.
                          </p>
                        )}
                      </>
                    )}
                    {parseFloat(preview.new_breakdown.tax || 0) > 0 && (
                      <PriceRow label="Tax" value={`$${parseFloat(preview.new_breakdown.tax).toFixed(2)}`} />
                    )}
                    <div className="h-px w-full bg-border-muted my-3" />
                    <BigPrice label="New Total" amount={newTotal} />
                    <PriceRow label="Previous Total" value={`$${parseFloat(preview?.original_total || 0).toFixed(2)}`} />
                  </>
                )
              ) : (
                <>
                  <PriceRow label="Subtotal" value={`$${(newTotal + booking.invoice.discount).toFixed(2)}`} />
                  {booking.invoice.discount > 0 && (
                    <PriceRow label="Discount" value={`-$${booking.invoice.discount.toFixed(2)}`} />
                  )}
                  <PriceRow label="Tax" value={`$${booking.invoice.tax.toFixed(2)}`} />
                </>
              )}
            </div>
          ) : (
            /* Refund — show full new invoice (so the customer can see
               where the savings came from, e.g. a fleet discount that
               kicked in after extending into a multi-day tier) plus
               the savings & fee summary. */
            <div className="space-y-1">
              {preview?.new_breakdown ? (
                <>
                  {(() => {
                    const base = parseFloat(preview.new_breakdown.base_price || 0);
                    const discounted = parseFloat(preview.new_breakdown.discounted_price || preview.new_breakdown.base_price || 0);
                    const fleetDiscount = base - discounted;
                    return (
                      <>
                        <PriceRow label="Rental total" value={`$${base.toFixed(2)}`} />
                        {fleetDiscount > 0 && (
                          <PriceRow label="Fleet discount" value={`-$${fleetDiscount.toFixed(2)}`} />
                        )}
                      </>
                    );
                  })()}
                  {parseFloat(preview.new_breakdown.location_charges || 0) > 0 && (
                    <PriceRow label="Location charges" value={`$${parseFloat(preview.new_breakdown.location_charges).toFixed(2)}`} />
                  )}
                  {parseFloat(preview.new_breakdown.fees || 0) > 0 && (
                    <PriceRow label="Booking fees" value={`$${parseFloat(preview.new_breakdown.fees).toFixed(2)}`} />
                  )}
                  {parseFloat(preview.new_breakdown.insurance || 0) > 0 && (
                    <PriceRow label="Insurance" value={`$${parseFloat(preview.new_breakdown.insurance).toFixed(2)}`} />
                  )}
                  {parseFloat(preview.new_breakdown.tax || 0) > 0 && (
                    <PriceRow label="Tax" value={`$${parseFloat(preview.new_breakdown.tax).toFixed(2)}`} />
                  )}
                  <div className="h-px w-full bg-border-muted my-3" />
                  <BigPrice label="New Total" amount={newTotal} />
                  <PriceRow label="Previous Total" value={`$${parseFloat(preview?.original_total || 0).toFixed(2)}`} />
                </>
              ) : (
                <>
                  <PriceRow label="Previous Total" value={`$${parseFloat(preview?.original_total || 0).toFixed(2)}`} />
                  <PriceRow label={`New Total (${preview?.new_days || '—'} days)`} value={`$${newTotal.toFixed(2)}`} />
                </>
              )}
              <div className="h-px w-full bg-border-muted my-3" />
              {(() => {
                const totalRefund = Math.abs(priceDiff);
                const insExcluded = parseFloat(preview?.insurance_excluded || 0);
                const insRefund = parseFloat(preview?.insurance_refund || 0);
                const fee = modificationFee;
                const rentalSavings = totalRefund - insRefund + fee;
                return (
                  <>
                    <PriceRow label="Rental savings" value={`$${rentalSavings.toFixed(2)}`} />
                    {insRefund > 0 && (
                      <>
                        <PriceRow label="Insurance (refundable)" value={`+$${insRefund.toFixed(2)}`} />
                        <p className="text-[10px] text-slate-400 italic pl-1 -mt-1 leading-snug">
                          Premium is recalculated by your insurance provider for the new shorter dates; you&apos;re refunded the difference between the original and the new premium.
                        </p>
                      </>
                    )}
                    {insExcluded > 0 && (
                      <PriceRow label="Insurance (non-refundable)" value={`-$${insExcluded.toFixed(2)}`} />
                    )}
                    {fee > 0 && (
                      <PriceRow label="Modification fee" value={`-$${fee.toFixed(2)}`} />
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Error */}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}



        {/* Pay Section */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {priceDiff > 0 ? 'Additional Amount Due' : priceDiff < 0 ? 'Refund Amount' : 'No Change'}
            </p>
            <p className="text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, lineHeight: '100%', letterSpacing: '-0.02em' }}>
              ${Math.abs(priceDiff).toFixed(2)}
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
              : priceDiff < 0
                ? 'Confirm Refund'
                : priceDiff > 0
                  ? 'Pay'
                  : 'Confirm'}
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}

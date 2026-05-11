'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { TimePicker, Button } from '@/components/ui';
import { DualMonthCalendar } from '@/components/ui/dual-month-calendar';
import { getBookingById, type BookingDetails } from '@/services/bookingServices';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useFleet, useFleetUnavailableRanges } from '@/hooks';
import { todayLocalISODate } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function EditTripPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const urlToken = searchParams.get('token');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Date/time state
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');

  // Preview state
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Debounce date/time changes before refetching the fleet — picker
  // clicks fire several state updates in a row and we don't want to
  // flood the network or flash the UI on every micro-change.
  const [debouncedPickup, setDebouncedPickup] = useState({ date: '', time: '' });
  const [debouncedDropoff, setDebouncedDropoff] = useState({ date: '', time: '' });
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedPickup({ date: pickupDate, time: pickupTime });
      setDebouncedDropoff({ date: dropoffDate, time: dropoffTime });
    }, 350);
    return () => clearTimeout(t);
  }, [pickupDate, pickupTime, dropoffDate, dropoffTime]);

  const fleetDateArgs = useMemo(() => {
    if (!debouncedPickup.date || !debouncedDropoff.date) return undefined;
    return {
      pickupDatetime: `${debouncedPickup.date}T${debouncedPickup.time || '00:00'}:00`,
      dropoffDatetime: `${debouncedDropoff.date}T${debouncedDropoff.time || '00:00'}:00`,
    };
  }, [debouncedPickup, debouncedDropoff]);

  // Re-fetch the fleet keyed on the debounced date range so dynamic-
  // pricing entries that overlap the new window are picked up and
  // isPeakPricing / isPromoPricing reflect the current selection.
  const fleetIdNum = booking?.fleetId;
  const { data: fleetData } = useFleet(fleetIdNum, !!fleetIdNum, fleetDateArgs);

  // Pull every blocked/booked range for the fleet so the picker can
  // grey out unavailable days. exclude_booking_id keeps the booking
  // we're editing from blocking its own current window.
  const { data: unavailableRanges = [] } = useFleetUnavailableRanges(
    fleetIdNum,
    booking ? { excludeBookingId: booking.id } : undefined,
  );
  const unavailableDates = useMemo(() => {
    const out = new Set<string>();
    for (const r of unavailableRanges) {
      const start = new Date(r.start);
      const end = new Date(r.end);
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const stop = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      while (d <= stop) {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        out.add(`${yyyy}-${mm}-${dd}`);
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }
    return Array.from(out);
  }, [unavailableRanges]);

  // Store token
  useEffect(() => {
    if (urlToken) setBookingToken(urlToken);
  }, [urlToken]);

  // Fetch booking
  useEffect(() => {
    async function load() {
      try {
        const data = await getBookingById(bookingId);
        setBooking(data);
        // Parse existing dates directly from ISO string (no browser TZ conversion)
        if (data.pickUp.rawDatetime) {
          setPickupDate(data.pickUp.rawDatetime.split('T')[0] || '');
          setPickupTime(data.pickUp.rawDatetime.split('T')[1]?.replace('Z', '').split(/[+-]/)[0]?.slice(0, 5) || '');
        }
        if (data.dropOff.rawDatetime) {
          setDropoffDate(data.dropOff.rawDatetime.split('T')[0] || '');
          setDropoffTime(data.dropOff.rawDatetime.split('T')[1]?.replace('Z', '').split(/[+-]/)[0]?.slice(0, 5) || '');
        }
      } catch {
        setError('Booking not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  // Preview price when dates change
  useEffect(() => {
    if (!pickupDate || !pickupTime || !dropoffDate || !dropoffTime || !booking) return;

    const newPickup = `${pickupDate}T${pickupTime}:00`;
    const newDropoff = `${dropoffDate}T${dropoffTime}:00`;

    // Don't preview if dates haven't changed
    const origPickup = (booking.pickUp.rawDatetime || '').replace('Z', '').split('+')[0] || '';
    const origDropoff = (booking.dropOff.rawDatetime || '').replace('Z', '').split('+')[0] || '';
    if (newPickup === origPickup && newDropoff === origDropoff) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/bookings/public/modify/`, {
          headers: getBookingTokenHeaders(),
          params: {
            type: newDropoff > origDropoff ? 'extend' : 'reduce',
            new_pickup_datetime: newPickup,
            new_dropoff_datetime: newDropoff,
          },
        });
        setPreview(res.data);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pickupDate, pickupTime, dropoffDate, dropoffTime, booking]);

  const handleSave = () => {
    if (!pickupDate || !dropoffDate) {
      setError('Please select both pickup and return dates.');
      return;
    }
    const token = urlToken || '';
    const params = new URLSearchParams({
      token,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      dropoff_date: dropoffDate,
      dropoff_time: dropoffTime,
    });
    window.location.href = `/booking/${bookingId}/edit/checkout?${params.toString()}`;
  };

  if (loading) {
    return (
      <>
        <Header showBorderBottom />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-gray-500">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error && !booking) {
    return (
      <>
        <Header showBorderBottom />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold text-navy">Booking not found</h1>
          <p className="mt-2 text-gray-500">The booking you are looking for does not exist.</p>
        </main>
        <Footer />
      </>
    );
  }

  const priceDiff = preview?.price_difference ? parseFloat(preview.price_difference) : 0;
  const modificationFee = preview?.modification_fee ? parseFloat(preview.modification_fee) : 0;
  const newTotal = preview?.new_total ? parseFloat(preview.new_total) : null;

  return (
    <>
      <Header />
      <main className="mx-auto w-full pt-14 pb-20 overflow-visible" style={{ maxWidth: 460, paddingLeft: 16, paddingRight: 16 }}>
        <Link
          href={`/booking/${bookingId}?token=${urlToken || ''}`}
          className="inline-flex items-center text-primary underline hover:text-primary-hover"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 12, lineHeight: '100%' }}
        >
          Go Back
        </Link>

        <h1 className="mt-2 text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: '100%' }}>
          Modify your trip
        </h1>
        <p className="mt-1 text-sm text-gray-500">Access your booking using your booking ID.</p>

        {/* Booking Info Card */}
        {booking && (
          <div className="mt-8 flex gap-4 border-b border-gray-200 pb-6">
            {booking.vehicle.image && (
              <div className="h-16 w-22 overflow-hidden rounded-md bg-gray-100 shrink-0">
                <Image src={booking.vehicle.image} alt={booking.vehicle.name} width={88} height={64} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">Booking ID <span className="font-medium text-navy">#{booking.invoice.number}</span></p>
                  <p className="mt-1 font-manrope text-lg font-bold text-navy">{booking.vehicle.name}</p>
                  <p className="text-xs text-gray-500">{booking.vehicle.licensePlate}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">Booked On</p>
                  <p className="mt-1 font-manrope text-sm font-semibold text-navy">{booking.bookedOn}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Pickers */}
        <div className="mt-8 space-y-4">
          {/* Pick-up */}
          <div
            className="w-full rounded-2xl bg-gray-50 px-5 py-4 text-left cursor-pointer"
            onClick={() => setCalendarOpen(!calendarOpen)}
          >
            <p className="mb-3 text-2xs font-normal text-neutral-label">Pick-up Date & Time</p>
            <div className="flex items-center">
              <div className="flex flex-1 items-center gap-2">
                <Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={20} height={20} className="shrink-0" />
                <span className={`text-sm ${pickupDate ? 'text-slate-700' : 'text-neutral-placeholder'}`}>
                  {pickupDate ? new Date(pickupDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="h-5 w-px shrink-0 bg-slate-300" />
                <div onClick={(e) => e.stopPropagation()}>
                  <TimePicker
                    value={pickupTime}
                    onChange={setPickupTime}
                    icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={18} height={18} className="shrink-0" />}
                    placeholder="Select Time"
                    aria-label="Pickup time"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Range Calendar */}
          <DualMonthCalendar
            isOpen={calendarOpen}
            startDate={pickupDate}
            endDate={dropoffDate}
            onSelectStart={(v) => { setPickupDate(v); setDropoffDate(''); }}
            onSelectEnd={(v) => { setDropoffDate(v); setCalendarOpen(false); }}
            minDate={todayLocalISODate()}
            unavailableDates={unavailableDates}
          />

          {/* Return */}
          <div
            className="w-full rounded-2xl bg-gray-50 px-5 py-4 text-left cursor-pointer"
            onClick={() => setCalendarOpen(!calendarOpen)}
          >
            <p className="mb-3 text-2xs font-normal text-neutral-label">Return Date & Time</p>
            <div className="flex items-center">
              <div className="flex flex-1 items-center gap-2">
                <Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={20} height={20} className="shrink-0" />
                <span className={`text-sm ${dropoffDate ? 'text-slate-700' : 'text-neutral-placeholder'}`}>
                  {dropoffDate ? new Date(dropoffDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="h-5 w-px shrink-0 bg-slate-300" />
                <div onClick={(e) => e.stopPropagation()}>
                  <TimePicker
                    value={dropoffTime}
                    onChange={setDropoffTime}
                    icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={18} height={18} className="shrink-0" />}
                    placeholder="Select Time"
                    aria-label="Return time"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peak / promo pricing notice — fires when the fleet's
            dynamic-pricing average for the selected window differs
            from the base per-day rate. */}
        {fleetData?.isPeakPricing && (
          <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
            Peak-day pricing is in effect for the selected dates.
          </p>
        )}
        {fleetData?.isPromoPricing && (
          <p className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1.5">
            Promo pricing is in effect for the selected dates.
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        )}

        {/* Preview & Save */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            {previewLoading ? (
              <p className="text-sm text-gray-400">Calculating...</p>
            ) : preview?.allowed === false ? (
              <p className="text-sm text-red-500">{preview.reason}</p>
            ) : newTotal !== null ? (
              <>
                <p className="text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, lineHeight: '100%', letterSpacing: '-0.02em' }}>
                  ${Math.abs(priceDiff).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {priceDiff > 0 ? 'New Charges' : priceDiff < 0 ? 'Refund Amount' : 'No Change'}
                  {modificationFee > 0 ? ` (after $${modificationFee.toFixed(0)} modification fee)` : ''}
                </p>
              </>
            ) : (
              <>
                <p className="text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, lineHeight: '100%', letterSpacing: '-0.02em' }}>$0.00</p>
                <p className="text-xs text-gray-500">New Charges</p>
              </>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || previewLoading || preview?.allowed === false}
            style={{ width: 248, height: 48, borderRadius: 6, padding: '15px 20px' }}
            className="text-sm font-medium"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}

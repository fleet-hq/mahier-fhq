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

const CANCELLATION_REASONS = [
  'Change of plans',
  'Found a better deal',
  'Vehicle no longer needed',
  'Schedule conflict',
  'Financial reasons',
  'Other',
];

export default function CancelTripPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const urlToken = searchParams.get('token');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [reasonDropdownOpen, setReasonDropdownOpen] = useState(false);

  useEffect(() => {
    if (urlToken) setBookingToken(urlToken);
  }, [urlToken]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBookingById(bookingId);
        setBooking(data);

        const res = await axios.get(`${API_URL}/api/bookings/public/modify/`, {
          headers: getBookingTokenHeaders(),
          params: { type: 'cancel' },
        });
        setPreview(res.data);
      } catch {
        setError('Could not load booking details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  const handleCancel = async () => {
    if (!reason) {
      setError('Please select a reason for cancellation.');
      return;
    }
    setCancelling(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/api/bookings/public/modify/`,
        {
          type: 'cancel',
          cancellation_reason: `${reason}${notes ? ': ' + notes : ''}`,
        },
        { headers: getBookingTokenHeaders() }
      );
      router.push(`/booking/${bookingId}?token=${urlToken || ''}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.reason || 'Failed to cancel trip.');
    } finally {
      setCancelling(false);
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

  if (!booking) {
    return (
      <>
        <Header showBorderBottom />
        <main className="mx-auto w-full pt-14 pb-20 flex-1" style={{ maxWidth: 460, paddingLeft: 16, paddingRight: 16 }}>
          <p className="text-red-500">{error || 'Booking not found.'}</p>
        </main>
        <Footer />
      </>
    );
  }

  const refundAmount = preview?.refund_amount ? parseFloat(preview.refund_amount) : 0;
  const cancellationFee = preview?.modification_fee ? parseFloat(preview.modification_fee) : 0;
  const insuranceExcluded = preview?.insurance_excluded ? parseFloat(preview.insurance_excluded) : 0;

  return (
    <>
      <Header showBorderBottom />
      <main className="mx-auto w-full pt-14 pb-20" style={{ maxWidth: 460, paddingLeft: 16, paddingRight: 16 }}>
        <Link
          href={`/booking/${bookingId}?token=${urlToken || ''}`}
          className="inline-flex items-center text-primary underline hover:text-primary-hover"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 12, lineHeight: '100%' }}
        >
          Go Back
        </Link>

        <h1 className="mt-2 text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: '100%' }}>
          Cancel  your trip
        </h1>
        <p className="mt-1.5 text-sm text-gray-600">Are you sure you want to cancel your trip?</p>

        {/* Divider */}
        <div className="h-px w-full bg-gray-200 mt-4" />

        {/* Booking Info */}
        <div className="mt-4 flex gap-4 pb-4 border-b border-gray-200">
          {booking.vehicle.image && (
            <div className="h-16 w-22 overflow-hidden rounded-md bg-gray-100 shrink-0">
              <Image src={booking.vehicle.image} alt={booking.vehicle.name} width={88} height={64} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Booking ID <span className="font-medium text-navy">#{booking.invoice.number}</span></p>
              <p className="text-xs text-gray-500">Booked On</p>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="font-manrope text-lg font-bold text-navy">{booking.vehicle.name}</p>
              <p className="font-manrope text-sm font-semibold text-navy">{booking.bookedOn}</p>
            </div>
            <p className="text-xs text-gray-500">{booking.vehicle.licensePlate}</p>
          </div>
        </div>

        {/* Reason for Cancellation */}
        <div className="mt-6">
          <p className="text-gray-700 mb-2" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400, fontSize: 10, lineHeight: '100%' }}>Reason for Cancellation?*</p>
          <div className="relative">
            <button
              type="button"
              className="w-full flex items-center justify-between border-b border-gray-200 pb-2 cursor-pointer"
              onClick={() => setReasonDropdownOpen(!reasonDropdownOpen)}
            >
              <span className={reason ? 'text-slate-900' : 'text-gray-400'} style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '100%' }}>
                {reason || 'Select your reason to cancel'}
              </span>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 transition-all duration-200 ease-out origin-top ${reasonDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
              {CANCELLATION_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-gray-50 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => { setReason(r); setReasonDropdownOpen(false); }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="mt-6">
          <p className="text-gray-700 mb-2" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400, fontSize: 10, lineHeight: '100%' }}>Additional Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add more details"
            rows={3}
            className="w-full text-slate-900 placeholder:text-gray-400 outline-none resize-none"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '140%' }}
          />
        </div>

        {/* Pricing breakdown between dividers */}
        <div className="h-px w-full bg-gray-200 mt-8" />
        <div className="space-y-2 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Booking Total</span>
            <span className="text-sm font-medium text-slate-900">${booking.invoice.total.toFixed(2)}</span>
          </div>
          {preview?.original_breakdown && (
            <>
              <p className="text-xs text-gray-400 mt-1">Breakdown</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Base Price</span>
                <span className="text-sm text-slate-700">${parseFloat(preview.original_breakdown.base_price || 0).toFixed(2)}</span>
              </div>
              {parseFloat(preview.original_breakdown.fees || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Fees</span>
                  <span className="text-sm text-slate-700">${parseFloat(preview.original_breakdown.fees).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(preview.original_breakdown.location_charges || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Location charges</span>
                  <span className="text-sm text-slate-700">${parseFloat(preview.original_breakdown.location_charges).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(preview.original_breakdown.tax || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Tax</span>
                  <span className="text-sm text-slate-700">${parseFloat(preview.original_breakdown.tax).toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          {insuranceExcluded > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Insurance (non-refundable)</span>
              <span className="text-sm font-medium text-red-500">-${insuranceExcluded.toFixed(2)}</span>
            </div>
          ) : booking.invoice.insurancePremium > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Insurance (refundable)</span>
              <span className="text-sm font-medium text-slate-900">+${booking.invoice.insurancePremium.toFixed(2)}</span>
            </div>
          ) : null}
          {cancellationFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Cancellation Fee</span>
              <span className="text-sm font-medium text-red-500">-${cancellationFee.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="h-px w-full bg-gray-200 mb-6" />

        {/* Error */}
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {/* Refund & Next */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, lineHeight: '100%', letterSpacing: '-0.02em' }}>
              ${refundAmount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Refund Amount</p>
          </div>
          <Button
            variant="primary"
            onClick={handleCancel}
            disabled={cancelling}
            style={{ width: 248, height: 48, borderRadius: 6, padding: '15px 20px' }}
            className="text-sm font-medium"
          >
            {cancelling ? 'Cancelling...' : 'Next'}
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}

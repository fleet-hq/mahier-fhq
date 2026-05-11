'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { Button } from '@/components/ui';
import { getBookingById, type BookingDetails } from '@/services/bookingServices';
import { listFleets, checkBulkAvailability } from '@/services/fleetServices';
import { setBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { VehicleCard, Pagination } from '@/components/sections/fleet';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const PAGE_SIZE = 9;

export default function SwapVehiclePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;
  const urlToken = searchParams.get('token');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [availability, setAvailability] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    if (urlToken) setBookingToken(urlToken);
  }, [urlToken]);

  // Fetch booking
  useEffect(() => {
    async function loadBooking() {
      try {
        const data = await getBookingById(bookingId);
        setBooking(data);
      } catch {
        setError('Booking not found.');
      }
    }
    loadBooking();
  }, [bookingId]);

  // Fetch fleets that are actually available for the booking's
  // dates. We pass pickup/dropoff to the listing endpoint so the
  // backend's FleetFilter drops fleets with overlapping bookings
  // OR admin-set unavailability blocks server-side — without this
  // the customer saw fleets they couldn't actually swap into.
  // exclude_booking ignores this booking's own conflict (so the
  // customer's currently-booked dates don't suppress every fleet).
  useEffect(() => {
    async function loadFleets() {
      setLoading(true);
      setError('');
      try {
        const res = await listFleets({
          page,
          page_size: PAGE_SIZE,
          pickup_datetime: booking?.pickUp.rawDatetime,
          dropoff_datetime: booking?.dropOff.rawDatetime,
          exclude_booking: booking?.id,
        } as any);
        const filtered = booking
          ? res.results.filter((v: any) => String(v.id) !== String(booking.fleetId))
          : res.results;
        setVehicles(filtered);
        setTotalCount(res.count - (res.results.length - filtered.length));

        // checkBulkAvailability is now redundant for the listed set
        // (server already filtered) but we keep it so any UI surface
        // that reads `availability[id]` continues to work.
        if (booking && filtered.length > 0) {
          const fleetIds = filtered.map((v: any) => String(v.id));
          const avail = await checkBulkAvailability(
            fleetIds,
            booking.pickUp.rawDatetime,
            booking.dropOff.rawDatetime,
          );
          setAvailability(avail);
        }
      } catch {
        setError('Could not load vehicles.');
      } finally {
        setLoading(false);
      }
    }
    loadFleets();
  }, [page, booking]);

  // Preview price when vehicle selected
  useEffect(() => {
    if (!selectedVehicleId || !booking) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/bookings/public/modify/`, {
          headers: getBookingTokenHeaders(),
          params: { type: 'swap', new_fleet_id: selectedVehicleId },
        });
        setPreview(res.data);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedVehicleId, booking]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSave = () => {
    if (!selectedVehicleId || !booking) return;
    const token = urlToken || '';
    window.location.href = `/booking/${bookingId}/swap/checkout?token=${token}&new_fleet_id=${selectedVehicleId}`;
  };

  const priceDiff = preview?.price_difference ? parseFloat(preview.price_difference) : 0;
  const swapFee = preview?.modification_fee ? parseFloat(preview.modification_fee) : 0;
  const refundAmount = preview?.refund_amount ? parseFloat(preview.refund_amount) : 0;
  const additionalCharge = preview?.additional_charge ? parseFloat(preview.additional_charge) : 0;

  return (
    <>
      <Header showBorderBottom />
      <main className="mx-auto w-full px-4 sm:px-8 pt-14 pb-20" style={{ maxWidth: 900 }}>
        <Link
          href={`/booking/${bookingId}?token=${urlToken || ''}`}
          className="inline-flex items-center text-primary underline hover:text-primary-hover"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 12, lineHeight: '100%' }}
        >
          Go Back
        </Link>

        <h1 className="mt-2 text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: '100%' }}>
          Swap your Vehicle
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">Pick a new vehicle from the available ones below.</p>

        {/* Booking Info */}
        {booking && (
          <div className="mt-6 flex gap-4">
            {booking.vehicle.image && (
              <div className="h-20 w-28 overflow-hidden rounded-md bg-gray-100 shrink-0">
                <Image src={booking.vehicle.image} alt={booking.vehicle.name} width={112} height={80} className="h-full w-full object-cover" />
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
        )}

        {/* Date filters (read-only) */}
        {booking && (
          <>
          <div className="h-px w-full bg-gray-200 mt-4" />
          <div className="mt-2 flex gap-4">
            <div className="flex-1 rounded-2xl bg-gray-50 px-5 py-4">
              <p className="mb-3 text-2xs font-normal text-neutral-label">Pick-up Date & Time</p>
              <div className="flex items-center">
                <div className="flex flex-1 items-center gap-2">
                  <Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={20} height={20} className="shrink-0" />
                  <span className="text-sm text-slate-700">{booking.pickUp.date}</span>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-5 w-px shrink-0 bg-slate-300" />
                  <Image src="/icons/home/hero/clock.svg" alt="Clock" width={18} height={18} className="shrink-0" />
                  <span className="text-sm text-slate-700">{booking.pickUp.time}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 rounded-2xl bg-gray-50 px-5 py-4">
              <p className="mb-3 text-2xs font-normal text-neutral-label">Return Date & Time</p>
              <div className="flex items-center">
                <div className="flex flex-1 items-center gap-2">
                  <Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={20} height={20} className="shrink-0" />
                  <span className="text-sm text-slate-700">{booking.dropOff.date}</span>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-5 w-px shrink-0 bg-slate-300" />
                  <Image src="/icons/home/hero/clock.svg" alt="Clock" width={18} height={18} className="shrink-0" />
                  <span className="text-sm text-slate-700">{booking.dropOff.time}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-gray-200 mt-2" />
          </>
        )}

        {/* Vehicle Grid */}
        <div className="mt-8">
          {loading ? (
            <p className="text-center text-gray-500 py-12">Loading vehicles...</p>
          ) : vehicles.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No other vehicles available for swap right now.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Please check back later or contact support if you need a specific change.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`cursor-pointer rounded-xl transition-all ${
                    selectedVehicleId === String(vehicle.id)
                      ? 'ring-2 ring-primary shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                  onClickCapture={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (availability[String(vehicle.id)] === false) return;
                    setSelectedVehicleId(String(vehicle.id));
                  }}
                >
                  <VehicleCard
                    id={vehicle.id}
                    name={vehicle.name}
                    image={vehicle.image}
                    location={vehicle.location}
                    seats={vehicle.seats}
                    transmission={vehicle.transmission}
                    pricePerDay={vehicle.pricePerDay}
                    pricePerHour={vehicle.pricePerHour}
                    maxDiscount={vehicle.maxDiscount}
                    bookingQuery=""
                    unavailable={availability[String(vehicle.id)] === false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalResults={totalCount}
              resultsPerPage={PAGE_SIZE}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        )}

        {/* Divider */}
        <div className="h-px w-full bg-gray-200 mt-8" />

        {/* Error */}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* Total + Save */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {previewLoading ? (
              <p className="text-sm text-gray-400">Calculating...</p>
            ) : preview && !preview.allowed ? (
              <p className="text-sm text-red-500">{preview.reason}</p>
            ) : selectedVehicleId && preview ? (
              <>
                <p className="text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, lineHeight: '100%', letterSpacing: '-0.02em' }}>
                  ${additionalCharge > 0 ? additionalCharge.toFixed(2) : refundAmount > 0 ? refundAmount.toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {additionalCharge > 0 ? 'Additional Charge' : refundAmount > 0 ? 'Refund Amount' : 'No Change'}
                  {swapFee > 0 ? ` (including $${swapFee.toFixed(0)} swap fee)` : ''}
                </p>
              </>
            ) : (
              <>
                <p className="text-navy" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, lineHeight: '100%', letterSpacing: '-0.02em' }}>$0.00</p>
                <p className="text-xs text-gray-500 mt-1">Select a vehicle</p>
              </>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!selectedVehicleId || previewLoading || (preview && !preview.allowed)}
            style={{ width: 248, height: 48, borderRadius: 6, padding: '15px 20px' }}
            className="text-sm font-medium"
          >
            Swap Vehicle
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
import { StatusBadge } from '@/components/ui';
import { setBookingToken } from '@/utils/booking-token';
import { formatShortDate, formatTime } from '@/utils/format-date';
import type { BookingLookupResponse, LookupBookingItem } from '@/services/bookingServices';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.png';

const EDIT_ICON = (
  <svg width="17" height="16" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.49998 4.26471H2.49999C1.96956 4.26471 1.46085 4.46302 1.08578 4.81603C0.710712 5.16904 0.5 5.64783 0.5 6.14706V14.6176C0.5 15.1169 0.710712 15.5957 1.08578 15.9487C1.46085 16.3017 1.96956 16.5 2.49999 16.5H11.4999C12.0304 16.5 12.5391 16.3017 12.9141 15.9487C13.2892 15.5957 13.4999 15.1169 13.4999 14.6176V13.6765M12.4999 2.38235L15.4999 5.20588M16.8849 3.87422C17.2787 3.50354 17.5 3.00079 17.5 2.47657C17.5 1.95235 17.2787 1.4496 16.8849 1.07892C16.4911 0.708245 15.9569 0.5 15.3999 0.5C14.8429 0.5 14.3088 0.708245 13.9149 1.07892L5.49997 8.97069V11.7942H8.49995L16.8849 3.87422Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TABLE_HEADERS = [
  { label: 'Booking ID', className: 'pl-4 sm:pl-6 lg:pl-10 pr-2 py-2 whitespace-nowrap' },
  { label: 'Vehicle', className: 'px-5 py-2 whitespace-nowrap' },
  { label: 'Pick Up Details', className: 'px-5 py-2 whitespace-nowrap' },
  { label: 'Drop Off Details', className: 'px-5 py-2 whitespace-nowrap' },
  { label: 'Booking Status', className: 'px-5 py-2 whitespace-nowrap' },
  { label: 'Payment Status', className: 'px-5 py-2 whitespace-nowrap' },
  { label: 'Action', className: 'pl-5 pr-4 sm:pr-6 lg:pr-10 py-2 text-center whitespace-nowrap' },
];

function BookingRow({ booking, isHighlighted, onClick }: {
  booking: LookupBookingItem;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  return (
    <tr
      className={`h-[95px] hover:bg-gray-50 transition-colors duration-150 border-b border-[#E9E9E9] cursor-pointer ${
        isHighlighted ? 'bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <td className="pl-4 sm:pl-6 lg:pl-10 pr-5 text-[12px] text-[#131313] font-medium">
        #{booking.booking_reference.replace('BKG-', '')}
      </td>

      <td className="px-5">
        <div className="flex items-center gap-3">
          <div className="relative w-[54px] h-[38px] shrink-0 overflow-hidden rounded bg-gray-100">
            <Image
              src={booking.vehicle.image || PLACEHOLDER_IMAGE}
              alt={booking.vehicle.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="leading-tight">
            <p className="text-[12px] text-[#131313] font-medium">{booking.vehicle.name}</p>
            <p className="text-[10px] text-[#B1B1B1] font-normal">{booking.vehicle.plate_number}</p>
          </div>
        </div>
      </td>

      <td className="px-5">
        <p className="text-[12px] text-[#131313] font-medium">
          {formatShortDate(booking.pickup_datetime)} - {formatTime(booking.pickup_datetime)}
        </p>
        <p className="text-[10px] text-[#B1B1B1] font-normal">{booking.pickup_location}</p>
      </td>

      <td className="px-5">
        <p className="text-[12px] text-[#131313] font-medium">
          {formatShortDate(booking.dropoff_datetime)} - {formatTime(booking.dropoff_datetime)}
        </p>
        <p className="text-[10px] text-[#B1B1B1] font-normal">{booking.dropoff_location}</p>
      </td>

      <td className="px-5 py-5 text-center">
        <StatusBadge status={booking.status} />
      </td>

      <td className="px-5 py-5 text-center">
        <StatusBadge status={booking.payment_status} />
      </td>

      <td className="pl-5 pr-4 sm:pr-6 lg:pr-10">
        <div className="flex items-center justify-center h-full">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="cursor-pointer flex items-center justify-center text-gray-600 hover:text-black transition"
            title="Edit"
          >
            {EDIT_ICON}
          </button>
        </div>
      </td>
    </tr>
  );
}

function BookingsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = Number(searchParams.get('highlight'));
  const [data, setData] = useState<BookingLookupResponse | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('customer_bookings');
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      router.push('/manage-booking');
    }
  }, [router]);

  if (!data) return null;

  function handleBookingClick(booking: LookupBookingItem) {
    setBookingToken(booking.booking_token);
    router.push(`/booking/${booking.id}?token=${booking.booking_token}`);
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-80px)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/manage-booking"
            className="text-sm font-medium text-primary underline hover:text-primary-hover"
          >
            Go Back
          </Link>

          <div className="mt-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
            <Link
              href="/fleet"
              className="rounded-lg bg-primary px-10 py-3 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
            >
              + Add Booking
            </Link>
          </div>

          <div className="mt-8 overflow-x-auto bg-white">
            <table className="w-full text-left text-[13px] text-[#939393] font-semibold">
              <thead className="h-[35px] bg-[#FAFAFA] text-[#6B7280] border-b border-[#E9E9E9] text-[10px] uppercase tracking-wide">
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th key={h.label} className={h.className}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    isHighlighted={booking.id === highlightId}
                    onClick={() => handleBookingClick(booking)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function BookingsListPage() {
  return (
    <Suspense>
      <BookingsListContent />
    </Suspense>
  );
}

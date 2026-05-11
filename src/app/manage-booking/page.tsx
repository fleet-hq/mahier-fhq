'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { lookupBooking } from '@/services/bookingServices';
import { setBookingToken } from '@/utils/booking-token';

interface FormErrors {
  booking_id?: string;
  last_name?: string;
  email?: string;
  general?: string;
}

export default function ManageBookingPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to bookings list
  useEffect(() => {
    const stored = sessionStorage.getItem('customer_bookings');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.bookings?.length === 1) {
        router.replace(`/booking/${data.searched_booking_id}?token=${data.booking_token}`);
      } else if (data.bookings?.length > 1) {
        router.replace(`/bookings?highlight=${data.searched_booking_id}`);
      }
    }
  }, [router]);

  function validate(): FormErrors {
    const errs: FormErrors = {};

    if (!bookingId.trim()) {
      errs.booking_id = 'Booking ID is required.';
    }

    if (!lastName.trim() && !email.trim()) {
      errs.general = 'Please provide your last name or email address.';
    }

    if (lastName.trim() && !/^[a-zA-Z\s'-]+$/.test(lastName.trim())) {
      errs.last_name = 'Last name can only contain letters, spaces, hyphens, and apostrophes.';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address.';
      }
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await lookupBooking({
        booking_id: `BKG-${bookingId.trim()}`,
        ...(lastName.trim() ? { last_name: lastName.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
      });

      setBookingToken(result.booking_token);

      if (result.bookings.length === 1) {
        // Single booking — go directly to detail
        router.push(`/booking/${result.searched_booking_id}?token=${result.booking_token}`);
      } else {
        // Multiple bookings — go to list page
        sessionStorage.setItem('customer_bookings', JSON.stringify(result));
        router.push(`/bookings?highlight=${result.searched_booking_id}`);
      }
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.non_field_errors) {
        setErrors({ general: data.non_field_errors[0] });
      } else if (data?.booking_id) {
        setErrors({ booking_id: data.booking_id[0] });
      } else {
        setErrors({ general: 'No booking found. Please check your details and try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-80px)] bg-white">
        <div className="mx-auto max-w-md px-6 py-16 sm:py-24">
          <Link
            href="/"
            className="text-sm font-medium text-primary underline hover:text-primary-hover"
          >
            Go Back
          </Link>

          <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
            Manage your booking
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Access your booking using your booking ID.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {errors.general && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {errors.general}
              </div>
            )}

            {/* Booking ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Booking ID
              </label>
              <input
                type="text"
                value={bookingId ? `BKG - ${bookingId}` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const prefix = 'BKG - ';
                  if (val.startsWith(prefix)) {
                    setBookingId(val.slice(prefix.length));
                  } else if (val === '' || val === 'B' || val === 'BK' || val === 'BKG' || val.startsWith('BKG')) {
                    setBookingId('');
                  } else {
                    setBookingId(val);
                  }
                }}
                placeholder="BKG - Enter your Booking Number"
                className={`mt-2 w-full border-b pb-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                  errors.booking_id ? 'border-red-400' : 'border-slate-200 focus:border-primary'
                }`}
              />
              {errors.booking_id && (
                <p className="mt-1 text-xs text-red-500">{errors.booking_id}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Last Name on Driver&apos;s License
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your full name"
                className={`mt-2 w-full border-b pb-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                  errors.last_name ? 'border-red-400' : 'border-slate-200 focus:border-primary'
                }`}
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={`mt-2 w-full border-b pb-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                  errors.email ? 'border-red-400' : 'border-slate-200 focus:border-primary'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary py-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {isLoading ? 'Looking up...' : 'Continue'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

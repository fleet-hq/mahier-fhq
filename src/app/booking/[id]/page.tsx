'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { Button, Spinner } from '@/components/ui';
import {
  useBookingDetails,
  useCreateIdentityVerification,
  useVerificationStatus,
  useBookingImages,
  useUploadTripImage,
  useDeleteTripImage,
  useCreateInsuranceVerification,
} from '@/hooks';
import type { BookingDetails } from '@/services/bookingServices';
import type { TripImage } from '@/services/tripImageServices';
import { setBookingToken, getBookingToken } from '@/utils/booking-token';
import { useBookingBalance as useBillingBalance } from '@/hooks/useBookingBalance';
import { createBillingCheckoutSession } from '@/services/billingServices';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.png';

export default function BookingDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;

  // Store the URL token in the in-memory booking-token util so API
  // calls pick it up. We deliberately don't persist anything to
  // localStorage on this page — the API is the only source of truth.
  const urlToken = searchParams.get('token');
  const [tokenReady, setTokenReady] = useState(!urlToken);

  useEffect(() => {
    if (urlToken) {
      setBookingToken(urlToken);
      setTokenReady(true);
    }
  }, [urlToken]);

  const [idVerificationError, setIdVerificationError] = useState<string | null>(null);
  const [insuranceVerificationError, setInsuranceVerificationError] = useState<string | null>(null);
  const [insuranceVerificationSent, setInsuranceVerificationSent] = useState(false);

  const canFetch = tokenReady ? bookingId : undefined;
  const { data: apiBookingData, isLoading: apiLoading, isError: apiError } = useBookingDetails(canFetch);

  // Pull billing-ledger snapshot so the invoice can roll additional
  // (admin-added) charges into the displayed total.
  const { data: billingBalance } = useBillingBalance(!!canFetch && tokenReady);
  const additionalCharges = (billingBalance?.charges ?? [])
    .filter((c) => !c.is_voided && c.type !== 'booking_fee')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const outstandingBalance = Number(billingBalance?.outstanding_balance ?? 0);
  const historyHref = `/pay/booking/${bookingId}${urlToken ? `?token=${urlToken}` : ''}`;
  const [payNowLoading, setPayNowLoading] = useState(false);
  const handlePayNow = async () => {
    if (payNowLoading) return;
    setPayNowLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const tokenSuffix = urlToken ? `?token=${urlToken}` : '';
      const result = await createBillingCheckoutSession({
        successUrl: `${origin}/booking/${bookingId}${tokenSuffix}`,
        cancelUrl: `${origin}/booking/${bookingId}${tokenSuffix}`,
      });
      window.location.href = result.checkout_url;
    } catch {
      setPayNowLoading(false);
    }
  };

  // Verification hooks
  const { mutate: createIdVerification, isPending: isCreatingIdVerification } = useCreateIdentityVerification();
  const { data: verificationStatus } = useVerificationStatus(canFetch);

  // Insurance verification hook
  const { mutate: createInsuranceVerification, isPending: isCreatingInsuranceVerification } = useCreateInsuranceVerification();

  // Trip images hooks
  const { data: bookingImages = [] } = useBookingImages(canFetch);
  const { mutate: uploadTripImage, isPending: isUploadingImage } = useUploadTripImage();
  const { mutate: deleteTripImage, isPending: isDeletingImage } = useDeleteTripImage();

  const bookingData = apiBookingData;
  const isLoading = !tokenReady || apiLoading;
  const isError = apiError;

  const preTripInputRef = useRef<HTMLInputElement>(null);
  const postTripInputRef = useRef<HTMLInputElement>(null);

  // Filter booking images by type
  const preTripPhotos = bookingImages.filter((img) => img.imageType === 'preTrip');
  const postTripPhotos = bookingImages.filter((img) => img.imageType === 'postTrip');

  // Use verification status from API if available
  const effectiveVerificationStatus = verificationStatus || bookingData?.verifications;

  const handlePreTripUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        uploadTripImage({
          bookingId,
          imageFile: file,
          imageType: 'pre_trip',
        });
      });
    }
    // Reset input
    if (preTripInputRef.current) {
      preTripInputRef.current.value = '';
    }
  };

  const handlePostTripUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        uploadTripImage({
          bookingId,
          imageFile: file,
          imageType: 'post_trip',
        });
      });
    }
    // Reset input
    if (postTripInputRef.current) {
      postTripInputRef.current.value = '';
    }
  };

  const removePreTripPhoto = (index: number) => {
    const photo = preTripPhotos[index];
    if (photo) {
      deleteTripImage({ bookingId, imageId: photo.id });
    }
  };

  const removePostTripPhoto = (index: number) => {
    const photo = postTripPhotos[index];
    if (photo) {
      deleteTripImage({ bookingId, imageId: photo.id });
    }
  };

  // Handle ID verification button click
  const handleVerification = () => {
    if (!bookingData) return;

    createIdVerification(
      { customerId: bookingData.customerId },
      {
        onSuccess: (data) => {
          if (data.url) {
            window.location.href = data.url;
          }
        },
        onError: (error: unknown) => {
          const message = (error as { response?: { data?: { errors?: { non_field_errors?: string[] } } } })
            ?.response?.data?.errors?.non_field_errors?.[0]
            || 'Failed to create verification session. Please try again.';
          setIdVerificationError(message);
        },
      }
    );
  };

  // Handle insurance verification button click
  const handleInsuranceVerification = () => {
    if (!bookingData) return;

    createInsuranceVerification(
      {
        customerId: bookingData.customerId,
        rentalStartDate: bookingData.pickUp.rawDatetime,
        rentalEndDate: bookingData.dropOff.rawDatetime,
        bookingId,
      },
      {
        onSuccess: (data) => {
          if (data.magicLink) {
            window.open(data.magicLink, '_blank');
          }
          setInsuranceVerificationSent(true);
        },
        onError: (error: unknown) => {
          const errData = (error as any)?.response?.data?.errors || (error as any)?.response?.data;
          let message = 'Failed to create insurance verification. Please try again.';
          if (errData) {
            if (errData.non_field_errors?.[0]) {
              message = errData.non_field_errors[0];
            } else if (errData.detail) {
              message = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
            } else {
              // Extract first error from any field (e.g. Modives validation errors)
              const firstKey = Object.keys(errData)[0];
              if (firstKey) {
                const val = errData[firstKey];
                message = Array.isArray(val) ? val[0] : String(val);
              }
            }
          }
          setInsuranceVerificationError(message);
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header showBorderBottom />
        <main className="mx-auto max-w-6xl px-8 py-20 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-slate-500">Loading booking details...</p>
          </div>
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !bookingData) {
    return (
      <div className="min-h-screen bg-white">
        <Header showBorderBottom />
        <main className="mx-auto max-w-6xl px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Booking not found</h1>
          <p className="mt-4 text-slate-600">The booking you are looking for does not exist.</p>
          <Link href="/fleet" className="mt-6 inline-block text-primary underline">
            Browse Fleet
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Get verification statuses (prefer API status over local data)
  const idVerificationStatus = effectiveVerificationStatus?.idVerification || 'pending';
  const insuranceVerificationStatus = effectiveVerificationStatus?.insuranceVerification || 'pending';
  const isIdVerified = idVerificationStatus === 'verified';
  const isInsuranceVerified = insuranceVerificationStatus === 'verified';
  const showInsuranceVerification = bookingData.hasOwnInsurance;
  // Customer can modify the trip once ID verification is complete
  // (insurance verification is independent of trip modifications)
  const verificationsComplete = isIdVerified;
  // Vehicle booking is always successful once the user reaches this page
  const isBookingSuccessful = true;

  // Status Timeline Component
  const StatusTimeline = () => (
    <div>
      {/* Vehicle Booking */}
      <div className="flex">
        <div className="flex flex-col items-center">
          <Image
            src={isBookingSuccessful ? '/icons/review-booking/completed.svg' : '/icons/review-booking/pending.svg'}
            alt={isBookingSuccessful ? 'Completed' : 'Pending'}
            width={24}
            height={24}
            className="shrink-0"
          />
          <div className="flex-1 w-px bg-slate-200" />
        </div>
        <div className="ml-3 pb-8">
          <p className={`text-sm font-semibold ${isBookingSuccessful ? 'text-green-600' : 'text-red-500'}`}>
            {isBookingSuccessful ? 'Successful' : 'Pending'}
          </p>
          <h3 className="mt-1 text-2xl font-normal leading-none tracking-tight-2 text-navy">
            Vehicle Booking
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Booking details have been emailed to you on the provided email.
          </p>
          <Link
            href={bookingData.agreementId ? `/rental-agreement/${bookingData.agreementId}` : `/rental-agreement?bookingId=${bookingData.id}`}
            className="mt-2 inline-block font-manrope text-[10px] font-bold leading-none text-primary underline"
          >
            View Rental Agreement
          </Link>
        </div>
      </div>

      {/* ID Verification */}
      <div className="flex">
        <div className="flex flex-col items-center">
          <Image
            src={isIdVerified ? '/icons/review-booking/completed.svg' : '/icons/review-booking/pending.svg'}
            alt={isIdVerified ? 'Completed' : 'Pending'}
            width={24}
            height={24}
            className="shrink-0"
          />
          {showInsuranceVerification && <div className="flex-1 w-px bg-slate-200" />}
        </div>
        <div className={`ml-3 ${showInsuranceVerification ? 'pb-8' : ''}`}>
          <p className={`text-sm font-semibold ${isIdVerified ? 'text-green-600' : 'text-red-500'}`}>
            {isIdVerified ? 'Verified' : 'Pending'}
          </p>
          <h3 className="mt-1 text-2xl font-normal leading-none tracking-tight-2 text-navy">
            ID Verification
          </h3>
          {!isIdVerified && (
            <Button
              variant="primary"
              className="mt-4 text-xs"
              onClick={() => { setIdVerificationError(null); handleVerification(); }}
              disabled={isCreatingIdVerification || bookingData?.status === 'cancelled'}
            >
              {isCreatingIdVerification ? 'Redirecting...' : 'Complete Verification'}
            </Button>
          )}
          {idVerificationError && !isIdVerified && (
            <p className="mt-2 text-xs text-red-500">{idVerificationError}</p>
          )}
        </div>
      </div>

      {/* Insurance Verification - only shown when user selected "I have my own insurance" */}
      {showInsuranceVerification && (
        <div className="flex">
          <div className="flex flex-col items-center">
            <Image
              src={isInsuranceVerified ? '/icons/review-booking/completed.svg' : '/icons/review-booking/pending.svg'}
              alt={isInsuranceVerified ? 'Completed' : 'Pending'}
              width={24}
              height={24}
              className="shrink-0"
            />
          </div>
          <div className="ml-3">
            <p className={`text-sm font-semibold ${isInsuranceVerified ? 'text-green-600' : 'text-red-500'}`}>
              {isInsuranceVerified ? 'Verified' : 'Pending'}
            </p>
            <h3 className="mt-1 text-2xl font-normal leading-none tracking-tight-2 text-navy">
              Insurance Verification
            </h3>
            {!isInsuranceVerified && !insuranceVerificationSent && (
              <Button
                variant="primary"
                className="mt-4 text-xs"
                onClick={() => { setInsuranceVerificationError(null); handleInsuranceVerification(); }}
                disabled={isCreatingInsuranceVerification || bookingData?.status === 'cancelled'}
              >
                {isCreatingInsuranceVerification ? 'Sending...' : 'Verify Insurance'}
              </Button>
            )}
            {insuranceVerificationSent && !isInsuranceVerified && (
              <p className="mt-2 text-xs text-green-600">
                Verification created. Please check your email to complete the process, then refresh this page.
              </p>
            )}
            {insuranceVerificationError && !isInsuranceVerified && (
              <p className="mt-2 text-xs text-red-500">{insuranceVerificationError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Location Details Component
  const LocationDetails = ({ className = '' }: { className?: string }) => (
    <div className={className}>
      <h3 className="text-base font-semibold text-navy">Location Details</h3>
      <div className="mt-3">
        {/* Pick Up */}
        <div className="flex gap-2">
          <div className="flex flex-col items-center pt-1.5">
            <Image
              src="/icons/review-booking/pickup.svg"
              alt="Pickup"
              width={7}
              height={7}
              className="shrink-0"
            />
            <div className="flex-1 w-px border-l border-dashed border-slate-300" />
          </div>
          <div className="flex-1 pb-4">
            <p className="text-xs text-slate-500">Pick up</p>
            <p className="mt-0.5 text-sm font-bold text-navy">{bookingData.pickUp.address}</p>
            <p className="text-xs text-slate-500">
              {bookingData.pickUp.date}, {bookingData.pickUp.time}
            </p>
          </div>
        </div>

        {/* Drop Off */}
        <div className="flex gap-2">
          <div className="pt-1.5">
            <Image
              src="/icons/review-booking/drop-off.svg"
              alt="Drop off"
              width={7}
              height={7}
              className="shrink-0"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500">Drop off</p>
            <p className="mt-0.5 text-sm font-bold text-navy">{bookingData.dropOff.address}</p>
            <p className="text-xs text-slate-500">
              {bookingData.dropOff.date}, {bookingData.dropOff.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Invoice Component
  const InvoiceCard = ({ className = '' }: { className?: string }) => {
    const formatPrice = (amount: number) => {
      const [whole, cents] = amount.toFixed(2).split('.');
      return (
        <>
          <span className="text-xl font-bold text-slate-900">${whole}</span>
          <span className="text-xs font-bold text-slate-900">.{cents}</span>
        </>
      );
    };

    return (
      <div className={`rounded-lg border border-slate-200 bg-surface px-8 py-4 md:p-6 ${className}`}>
        {/* Invoice Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Invoice</h3>
              <span className="text-[10px] font-light leading-none text-slate-900">#{bookingData.invoice.number}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{bookingData.vehicle.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {outstandingBalance > 0 && (
              <button
                type="button"
                onClick={handlePayNow}
                disabled={payNowLoading}
                className="inline-flex items-center justify-center box-border h-10 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed leading-none"
              >
                {payNowLoading ? 'Redirecting…' : 'Pay Now'}
              </button>
            )}
            <Link
              href={historyHref}
              className="inline-flex items-center justify-center gap-1.5 box-border h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition leading-none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              History
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
            >
              <Image src="/icons/booking/download-outline.svg" alt="Download" width={20} height={20} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px w-full bg-border-muted" />

        {/* Invoice Items */}
        <div className="space-y-4">
          {bookingData.invoice.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <div className="relative h-12 w-16 overflow-hidden rounded bg-slate-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-16 items-center justify-center rounded bg-slate-100">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.quantity}x {item.periodLabel || `Base price per ${item.unit ?? 'day'}`}
                  </p>
                </div>
              </div>
              <p className="font-medium text-slate-900">${((item.pricePerDay ?? 0) * (item.quantity ?? 1)).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Extras */}
        {bookingData.invoice.extras.length > 0 && (
          <>
            <div className="my-4 h-px w-full bg-border-muted" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Extras</h4>
              <div className="mt-3 space-y-2">
                {bookingData.invoice.extras.map((extra, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{extra.name}</span>
                    <span className="text-slate-900">${extra.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="my-4 h-px w-full bg-border-muted" />

        {/* Rental, Location & Fees */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Rental total</span>
            <span className="text-slate-900">${bookingData.invoice.rentalTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Location charges</span>
            <span className="text-slate-900">${bookingData.invoice.locationCharges.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Booking fees</span>
            <span className="text-slate-900">${bookingData.invoice.fees.toFixed(2)}</span>
          </div>
        </div>

        {/* Discount & Insurance */}
        <div className="my-4 h-px w-full bg-border-muted" />
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Discount</span>
              {bookingData.invoice.discountCode && (
                <span className="flex items-center gap-1 text-sm font-medium text-slate-900">
                  <Image src="/icons/booking/discount.svg" alt="Discount" width={16} height={16} />
                  {bookingData.invoice.discountCode}
                </span>
              )}
            </div>
            <span className="text-slate-900">-${bookingData.invoice.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              Insurance
              {bookingData.insuranceCoverage && (
                ` (${[
                  bookingData.insuranceCoverage.cdw && 'CDW',
                  bookingData.insuranceCoverage.rcli && 'RCLI',
                  bookingData.insuranceCoverage.sli && 'SLI',
                  bookingData.insuranceCoverage.pai && 'PAI',
                ].filter(Boolean).join(', ')})`
              )}
            </span>
            <span className="text-slate-900">${bookingData.invoice.insurancePremium.toFixed(2)}</span>
          </div>
        </div>

        {/* Total charges */}
        <div className="my-4 h-px w-full bg-border-muted" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Total charges</span>
          <span className="text-sm font-bold text-slate-900">
            ${(bookingData.invoice.subtotal + bookingData.invoice.fees + bookingData.invoice.insurancePremium).toFixed(2)}
          </span>
        </div>

        {/* Tax & Total */}
        <div className="my-4 h-px w-full bg-border-muted" />
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tax calculation</span>
            <span className="text-slate-900">${bookingData.invoice.tax.toFixed(2)}</span>
          </div>
          {additionalCharges > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Additional charges</span>
              <span className="text-slate-900">${additionalCharges.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900">Total</span>
          <div className="text-right">
            <span className="text-xs text-slate-500">USD </span>
            {formatPrice(bookingData.invoice.total + additionalCharges)}
          </div>
        </div>

        {/* Security deposit */}
        <div className="my-4 h-px w-full bg-border-muted" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Security deposit</span>
          <span className="text-sm font-bold text-slate-900">${bookingData.invoice.deposit.toFixed(2)}</span>
        </div>

        {/* Balance — what the customer still owes per the ledger */}
        {billingBalance && (
          <>
            <div className="my-4 h-px w-full bg-border-muted" />
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-semibold ${
                  outstandingBalance > 0 ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                Balance
              </span>
              <div className="text-right">
                <span className="text-xs text-slate-500">USD </span>
                <span
                  className={`text-sm font-bold ${
                    outstandingBalance > 0 ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  ${outstandingBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Photo Upload Card Component
  const PhotoUploadCard = ({
    title,
    description,
    photos,
    onUpload,
    onRemove,
    inputRef,
    isUploading = false,
    isDeleting = false,
    className = '',
  }: {
    title: string;
    description: string;
    photos: TripImage[];
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (index: number) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    isUploading?: boolean;
    isDeleting?: boolean;
    className?: string;
  }) => (
    <div className={`flex flex-col rounded-lg border border-surface-subtle bg-surface-muted px-8 py-4 md:p-6 ${className}`}>
      <h3 className="text-base font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{description}</p>

      {/* Photo Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg">
            <Image src={photo.imageUrl} alt={`${title} ${index + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={isDeleting}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onUpload}
        className="hidden"
      />
      <Button
        variant="primary"
        className="gap-2 text-xs"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Spinner size="sm" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3.33334V12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {isUploading ? 'Uploading...' : 'Upload'}
      </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header showBorderBottom />

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-6 pb-8 md:py-8 md:pb-28">
        {/* Go Back Link */}
        <Link
          href="/fleet"
          className="no-print inline-flex items-center text-sm font-medium text-primary underline hover:text-primary-hover"
        >
          Go Back
        </Link>

        {/* Cancelled Banner */}
        {bookingData?.status === 'cancelled' && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">Booking Cancelled</p>
                <p className="text-xs text-red-600 mt-0.5">This booking has been cancelled and can no longer be modified.</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Pending Banner — only when the new billing ledger
            shows an outstanding balance for this booking. Reads
            via the public X-Booking-Token endpoint. */}
        <PaymentPendingBanner bookingId={bookingId as string} urlToken={urlToken || ''} />

        {/* Title Section */}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-0">
          <h1 className="font-manrope text-2xl font-semibold leading-none tracking-tight-2 text-navy">
            Booking Details
          </h1>
          <div className="no-print flex flex-wrap gap-3">
            <button
              disabled={!verificationsComplete || !bookingData?.canModify?.cancel}
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-xs font-medium transition ${
                verificationsComplete && bookingData?.canModify?.cancel
                  ? 'cursor-pointer border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              }`}
              onClick={() => {
                if (!verificationsComplete || !bookingData?.canModify?.cancel) return;
                const token = urlToken || getBookingToken() || '';
                window.location.href = `/booking/${bookingId}/cancel?token=${token}`;
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke={verificationsComplete && bookingData?.canModify?.cancel ? '#010713' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Cancel Trip
            </button>
            <button
              disabled={!verificationsComplete || !bookingData?.canModify?.swap}
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-xs font-medium transition ${
                verificationsComplete && bookingData?.canModify?.swap
                  ? 'cursor-pointer border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              }`}
              onClick={() => {
                if (!verificationsComplete || !bookingData?.canModify?.swap) return;
                const token = urlToken || getBookingToken() || '';
                window.location.href = `/booking/${bookingId}/swap?token=${token}`;
              }}
            >
              <Image src="/icons/home/hero/inverse-arrows.svg" alt="Change Vehicle" width={16} height={16} className={verificationsComplete && bookingData?.canModify?.swap ? 'brightness-0' : 'opacity-40'} />
              Change Vehicle
            </button>
            <button
              disabled={!verificationsComplete || (!bookingData?.canModify?.extend && !bookingData?.canModify?.reduce)}
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-xs font-medium transition ${
                verificationsComplete && (bookingData?.canModify?.extend || bookingData?.canModify?.reduce)
                  ? 'cursor-pointer border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              }`}
              onClick={() => {
                if (!verificationsComplete || (!bookingData?.canModify?.extend && !bookingData?.canModify?.reduce)) return;
                const token = urlToken || getBookingToken() || '';
                window.location.href = `/booking/${bookingId}/edit?token=${token}`;
              }}
            >
              <Image src="/icons/booking/edit.svg" alt="Edit Booking" width={14} height={14} className={verificationsComplete && (bookingData?.canModify?.extend || bookingData?.canModify?.reduce) ? '' : 'opacity-40'} />
              Edit Booking
            </button>
            <Button variant="primary" className="w-full gap-2.5 md:w-auto text-xs" onClick={() => window.print()}>
              <Image src="/icons/download.svg" alt="Download" width={15} height={17} />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="mt-8 space-y-6 lg:hidden">
          {/* Success Card with Location Details - Mobile */}
          <div className="-mx-4 sm:-mx-8 relative mt-16 rounded-lg border border-surface-subtle bg-surface-muted px-4 sm:px-8 pb-4 pt-16">
            {/* Success Icon */}
            <div className="absolute -top-11 left-4 sm:left-8">
              <Image
                src="/icons/review-booking/success-tick.svg"
                alt="Success"
                width={88}
                height={88}
              />
            </div>

            {/* Vehicle Image */}
            <div className="relative h-24 w-36 overflow-hidden rounded-lg bg-slate-200">
              <Image
                src={bookingData.vehicle.image && bookingData.vehicle.image !== '' ? bookingData.vehicle.image : PLACEHOLDER_IMAGE}
                alt={bookingData.vehicle.name}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
              />
            </div>

            {/* Booking Info */}
            <div className="mt-4">
              <p className="text-xs text-slate-500">
                Booking ID <span className="font-semibold text-navy">#{bookingData.invoice.number}</span>
              </p>
              <h2 className="mt-1 font-manrope text-[28px] font-bold leading-none tracking-tight-2 text-navy">
                {isBookingSuccessful ? 'Booking Successful' : 'Booking Pending'}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {bookingData.vehicle.name} - {bookingData.vehicle.licensePlate}
              </p>
            </div>

            {/* Customer Details - Single Column */}
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs text-slate-500">Booked by</p>
                <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                  {bookingData.customer.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Booked On</p>
                <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                  {bookingData.bookedOn}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Vehicle Vin</p>
                <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                  {bookingData.vehicle.vin}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                  {bookingData.customer.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone no.</p>
                <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                  {bookingData.customer.phone}
                </p>
              </div>
            </div>

            {/* Location Details - Inside gray card */}
            <div className="mt-6 border-t border-slate-200 pt-6">
              <LocationDetails />
            </div>
          </div>

          {/* Status Timeline - Mobile */}
          <div className="pt-6 pl-4 sm:pl-8">
            <StatusTimeline />
          </div>

          {/* Invoice - Mobile */}
          <div className="-mx-4 sm:-mx-8 pt-4">
            <InvoiceCard className="rounded-lg" />
          </div>

          {/* Photo Upload Cards - Mobile */}
          <div className="no-print -mx-4 sm:-mx-8">
            <PhotoUploadCard
              title="Add Pre-Trip Photos"
              description="Upload photos of the vehicle before the trip"
              photos={preTripPhotos}
              onUpload={handlePreTripUpload}
              onRemove={removePreTripPhoto}
              inputRef={preTripInputRef}
              isUploading={isUploadingImage}
              isDeleting={isDeletingImage}
              className="rounded-lg"
            />
          </div>
          <div className="no-print -mx-4 sm:-mx-8">
            <PhotoUploadCard
              title="Add Post-Trip Photos"
              description="Upload photos of the vehicle after the trip"
              photos={postTripPhotos}
              onUpload={handlePostTripUpload}
              onRemove={removePostTripPhoto}
              inputRef={postTripInputRef}
              isUploading={isUploadingImage}
              isDeleting={isDeletingImage}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="mt-8 hidden gap-6 lg:flex">
          {/* Left Sidebar - Status Steps */}
          <div className="w-80 shrink-0">
            <StatusTimeline />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Booking Success Card */}
            <div className="relative rounded-lg border border-surface-subtle bg-surface-muted px-6 pb-6 pt-12">
              {/* Success Icon */}
              <div className="absolute -top-11 left-6">
                <Image
                  src="/icons/review-booking/success-tick.svg"
                  alt="Success"
                  width={88}
                  height={88}
                />
              </div>

              {/* Content Layout */}
              <div className="flex gap-6">
                {/* Left Section */}
                <div className="flex-1">
                  {/* Top Row */}
                  <div className="flex gap-6">
                    {/* Vehicle Image */}
                    <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                      <Image
                        src={bookingData.vehicle.image && bookingData.vehicle.image !== '' ? bookingData.vehicle.image : PLACEHOLDER_IMAGE}
                        alt={bookingData.vehicle.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>

                    {/* Booking Info */}
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">
                        Booking ID <span className="font-semibold text-navy">#{bookingData.invoice.number}</span>
                      </p>
                      <h2 className="mt-1 font-manrope text-[32px] font-bold leading-none tracking-tight-2 text-navy">
                        {isBookingSuccessful ? 'Booking Successful' : 'Booking Pending'}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-slate-600">
                        {bookingData.vehicle.name} - {bookingData.vehicle.licensePlate}
                      </p>
                    </div>
                  </div>

                  {/* Customer Details Grid */}
                  <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <p className="text-xs text-slate-500">Booked by</p>
                      <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                        {bookingData.customer.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Booked On</p>
                      <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                        {bookingData.bookedOn}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                        {bookingData.customer.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Vehicle Vin</p>
                      <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                        {bookingData.vehicle.vin}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone no.</p>
                      <p className="mt-1 text-base font-normal leading-none tracking-tight-2 text-navy">
                        {bookingData.customer.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Section - Location Details */}
                <LocationDetails className="w-60 shrink-0" />
              </div>
            </div>

            {/* Bottom Row - Invoice and Photo Cards */}
            <div className="flex gap-6">
              {/* Invoice Card */}
              <InvoiceCard className="flex-1" />

              {/* Right Column - Photo Upload Cards */}
              <div className="no-print w-60 shrink-0 flex flex-col gap-6">
                <PhotoUploadCard
                  title="Add Pre-Trip Photos"
                  description="Upload photos of the vehicle before the trip"
                  photos={preTripPhotos}
                  onUpload={handlePreTripUpload}
                  onRemove={removePreTripPhoto}
                  inputRef={preTripInputRef}
                  isUploading={isUploadingImage}
                  isDeleting={isDeletingImage}
                  className="flex-1"
                />
                <PhotoUploadCard
                  title="Add Post-Trip Photos"
                  description="Upload photos of the vehicle after the trip"
                  photos={postTripPhotos}
                  onUpload={handlePostTripUpload}
                  onRemove={removePostTripPhoto}
                  inputRef={postTripInputRef}
                  isUploading={isUploadingImage}
                  isDeleting={isDeletingImage}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Hidden on mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────
// Payment Pending banner — shown only when the new billing ledger
// reports an outstanding balance. Read-only: links to the dedicated
// /pay/booking/:id page. Keeps the legacy "checkout link by email"
// flow working in parallel.
// ─────────────────────────────────────────────────────────────────

function PaymentPendingBanner({
  bookingId,
  urlToken,
}: {
  bookingId: string;
  urlToken: string;
}) {
  const { data: balance, isLoading } = useBillingBalance(true);
  if (isLoading || !balance) return null;
  const outstanding = Number(balance.outstanding_balance);
  if (outstanding <= 0) return null;

  // Prefer the URL token; fall back to whatever was persisted in
  // sessionStorage so the link is self-contained either way.
  const effectiveToken = urlToken || getBookingToken() || '';
  const href = `/pay/booking/${bookingId}${effectiveToken ? `?token=${effectiveToken}` : ''}`;
  return (
    <div className="no-print mt-6 rounded-lg border border-red-100 bg-red-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="#dc2626"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700">
            Payment pending — ${outstanding.toFixed(2)}
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            New charges have been added to your booking. Pay anytime from your
            booking payment page.
          </p>
        </div>
      </div>
      <a
        href={href}
        className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition shrink-0"
      >
        View &amp; Pay
      </a>
    </div>
  );
}

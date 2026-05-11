'use client';

import Image from 'next/image';

// Supported card brands
const SUPPORTED_CARDS = [
  { src: '/icons/booking/cards/VISA.svg', alt: 'Visa' },
  { src: '/icons/booking/cards/Mastercard.svg', alt: 'Mastercard' },
  { src: '/icons/booking/cards/AMEX.svg', alt: 'Amex' },
  { src: '/icons/booking/cards/Discover.svg', alt: 'Discover' },
] as const;

interface PaymentDetailsSectionProps {
  onPayNow?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PaymentDetailsSection({ onPayNow, isLoading, className }: PaymentDetailsSectionProps) {
  return (
    <section className={className}>
      <h2 className="font-manrope text-base font-semibold leading-none tracking-tight-2 text-navy">
        Payment Details
      </h2>

      <div className="mt-5 -mx-4 rounded-lg border border-slate-200 p-3 md:mx-0 md:p-6 md:flex md:flex-1 md:flex-col">
        {/* Payment Method Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-900">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />
          </div>
          <span className="text-sm font-medium text-slate-900">Credit or Debit Card</span>
        </div>

        {/* Info text */}
        <p className="mt-4 text-sm text-slate-500">
          You will be redirected to a secure Stripe checkout page to complete your payment.
        </p>

        {/* Supported Cards */}
        <div className="mt-4 flex items-center gap-2">
          {SUPPORTED_CARDS.map((card) => (
            <Image
              key={card.alt}
              src={card.src}
              alt={card.alt}
              width={32}
              height={20}
            />
          ))}
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-slate-50 p-3">
          <svg
            className="h-4 w-4 shrink-0 text-green-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <p className="text-xs text-slate-600">
            Your payment information is encrypted and processed securely by Stripe. We never store
            your card details.
          </p>
        </div>

      </div>
    </section>
  );
}

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { getStripePublishableKey } from '@/services/stripeServices';

// Cache for Stripe instances per publishable key
const stripeCache = new Map<string, Promise<Stripe | null>>();

function getStripeInstance(publishableKey: string) {
  if (!stripeCache.has(publishableKey)) {
    stripeCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripeCache.get(publishableKey)!;
}

// Stripe Elements appearance configuration
const STRIPE_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#0f172a',
    colorBackground: '#ffffff',
    colorText: '#334155',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '6px',
  },
};

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initStripe() {
      try {
        const publishableKey = await getStripePublishableKey();

        if (!publishableKey) {
          setError('Payment system not configured for this company');
          setIsLoading(false);
          return;
        }

        setStripePromise(getStripeInstance(publishableKey));
        setError(null);
      } catch {
        setError('Failed to load payment system');
      } finally {
        setIsLoading(false);
      }
    }

    initStripe();
  }, []);

  // Show loading state while fetching the key
  if (isLoading) {
    return <>{children}</>;
  }

  // Show error or fallback if no key available
  if (error || !stripePromise) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise} options={{ appearance: STRIPE_APPEARANCE }}>
      {children}
    </Elements>
  );
}

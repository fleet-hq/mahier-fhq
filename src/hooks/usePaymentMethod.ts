import { useCallback } from 'react';
import { CardElement } from '@stripe/react-stripe-js';

// Conditional imports to handle being outside Elements context
let useStripe: () => ReturnType<typeof import('@stripe/react-stripe-js').useStripe> | null;
let useElements: () => ReturnType<typeof import('@stripe/react-stripe-js').useElements> | null;

try {
  const stripeReact = require('@stripe/react-stripe-js');
  useStripe = stripeReact.useStripe;
  useElements = stripeReact.useElements;
} catch {
  useStripe = () => null;
  useElements = () => null;
}

export interface PaymentMethodResult {
  paymentMethodId: string;
}

export interface PaymentMethodError {
  error: string;
}

export function usePaymentMethod() {
  let stripe: ReturnType<typeof useStripe> = null;
  let elements: ReturnType<typeof useElements> = null;

  // Try to get Stripe context, but don't fail if not available
  try {
    stripe = useStripe();
    elements = useElements();
  } catch {
    // Called outside Elements context - will return isReady: false
  }

  const createPaymentMethod = useCallback(async (): Promise<
    PaymentMethodResult | PaymentMethodError
  > => {
    if (!stripe || !elements) {
      return { error: 'Payment system not initialized. Please refresh the page.' };
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return { error: 'Card input not found. Please refresh the page.' };
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      return { error: error.message || 'Payment failed. Please try again.' };
    }

    return { paymentMethodId: paymentMethod.id };
  }, [stripe, elements]);

  return {
    createPaymentMethod,
    isReady: !!stripe && !!elements,
  };
}

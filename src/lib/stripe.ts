// ──────────────────────────────────────────────
// KidsVerse — Stripe Client
// ──────────────────────────────────────────────
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { STRIPE_PK, APP_URL } from './firebase';

let stripePromise: Promise<Stripe | null>;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PK);
  }
  return stripePromise;
}

export interface CheckoutSessionParams {
  priceId: string;
  parentId: string;
  mode: 'subscription' | 'payment';
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<{ url: string } | null> {
  try {
    const response = await fetch(
      `${APP_URL}/api/create-checkout-session`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: params.priceId,
          parentId: params.parentId,
          mode: params.mode,
          successUrl: params.successUrl ?? `${APP_URL}/parent/subscription/success`,
          cancelUrl: params.cancelUrl ?? `${APP_URL}/parent/subscription`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    return data as { url: string };
  } catch (error) {
    console.error('KidsVerse: Stripe checkout error', error);
    return null;
  }
}

export async function redirectToCheckout(sessionUrl: string): Promise<void> {
  window.location.href = sessionUrl;
}

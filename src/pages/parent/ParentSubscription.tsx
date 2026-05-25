import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { updateParentProfile } from '@/lib/firestore';
import { createCheckoutSession, redirectToCheckout } from '@/lib/stripe';
import { Badge, ConfirmDialog } from '@/components';
import { motion } from 'framer-motion';
import type { SubscriptionTier, Subscription } from '@/types';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  tier: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  description: string;
  color: string;
  bgColor: string;
  features: PlanFeature[];
}

const plans: PricingPlan[] = [
  {
    tier: 'free',
    name: 'Explorer',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    color: 'text-kv-gray-700',
    bgColor: 'bg-kv-gray-100',
    features: [
      { text: '1 child profile', included: true },
      { text: '30 minutes/day screen time', included: true },
      { text: 'Basic learning modules', included: true },
      { text: '2 games', included: true },
      { text: '3 stories', included: true },
      { text: 'Drawing canvas', included: true },
      { text: 'All learning modules', included: false },
      { text: 'All games', included: false },
      { text: '120 minutes/day screen time', included: false },
      { text: 'Up to 5 child profiles', included: false },
      { text: 'Video section', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    tier: 'premium',
    name: 'Adventurer',
    price: '$7.99',
    period: '/month',
    description: 'Unlock the full KidsVerse experience',
    color: 'text-kv-purple',
    bgColor: 'bg-kv-purple/10',
    features: [
      { text: 'Up to 5 child profiles', included: true },
      { text: '120 minutes/day screen time', included: true },
      { text: 'All learning modules', included: true },
      { text: 'All games + leaderboards', included: true },
      { text: 'Unlimited stories', included: true },
      { text: 'Drawing canvas + gallery', included: true },
      { text: 'Science explainers (ages 8-10)', included: true },
      { text: 'Creative studio (coloring pages)', included: true },
      { text: 'Video section with playlists', included: true },
      { text: 'Detailed progress reports', included: true },
      { text: 'Priority support', included: true },
      { text: 'No ads — ever', included: true },
    ],
  },
];

export default function ParentSubscription() {
  const navigate = useNavigate();
  const { user, parentProfile } = useAuthStore();

  const subscription: Subscription = parentProfile?.subscription ?? {
    tier: 'free',
    status: 'inactive',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };

  const currentTier: SubscriptionTier = subscription.tier ?? 'free';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── Auth guard ──
  if (!user || !parentProfile) {
    return (
      <div className="kv-page flex items-center justify-center min-h-[60vh]">
        <div className="kv-skeleton w-full max-w-md h-64 rounded-3xl" aria-label="Loading subscription page" />
      </div>
    );
  }

  // ── Stripe checkout ──
  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await createCheckoutSession({
        priceId: 'price_premium_monthly',
        parentId: user.uid,
        mode: 'subscription',
      });
      if (session?.url) {
        await redirectToCheckout(session.url);
      } else {
        setError('Unable to start checkout. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Cancel subscription ──
  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const updated: Subscription = { ...subscription, cancelAtPeriodEnd: true };
      await updateParentProfile(user.uid, { subscription: updated });
      useAuthStore.getState().setSubscription(updated);
      setShowCancelDialog(false);
    } catch {
      // Silently fail — user can retry
    } finally {
      setCancelLoading(false);
    }
  };

  // ── Resume subscription ──
  const handleResume = async () => {
    setCancelLoading(true);
    try {
      const updated: Subscription = { ...subscription, cancelAtPeriodEnd: false };
      await updateParentProfile(user.uid, { subscription: updated });
      useAuthStore.getState().setSubscription(updated);
    } catch {
      // Silently fail — user can retry
    } finally {
      setCancelLoading(false);
    }
  };

  // ── Status banner logic ──
  const isPremium = currentTier === 'premium';
  const isActive = subscription.status === 'active';
  const isCanceling = subscription.cancelAtPeriodEnd;
  const isPastDue = subscription.status === 'past_due';

  const statusBanner = (() => {
    if (isPremium && isActive && !isCanceling) {
      return (
        <Badge variant="success" size="lg" icon="✓">
          Premium Active
        </Badge>
      );
    }
    if (isPremium && isCanceling) {
      const dateSuffix = subscription.currentPeriodEnd
        ? ` — ${subscription.currentPeriodEnd.toLocaleDateString()}`
        : '';
      return (
        <Badge variant="warning" size="lg" icon="⏳">
          {`Canceling at end of billing period${dateSuffix}`}
        </Badge>
      );
    }
    if (isPremium && isPastDue) {
      return (
        <Badge variant="danger" size="lg" icon="⚠">
          Payment Issue — please update your billing
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="lg">
        Free Plan
      </Badge>
    );
  })();

  return (
    <div className="kv-page">
      <header className="mb-8">
        <button
          onClick={() => navigate('/parent')}
          className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm mb-4"
          aria-label="Back to dashboard"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-display text-kv-purple">Subscription</h1>
        <p className="text-kv-gray-500 mt-1">
          Current plan: <span className="font-bold text-kv-purple capitalize">{currentTier}</span>
        </p>
      </header>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3 mb-6"
        role="status"
        aria-live="polite"
      >
        {statusBanner}
        {subscription.currentPeriodEnd && isPremium && !isCanceling && (
          <span className="text-sm text-kv-gray-400">
            Renews {subscription.currentPeriodEnd.toLocaleDateString()}
          </span>
        )}
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 kv-card border-2 border-kv-red p-4"
          role="alert"
        >
          <p className="text-sm text-kv-red font-bold">{error}</p>
        </motion.div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          return (
            <div
              key={plan.tier}
              className={`kv-card relative ${isCurrent ? 'ring-4 ring-kv-purple' : ''}`}
              aria-label={`${plan.name} plan`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-kv-purple text-white text-sm font-bold px-4 py-1 rounded-full">
                  Current Plan
                </div>
              )}

              <div className="text-center mb-6">
                <span
                  className={`text-5xl block mb-3 ${plan.bgColor} w-20 h-20 rounded-full mx-auto flex items-center justify-center`}
                  aria-hidden="true"
                >
                  {plan.tier === 'free' ? '🎁' : '⭐'}
                </span>
                <h2 className={`text-2xl font-display ${plan.color}`}>{plan.name}</h2>
                <p className="text-kv-gray-500 text-sm mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-display font-bold text-kv-gray-800">{plan.price}</span>
                  {plan.period !== 'forever' && (
                    <span className="text-kv-gray-400">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6" aria-label={`${plan.name} plan features`}>
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3 text-sm">
                    <span
                      className={`flex-shrink-0 mt-0.5 ${feature.included ? 'text-kv-green' : 'text-kv-gray-300'}`}
                      aria-hidden="true"
                    >
                      {feature.included ? '✓' : '✕'}
                    </span>
                    <span
                      className={feature.included ? 'text-kv-gray-700' : 'text-kv-gray-400'}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent || (plan.tier === 'premium' && loading)}
                onClick={plan.tier === 'premium' ? handleUpgrade : undefined}
                className={`w-full kv-button-base py-3 font-display text-lg ${
                  isCurrent
                    ? 'bg-kv-gray-100 text-kv-gray-400 cursor-default'
                    : plan.tier === 'premium'
                    ? 'bg-kv-purple text-white'
                    : 'bg-kv-gray-200 text-kv-gray-600'
                } disabled:opacity-50`}
                aria-label={
                  isCurrent
                    ? `${plan.name} plan is currently active`
                    : `Upgrade to ${plan.name} plan`
                }
                aria-busy={loading && plan.tier === 'premium'}
              >
                {isCurrent ? 'Current Plan' : loading ? 'Processing...' : 'Upgrade Now'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Cancel / Resume Section */}
      {isPremium && (
        <div className="kv-card mt-8 text-center max-w-lg mx-auto border-2 border-kv-orange">
          {!isCanceling ? (
            <>
              <h3 className="text-lg font-bold text-kv-orange mb-2">Want to cancel?</h3>
              <p className="text-sm text-kv-gray-500 mb-4">
                You can cancel anytime. Your premium features will remain active until the end of
                your billing period.
              </p>
              <button
                onClick={() => setShowCancelDialog(true)}
                className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-6 py-2"
                aria-label="Cancel premium subscription"
              >
                Cancel Subscription
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-kv-green mb-2">Resuming your subscription?</h3>
              <p className="text-sm text-kv-gray-500 mb-4">
                Your subscription is set to cancel at the end of your current billing period. Click
                below to keep your premium benefits.
              </p>
              <button
                onClick={handleResume}
                disabled={cancelLoading}
                className="kv-button-base bg-kv-green text-white px-6 py-2 disabled:opacity-50"
                aria-label="Resume premium subscription"
                aria-busy={cancelLoading}
              >
                {cancelLoading ? 'Processing...' : 'Resume Subscription'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        variant="danger"
        title="Cancel Premium?"
        message="Your premium features will remain active until the end of your billing period. Are you sure?"
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Premium"
        loading={cancelLoading}
      />
    </div>
  );
}

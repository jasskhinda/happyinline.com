'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  getSubscriptionStatus,
  cancelSubscription,
  upgradeSubscription,
  downgradeSubscription,
  cancelPendingDowngrade,
  SubscriptionStatus
} from '@/lib/auth';
import { STRIPE_PLANS, PlanKey, getPlanColor } from '@/lib/stripe';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Loader2,
  Calendar,
  CreditCard,
  Clock,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Users,
  Check,
  X,
  Star,
  Shield,
  ChevronRight,
  Zap
} from 'lucide-react';

const PLAN_ORDER: PlanKey[] = ['basic', 'starter', 'professional', 'enterprise', 'unlimited'];

export default function ManagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState<{
    type: 'upgrade' | 'downgrade';
    planKey: PlanKey;
  } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    detail?: string;
  } | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      const subStatus = await getSubscriptionStatus(user.id);
      setSubscription(subStatus);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string, detail?: string) => {
    setNotification({ type, message, detail });
    setTimeout(() => setNotification(null), 8000);
  };

  const handleUpgrade = async (planKey: PlanKey) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const result = await upgradeSubscription(userId, planKey);
      if (result.success) {
        showNotification(
          'success',
          `Upgraded to ${STRIPE_PLANS[planKey].name}!`,
          result.prorationAmount
            ? `A prorated charge of $${result.prorationAmount.toFixed(2)} has been applied.`
            : undefined
        );
        await loadSubscriptionData();
      } else {
        if (result.requiresNewSubscription) {
          router.push(`/subscribe?plan=${planKey}`);
          return;
        }
        showNotification('error', result.error || 'Failed to upgrade');
      }
    } catch {
      showNotification('error', 'An unexpected error occurred');
    } finally {
      setActionLoading(false);
      setShowChangeModal(null);
    }
  };

  const handleDowngrade = async (planKey: PlanKey) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const result = await downgradeSubscription(userId, planKey);
      if (result.success) {
        showNotification(
          'success',
          result.message || `Downgrade to ${STRIPE_PLANS[planKey].name} scheduled`,
          `You'll keep your current plan until ${formatDate(result.effectiveDate)}.`
        );
        await loadSubscriptionData();
      } else {
        showNotification('error', result.error || 'Failed to schedule downgrade');
      }
    } catch {
      showNotification('error', 'An unexpected error occurred');
    } finally {
      setActionLoading(false);
      setShowChangeModal(null);
    }
  };

  const handleCancelPending = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const result = await cancelPendingDowngrade(userId);
      if (result.success) {
        showNotification('success', 'Pending plan change cancelled');
        await loadSubscriptionData();
      } else {
        showNotification('error', result.error || 'Failed to cancel pending change');
      }
    } catch {
      showNotification('error', 'An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription || !userId) return;
    setActionLoading(true);
    try {
      const result = await cancelSubscription(userId, cancelReason);
      if (result.success) {
        showNotification(
          'success',
          result.message || 'Subscription cancelled',
          result.refundProcessed
            ? `$${result.refundAmount?.toFixed(2)} has been refunded to your payment method.`
            : undefined
        );
        await loadSubscriptionData();
      } else {
        showNotification('error', result.error || 'Failed to cancel subscription');
      }
    } catch {
      showNotification('error', 'An unexpected error occurred');
    } finally {
      setActionLoading(false);
      setShowCancelModal(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const dateOnly = dateString.split('T')[0].split(' ')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    if (!year || !month || !day) return 'N/A';
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentPlanIndex = () => {
    if (!subscription?.subscription_plan) return -1;
    return PLAN_ORDER.indexOf(subscription.subscription_plan as PlanKey);
  };

  const getPlanRelation = (planKey: PlanKey): 'current' | 'upgrade' | 'downgrade' | 'pending' => {
    if (subscription?.pending_subscription_plan === planKey) return 'pending';
    if (subscription?.subscription_plan === planKey) return 'current';
    const currentIdx = getCurrentPlanIndex();
    const targetIdx = PLAN_ORDER.indexOf(planKey);
    if (currentIdx === -1) return 'upgrade';
    return targetIdx > currentIdx ? 'upgrade' : 'downgrade';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
          <p className="text-[#0393d5]">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  const planColor = getPlanColor(subscription?.subscription_plan || null);
  const hasActiveSub = subscription?.subscription_plan && subscription.subscription_plan !== 'none';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="max-w-[1200px] mx-auto px-6 py-12 pt-32 flex-1 w-full">
        {/* Page Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white">Subscription</h2>
          <p className="text-[#0393d5] mt-1">Manage your plan and billing</p>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`mb-6 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
              notification.type === 'success'
                ? 'bg-green-500/15 border border-green-500/30'
                : 'bg-red-500/15 border border-red-500/30'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={notification.type === 'success' ? 'text-green-200 font-medium' : 'text-red-200 font-medium'}>
                {notification.message}
              </p>
              {notification.detail && (
                <p className={`text-sm mt-0.5 ${notification.type === 'success' ? 'text-green-300/70' : 'text-red-300/70'}`}>
                  {notification.detail}
                </p>
              )}
            </div>
            <button onClick={() => setNotification(null)} className="text-white/40 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {hasActiveSub ? (
          <div className="space-y-8">
            {/* Current Plan + Billing Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Plan Card */}
              <div
                className="lg:col-span-2 bg-white/[0.07] backdrop-blur-lg rounded-2xl p-6 border"
                style={{ borderColor: `${planColor}40` }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${planColor}25` }}
                    >
                      <Zap className="w-5 h-5" style={{ color: planColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Current Plan</p>
                      <h3 className="text-xl font-bold text-white">
                        {subscription.planDetails?.name || subscription.subscription_plan}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      ${subscription.monthly_amount?.toFixed(2)}
                    </p>
                    <p className="text-xs text-white/50">per month</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/[0.05] rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-white/40 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[11px] uppercase tracking-wide">Providers</span>
                    </div>
                    <p className="text-white font-semibold text-sm">
                      {subscription.planDetails && 'providers' in subscription.planDetails
                        ? subscription.planDetails.providers
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white/[0.05] rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-white/40 mb-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-[11px] uppercase tracking-wide">Licenses</span>
                    </div>
                    <p className="text-white font-semibold text-sm">
                      Up to {subscription.max_licenses === 9999 ? '∞' : subscription.max_licenses}
                    </p>
                  </div>
                  <div className="bg-white/[0.05] rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-white/40 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[11px] uppercase tracking-wide">Started</span>
                    </div>
                    <p className="text-white font-semibold text-sm">
                      {formatDate(subscription.subscription_start_date)}
                    </p>
                  </div>
                  <div className="bg-white/[0.05] rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-white/40 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[11px] uppercase tracking-wide">Status</span>
                    </div>
                    <p className="text-white font-semibold text-sm capitalize">
                      {subscription.subscription_status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Card */}
              <div className="bg-white/[0.07] backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-4">Billing</p>

                <div className="space-y-4">
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Next billing date</p>
                    <p className="text-white font-semibold">
                      {formatDate(subscription.next_billing_date)}
                    </p>
                  </div>

                  {subscription.payment_method_last4 && (
                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Payment method</p>
                      <p className="text-white font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-white/40" />
                        {subscription.payment_method_brand?.toUpperCase()} ····{' '}
                        {subscription.payment_method_last4}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Monthly total</p>
                    <p className="text-white font-semibold flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      {subscription.monthly_amount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Plan Banner */}
            {subscription.hasPendingChange && subscription.pendingPlanDetails && (
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">Upcoming Plan</p>
                      <h4 className="text-lg font-bold text-white">
                        {subscription.pendingPlanDetails.name}
                      </h4>
                      <p className="text-amber-200/60 text-sm mt-1">
                        Takes effect on <strong className="text-amber-200">{formatDate(subscription.pending_plan_effective_date)}</strong>
                        {' · '}
                        ${subscription.pendingPlanDetails.amount}/mo
                        {' · '}
                        You save ${((subscription.monthly_amount || 0) - subscription.pendingPlanDetails.amount).toFixed(2)}/mo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelPending}
                    disabled={actionLoading}
                    className="text-amber-300/60 hover:text-amber-200 text-sm font-medium transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Cancel Change</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Cancelled Access Banner */}
            {subscription.subscription_status === 'cancelled' && subscription.accessUntil && (
              <div className="bg-orange-500/10 border border-orange-500/25 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <p className="text-orange-200">
                    Your subscription is cancelled. You have access until{' '}
                    <strong>{formatDate(subscription.accessUntil)}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Refund Window */}
            {subscription.isRefundEligible && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-200/80 text-sm">
                  <strong className="text-emerald-200">{subscription.refundDaysRemaining} days</strong> remaining in your refund window.
                  Cancel now for a full refund of ${subscription.monthly_amount?.toFixed(2)}.
                </p>
              </div>
            )}

            {/* All Plans */}
            {subscription.subscription_status === 'active' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Change Plan</h3>
                    <p className="text-white/40 text-sm">
                      Upgrades are immediate. Downgrades take effect at your next billing date.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {PLAN_ORDER.map((planKey) => {
                    const plan = STRIPE_PLANS[planKey];
                    const relation = getPlanRelation(planKey);
                    const color = getPlanColor(planKey);
                    const priceDiff = plan.amount - (subscription.monthly_amount || 0);

                    return (
                      <div
                        key={planKey}
                        className={`relative rounded-xl p-4 border transition-all ${
                          relation === 'current'
                            ? 'bg-white/[0.1] border-white/30 ring-1 ring-white/20'
                            : relation === 'pending'
                            ? 'bg-amber-500/[0.08] border-amber-500/25'
                            : 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                        }`}
                      >
                        {/* Badge */}
                        {relation === 'current' && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white text-[#09264b] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Current
                          </div>
                        )}
                        {relation === 'pending' && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Upcoming
                          </div>
                        )}
                        {planKey === 'professional' && relation !== 'current' && relation !== 'pending' && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5" /> Popular
                          </div>
                        )}

                        <div className="pt-1">
                          {/* Plan Name */}
                          <h4 className="text-sm font-bold text-white mb-0.5 leading-tight">{plan.name}</h4>

                          {/* Price */}
                          <div className="mb-3">
                            <span className="text-2xl font-bold text-white">${plan.amount}</span>
                            <span className="text-white/40 text-xs">/mo</span>
                          </div>

                          {/* Features */}
                          <ul className="space-y-1.5 mb-4">
                            <li className="flex items-center gap-1.5 text-white/60 text-xs">
                              <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                              {plan.providers} Provider{plan.providers === '1-2' ? '' : 's'}
                            </li>
                            <li className="flex items-center gap-1.5 text-white/60 text-xs">
                              <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                              {plan.maxLicenses === 9999 ? 'Unlimited' : `Up to ${plan.maxLicenses}`} licenses
                            </li>
                          </ul>

                          {/* Action Button */}
                          {relation === 'current' ? (
                            <div className="w-full text-center py-2 text-white/30 text-xs font-medium">
                              Your plan
                            </div>
                          ) : relation === 'pending' ? (
                            <div className="w-full text-center py-2 text-amber-400/60 text-xs font-medium">
                              Scheduled
                            </div>
                          ) : subscription.hasPendingChange ? (
                            <div className="w-full text-center py-2 text-white/20 text-xs font-medium">
                              Cancel pending change first
                            </div>
                          ) : relation === 'upgrade' ? (
                            <button
                              onClick={() => setShowChangeModal({ type: 'upgrade', planKey })}
                              disabled={actionLoading}
                              className="w-full bg-gradient-to-r from-[#0393d5] to-[#027bb5] hover:from-[#027bb5] hover:to-[#0393d5] text-white text-xs font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
                            >
                              Upgrade +${priceDiff.toFixed(2)}
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowChangeModal({ type: 'downgrade', planKey })}
                              disabled={actionLoading}
                              className="w-full bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-xs font-semibold py-2 rounded-lg transition-all border border-white/10 disabled:opacity-50"
                            >
                              Downgrade
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cancel Section */}
            {subscription.subscription_status === 'active' && (
              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-400/60 hover:text-red-400 text-sm transition-colors"
                >
                  Cancel subscription
                </button>
              </div>
            )}
          </div>
        ) : (
          /* No Subscription State */
          <div className="bg-white/[0.07] backdrop-blur-lg rounded-2xl p-10 text-center border border-white/10 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-[#0393d5]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CreditCard className="w-8 h-8 text-[#0393d5]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Active Subscription</h3>
            <p className="text-white/50 mb-6">
              Choose a plan to get started with Happy InLine.
            </p>
            <button
              onClick={() => router.push('/subscribe')}
              className="bg-gradient-to-r from-[#0393d5] to-[#027bb5] hover:from-[#027bb5] hover:to-[#0393d5] text-white font-semibold px-8 py-3 rounded-lg transition-all inline-flex items-center gap-2"
            >
              View Plans
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* Upgrade/Downgrade Confirmation Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/15">
            {showChangeModal.type === 'upgrade' ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-[#0393d5]/20 rounded-xl flex items-center justify-center">
                    <ArrowUpCircle className="w-6 h-6 text-[#0393d5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Upgrade Plan</h3>
                    <p className="text-white/50 text-sm">Effective immediately</p>
                  </div>
                </div>

                <div className="bg-white/[0.05] rounded-xl p-4 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Current plan</span>
                    <span className="text-white font-medium text-sm">
                      {subscription?.planDetails && 'name' in subscription.planDetails ? subscription.planDetails.name : subscription?.subscription_plan}
                      {' · '}${subscription?.monthly_amount?.toFixed(2)}/mo
                    </span>
                  </div>
                  <div className="border-t border-white/[0.06]" />
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">New plan</span>
                    <span className="text-white font-semibold text-sm">
                      {STRIPE_PLANS[showChangeModal.planKey].name}
                      {' · '}${STRIPE_PLANS[showChangeModal.planKey].amount}/mo
                    </span>
                  </div>
                </div>

                <div className="bg-[#0393d5]/10 border border-[#0393d5]/20 rounded-lg p-3 mb-5">
                  <p className="text-[#0393d5] text-sm">
                    You&apos;ll be charged a prorated amount for the remainder of this billing period.
                    Your next full charge will be ${STRIPE_PLANS[showChangeModal.planKey].amount}/mo.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <ArrowDownCircle className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Downgrade Plan</h3>
                    <p className="text-white/50 text-sm">Takes effect next billing date</p>
                  </div>
                </div>

                <div className="bg-white/[0.05] rounded-xl p-4 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Current plan</span>
                    <span className="text-white font-medium text-sm">
                      {subscription?.planDetails && 'name' in subscription.planDetails ? subscription.planDetails.name : subscription?.subscription_plan}
                      {' · '}${subscription?.monthly_amount?.toFixed(2)}/mo
                    </span>
                  </div>
                  <div className="border-t border-white/[0.06]" />
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">New plan</span>
                    <span className="text-white font-semibold text-sm">
                      {STRIPE_PLANS[showChangeModal.planKey].name}
                      {' · '}${STRIPE_PLANS[showChangeModal.planKey].amount}/mo
                    </span>
                  </div>
                  <div className="border-t border-white/[0.06]" />
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">You save</span>
                    <span className="text-green-400 font-semibold text-sm">
                      ${((subscription?.monthly_amount || 0) - STRIPE_PLANS[showChangeModal.planKey].amount).toFixed(2)}/mo
                    </span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-5">
                  <p className="text-amber-200/80 text-sm">
                    You&apos;ll keep your current plan until <strong className="text-amber-200">{formatDate(subscription?.next_billing_date)}</strong>.
                    After that, you&apos;ll be charged ${STRIPE_PLANS[showChangeModal.planKey].amount}/mo.
                  </p>
                </div>

                {subscription && subscription.max_licenses &&
                  STRIPE_PLANS[showChangeModal.planKey].maxLicenses < (subscription.license_count || 0) && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5">
                    <p className="text-red-300 text-sm">
                      You currently have {subscription.license_count} active licenses.
                      This plan supports up to {STRIPE_PLANS[showChangeModal.planKey].maxLicenses}.
                      You may need to remove some providers before the change takes effect.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowChangeModal(null)}
                className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-white py-3 rounded-lg transition-all border border-white/10 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  showChangeModal.type === 'upgrade'
                    ? handleUpgrade(showChangeModal.planKey)
                    : handleDowngrade(showChangeModal.planKey)
                }
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${
                  showChangeModal.type === 'upgrade'
                    ? 'bg-gradient-to-r from-[#0393d5] to-[#027bb5] hover:from-[#027bb5] hover:to-[#0393d5] text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : showChangeModal.type === 'upgrade' ? (
                  'Confirm Upgrade'
                ) : (
                  'Schedule Downgrade'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/15">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cancel Subscription</h3>
                <p className="text-white/50 text-sm">This cannot be undone</p>
              </div>
            </div>

            {subscription?.isRefundEligible ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                <p className="text-green-200 text-sm">
                  You&apos;re within your refund window. You&apos;ll receive a full refund of ${subscription.monthly_amount?.toFixed(2)}.
                </p>
              </div>
            ) : (
              <p className="text-white/50 text-sm mb-4">
                Your subscription will remain active until {formatDate(subscription?.next_billing_date)}.
                You won&apos;t be charged again.
              </p>
            )}

            <div className="mb-5">
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">
                Reason for cancelling (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let us know how we can improve..."
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-white py-3 rounded-lg transition-all border border-white/10 font-medium"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

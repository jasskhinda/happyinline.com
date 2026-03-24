import { getSupabaseClient } from './supabase';
import { STRIPE_PLANS, REFUND_DAYS } from './stripe';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  next_billing_date: string | null;
  refund_eligible_until: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  monthly_amount: number | null;
  max_licenses: number | null;
  license_count: number | null;
  payment_method_last4: string | null;
  payment_method_brand: string | null;
  business_name: string | null;
  // Pending plan change (scheduled downgrade)
  pending_subscription_plan: string | null;
  pending_plan_effective_date: string | null;
  // Google Calendar integration
  google_calendar_connected: boolean | null;
  google_calendar_access_token: string | null;
  google_calendar_refresh_token: string | null;
  google_calendar_token_expiry: string | null;
}

export interface SubscriptionStatus extends Profile {
  isActive: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  isRefundEligible: boolean;
  refundDaysRemaining: number;
  planDetails: typeof STRIPE_PLANS[keyof typeof STRIPE_PLANS] | Record<string, never>;
  canUpgrade: boolean;
  canDowngrade: boolean;
  hasPendingChange: boolean;
  pendingPlanDetails: typeof STRIPE_PLANS[keyof typeof STRIPE_PLANS] | null;
  accessUntil: string | null;
}

/**
 * Sign in with email and password
 */
export const signInWithPassword = async (email: string, password: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) {
    console.error('Login error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user, session: data.session };
};

/**
 * Sign out
 */
export const signOut = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Get user profile
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

/**
 * Get subscription status for a user (from profile)
 */
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus | null> => {
  const supabase = getSupabaseClient();

  // Fetch all profile fields to avoid missing column errors
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }

  if (!data) {
    console.error('No profile data found for user:', userId);
    return null;
  }

  // If no subscription plan, return inactive status
  if (!data.subscription_plan) {
    return {
      ...data,
      isActive: false,
      isTrial: false,
      trialDaysRemaining: 0,
      trialEndsAt: null,
      isRefundEligible: false,
      refundDaysRemaining: 0,
      planDetails: {},
      canUpgrade: true,
      canDowngrade: false,
      hasPendingChange: false,
      pendingPlanDetails: null,
      accessUntil: null
    };
  }

  // Calculate refund eligibility
  const refundEligibleUntil = data.refund_eligible_until ? new Date(data.refund_eligible_until) : null;
  const now = new Date();

  let refundDaysRemaining = 0;
  let isRefundEligible = false;

  if (refundEligibleUntil && !isNaN(refundEligibleUntil.getTime())) {
    const diffMs = refundEligibleUntil.getTime() - now.getTime();
    if (diffMs > 0) {
      refundDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isRefundEligible = true;
    }
  }

  // Check for trial status
  let isTrial = data.subscription_status === 'trial';
  let trialDaysRemaining = 0;
  const trialEndsAt = data.trial_ends_at || null;

  if (isTrial && trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    const diffMs = trialEnd.getTime() - now.getTime();
    if (diffMs > 0) {
      trialDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } else {
      // Trial expired
      isTrial = false;
    }
  }

  // Determine if subscription is truly active
  let isActive = data.subscription_status === 'active';

  // Trial accounts are active if trial hasn't expired
  if (isTrial && trialDaysRemaining > 0) {
    isActive = true;
  }

  // Check if cancelled but still within paid period
  if (data.subscription_status === 'cancelled') {
    const endDate = data.subscription_end_date || data.next_billing_date;
    if (endDate && new Date(endDate) > now) {
      isActive = true;
    }
  }

  const planDetails = STRIPE_PLANS[data.subscription_plan as keyof typeof STRIPE_PLANS] || {};

  // Pending plan change (scheduled downgrade)
  const hasPendingChange = !!data.pending_subscription_plan;
  const pendingPlanDetails = data.pending_subscription_plan
    ? STRIPE_PLANS[data.pending_subscription_plan as keyof typeof STRIPE_PLANS] || null
    : null;

  const planOrder: (keyof typeof STRIPE_PLANS)[] = ['basic', 'starter', 'professional', 'enterprise', 'unlimited'];
  const currentPlanIndex = planOrder.indexOf(data.subscription_plan as keyof typeof STRIPE_PLANS);

  return {
    ...data,
    isActive,
    isTrial,
    trialDaysRemaining,
    trialEndsAt,
    isRefundEligible,
    refundDaysRemaining,
    planDetails,
    canUpgrade: (data.subscription_status === 'active' || isTrial) && data.subscription_plan !== 'unlimited',
    canDowngrade: data.subscription_status === 'active' && currentPlanIndex > 0 && !hasPendingChange,
    hasPendingChange,
    pendingPlanDetails,
    accessUntil: isTrial ? trialEndsAt : (data.subscription_end_date || data.next_billing_date)
  };
};

/**
 * Create subscription via Edge Function
 */
export const createSubscription = async ({
  userId,
  email,
  planName,
  paymentMethodId
}: {
  userId: string;
  email: string;
  planName: string;
  paymentMethodId: string;
}) => {
  const supabase = getSupabaseClient();
  const planDetails = STRIPE_PLANS[planName as keyof typeof STRIPE_PLANS];

  if (!planDetails) {
    return { success: false, error: 'Invalid plan selected' };
  }

  const { data, error } = await supabase.functions.invoke('stripe-create-subscription', {
    body: {
      shopId: userId, // Using userId as the identifier
      email,
      planName,
      paymentMethodId,
      amount: planDetails.amount
    }
  });

  if (error) {
    console.error('Subscription creation error:', error);
    return { success: false, error: error.message || 'Failed to create subscription' };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  // If subscription requires additional action (3D Secure), don't update profile yet
  if (data?.requiresAction) {
    return { success: true, requiresAction: true, data };
  }

  // Subscription succeeded - update profile with subscription details
  const now = new Date();
  const refundEligibleUntil = new Date(now.getTime() + REFUND_DAYS * 24 * 60 * 60 * 1000);
  const nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // ~30 days

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_plan: planName,
      subscription_status: 'active',
      subscription_start_date: now.toISOString(),
      next_billing_date: nextBillingDate.toISOString(),
      refund_eligible_until: refundEligibleUntil.toISOString(),
      stripe_customer_id: data.customerId,
      stripe_subscription_id: data.subscriptionId,
      monthly_amount: planDetails.amount,
      max_licenses: planDetails.maxLicenses,
      license_count: 0,
      payment_method_last4: data.paymentMethodLast4 || null,
      payment_method_brand: data.paymentMethodBrand || null,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update profile after subscription:', updateError);
    // Subscription was created in Stripe but profile update failed
    // This is a partial failure state - log for debugging
    return {
      success: true,
      warning: 'Subscription created but profile update failed. Please refresh.',
      data
    };
  }

  return { success: true, data };
};

/**
 * Upgrade subscription via Edge Function
 */
export const upgradeSubscription = async (userId: string, newPlanName: string) => {
  const supabase = getSupabaseClient();

  // Get current subscription details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_plan, stripe_subscription_id, monthly_amount, stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Profile not found' };
  }

  if (!profile.stripe_subscription_id) {
    return {
      success: false,
      requiresNewSubscription: true,
      error: 'You need to set up a payment method first.'
    };
  }

  const newPlanDetails = STRIPE_PLANS[newPlanName as keyof typeof STRIPE_PLANS];
  if (!newPlanDetails) {
    return { success: false, error: 'Invalid plan selected' };
  }

  const { data, error } = await supabase.functions.invoke('stripe-upgrade-subscription', {
    body: {
      userId,
      subscriptionId: profile.stripe_subscription_id,
      newPriceId: newPlanDetails.priceId,
      newPlanName
    }
  });

  if (error) {
    return { success: false, error: error.message || 'Failed to upgrade subscription' };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  // Update profile record
  await supabase
    .from('profiles')
    .update({
      subscription_plan: newPlanName,
      monthly_amount: newPlanDetails.amount,
      max_licenses: newPlanDetails.maxLicenses,
      refund_eligible_until: null, // Clear refund - any plan change forfeits refund window
    })
    .eq('id', userId);

  return {
    success: true,
    newPlan: newPlanName,
    newAmount: newPlanDetails.amount,
    prorationAmount: data.prorationAmount
  };
};

/**
 * Update user profile (name, phone, etc.)
 */
export const updateProfile = async (
  userId: string,
  updates: { name?: string; phone?: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user email (requires re-authentication)
 */
export const updateEmail = async (newEmail: string, redirectPath: string = '/customer/settings'): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // Build the redirect URL for email confirmation
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.happyinline.com';
    const redirectUrl = `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`;

    const { error } = await supabase.auth.updateUser({
      email: newEmail.toLowerCase().trim()
    }, {
      emailRedirectTo: redirectUrl
    });

    if (error) {
      console.error('Error updating email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Error updating password:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Downgrade subscription (scheduled for next billing date via Stripe)
 * Changes Stripe price immediately with no proration; DB plan updates on next renewal webhook
 */
export const downgradeSubscription = async (userId: string, newPlanName: string) => {
  const supabase = getSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_plan, stripe_subscription_id, next_billing_date, pending_subscription_plan')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Profile not found' };
  }

  if (!profile.stripe_subscription_id) {
    return { success: false, error: 'No active subscription found' };
  }

  if (profile.pending_subscription_plan) {
    return { success: false, error: 'You already have a pending plan change. Cancel it first before scheduling a new one.' };
  }

  const newPlanDetails = STRIPE_PLANS[newPlanName as keyof typeof STRIPE_PLANS];
  if (!newPlanDetails) {
    return { success: false, error: 'Invalid plan selected' };
  }

  // Call Stripe edge function with isDowngrade flag (no proration)
  const { data, error } = await supabase.functions.invoke('stripe-upgrade-subscription', {
    body: {
      userId,
      subscriptionId: profile.stripe_subscription_id,
      newPriceId: newPlanDetails.priceId,
      newPlanName,
      isDowngrade: true
    }
  });

  if (error) {
    return { success: false, error: error.message || 'Failed to schedule downgrade' };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  // Store pending plan change — current plan stays until next billing
  await supabase
    .from('profiles')
    .update({
      pending_subscription_plan: newPlanName,
      pending_plan_effective_date: profile.next_billing_date,
      refund_eligible_until: null,
    })
    .eq('id', userId);

  return {
    success: true,
    pendingPlan: newPlanName,
    effectiveDate: profile.next_billing_date,
    message: `Your plan will change to ${newPlanDetails.name} on your next billing date.`
  };
};

/**
 * Cancel a pending downgrade — reverts Stripe subscription back to current plan price
 */
export const cancelPendingDowngrade = async (userId: string) => {
  const supabase = getSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_plan, stripe_subscription_id, pending_subscription_plan')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Profile not found' };
  }

  if (!profile.pending_subscription_plan) {
    return { success: false, error: 'No pending plan change to cancel' };
  }

  // Revert Stripe subscription back to current plan price
  const currentPlanDetails = STRIPE_PLANS[profile.subscription_plan as keyof typeof STRIPE_PLANS];
  if (!currentPlanDetails || !profile.stripe_subscription_id) {
    return { success: false, error: 'Current plan details not found' };
  }

  const { data, error } = await supabase.functions.invoke('stripe-upgrade-subscription', {
    body: {
      userId,
      subscriptionId: profile.stripe_subscription_id,
      newPriceId: currentPlanDetails.priceId,
      newPlanName: profile.subscription_plan,
      isDowngrade: true
    }
  });

  if (error || data?.error) {
    return { success: false, error: error?.message || data?.error || 'Failed to cancel pending change' };
  }

  // Clear pending plan fields
  await supabase
    .from('profiles')
    .update({
      pending_subscription_plan: null,
      pending_plan_effective_date: null,
    })
    .eq('id', userId);

  return { success: true, message: 'Pending plan change has been cancelled.' };
};

/**
 * Cancel subscription via Edge Function
 */
export const cancelSubscription = async (userId: string, reason: string = '') => {
  const supabase = getSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_subscription_id, subscription_plan, refund_eligible_until, monthly_amount')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Profile not found' };
  }

  // If no Stripe subscription, just downgrade locally
  if (!profile.stripe_subscription_id) {
    await supabase
      .from('profiles')
      .update({
        subscription_plan: 'none',
        subscription_status: 'cancelled',
        subscription_end_date: new Date().toISOString(),
        max_licenses: 0,
      })
      .eq('id', userId);

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      refunded: false
    };
  }

  // Check if eligible for refund
  const refundDeadline = profile.refund_eligible_until ? new Date(profile.refund_eligible_until) : null;
  const isRefundEligible = refundDeadline && new Date() < refundDeadline;

  if (isRefundEligible) {
    // Process refund
    const { data: refundData, error: refundError } = await supabase.functions.invoke('stripe-process-refund', {
      body: {
        userId,
        subscriptionId: profile.stripe_subscription_id,
        amount: profile.monthly_amount,
        reason: reason || 'Cancellation within 7-day refund window'
      }
    });

    // Update profile status
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'refunded',
        subscription_end_date: new Date().toISOString()
      })
      .eq('id', userId);

    return {
      success: true,
      isRefundEligible: true,
      refundProcessed: true,
      refundAmount: profile.monthly_amount,
      message: `Your subscription has been cancelled and $${profile.monthly_amount} has been refunded.`
    };
  } else {
    // Cancel at end of billing period
    const { data, error } = await supabase.functions.invoke('stripe-cancel-subscription', {
      body: {
        userId,
        subscriptionId: profile.stripe_subscription_id,
        reason
      }
    });

    if (error) {
      return { success: false, error: error.message || 'Failed to cancel subscription' };
    }

    await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled'
      })
      .eq('id', userId);

    return {
      success: true,
      isRefundEligible: false,
      refundProcessed: false,
      cancelAt: data?.cancelAt,
      message: 'Your subscription has been cancelled. You will retain access until the end of your current billing period.'
    };
  }
};

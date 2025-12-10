'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle,
  Briefcase,
  Crown,
  Star,
  Zap,
  Shield
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  type_count: number;
}

interface BusinessType {
  id: string;
  name: string;
  description: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Category & Business Type
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Subscription Plan
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    monthly: {
      name: 'Monthly',
      price: 29.99,
      period: 'month',
      features: [
        'Unlimited bookings',
        'Customer management',
        'Online payments',
        'Business analytics',
        'Email notifications',
        'Priority support'
      ]
    },
    yearly: {
      name: 'Yearly',
      price: 299.99,
      period: 'year',
      savings: '2 months free!',
      features: [
        'Unlimited bookings',
        'Customer management',
        'Online payments',
        'Business analytics',
        'Email notifications',
        'Priority support',
        '2 months FREE'
      ]
    }
  };

  // Load categories when step 2 is reached
  useEffect(() => {
    if (step === 2) {
      loadCategories();
    }
  }, [step]);

  // Load business types when category is selected
  useEffect(() => {
    if (selectedCategory) {
      loadBusinessTypes(selectedCategory.id);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('get_business_categories');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadBusinessTypes = async (categoryId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('get_business_types_by_category', {
        p_category_id: categoryId
      });

      if (error) {
        console.error('Error loading business types:', error);
        return;
      }

      setBusinessTypes(data || []);
      setSelectedBusinessType(null);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabaseClient();

      // Create the account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: {
          data: {
            name: name,
            role: 'owner',
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Update profile with business details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: name,
          role: 'owner',
          business_name: businessName,
          business_category_id: selectedCategory?.id,
          business_type_id: selectedBusinessType?.id,
          subscription_plan: null,
          subscription_status: null,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Navigate to dashboard
      router.push('/dashboard?registered=true');

    } catch (err: any) {
      console.error('Registration error:', err);

      let errorMessage = 'Something went wrong. Please try again.';
      if (err.message?.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.message?.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = email && name && businessName && password && password === confirmPassword && password.length >= 6;
  const isStep2Valid = selectedCategory && selectedBusinessType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Happy Inline</h1>
          <p className="text-[#0393d5]">Business Registration</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${
                  s <= step ? 'bg-[#0393d5]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 0: Introduction */}
        {step === 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-[#0393d5] rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Join Thousands of Professionals
              </h2>
              <p className="text-[#0393d5]">
                Grow your business with Happy Inline
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                'Manage bookings effortlessly',
                'Accept payments online',
                'Build your client base',
                '7-day money-back guarantee'
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#0393d5]" />
                  <span className="text-white/80">{benefit}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="mt-6 text-center text-white/70 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-[#0393d5] hover:text-white font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Let&apos;s Get Started
            </h2>
            <p className="text-[#0393d5] text-center mb-6">
              Enter your business information
            </p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@yourbusiness.com"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mike Johnson"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Business Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a strong password"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-11 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0393d5]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-[#0393d5] text-sm mt-1">Password must be at least 6 characters</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-11 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0393d5]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className="w-full mt-6 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue to Business Type
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setStep(0)}
              className="w-full mt-3 flex items-center justify-center gap-2 text-white/70 hover:text-white transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* Step 2: Category & Business Type */}
        {step === 2 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              What type of business do you run?
            </h2>
            <p className="text-[#0393d5] text-center mb-6">
              Select your industry to get started
            </p>

            {loadingCategories ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[#0393d5] animate-spin mx-auto mb-3" />
                <p className="text-white/70">Loading categories...</p>
              </div>
            ) : (
              <>
                {/* Category Selection */}
                <h3 className="text-lg font-semibold text-white mb-4">Choose Your Industry</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        selectedCategory?.id === category.id
                          ? 'bg-[#0393d5] border-2 border-[#0393d5]'
                          : 'bg-white/10 border-2 border-transparent hover:border-[#0393d5]/50'
                      }`}
                    >
                      <div className="w-12 h-12 bg-[#09264b] rounded-full flex items-center justify-center mx-auto mb-2">
                        <Briefcase className="w-6 h-6 text-[#0393d5]" />
                      </div>
                      <p className="text-white font-medium text-sm">{category.name}</p>
                      <p className="text-white/50 text-xs">{category.type_count} types</p>
                    </button>
                  ))}
                </div>

                {/* Business Type Selection */}
                {selectedCategory && businessTypes.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-4">Select Your Business Type</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {businessTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedBusinessType(type)}
                          className={`w-full p-4 rounded-lg text-left transition-all flex items-center justify-between ${
                            selectedBusinessType?.id === type.id
                              ? 'bg-[#0393d5]/30 border-2 border-[#0393d5]'
                              : 'bg-white/5 border-2 border-transparent hover:border-[#0393d5]/30'
                          }`}
                        >
                          <div>
                            <p className="text-white font-medium">{type.name}</p>
                            <p className="text-white/50 text-sm">{type.description}</p>
                          </div>
                          {selectedBusinessType?.id === type.id && (
                            <Check className="w-5 h-5 text-[#0393d5]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!isStep2Valid}
              className="w-full mt-6 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue to Subscription
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full mt-3 flex items-center justify-center gap-2 text-white/70 hover:text-white transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* Step 3: Subscription Plan Selection */}
        {step === 3 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#0393d5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Choose Your Plan
              </h2>
              <p className="text-[#0393d5]">
                Start your 7-day free trial today
              </p>
            </div>

            {/* 7-Day Guarantee Badge */}
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-6 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-green-300 text-sm font-medium">7-Day Money Back Guarantee</span>
            </div>

            {/* Plan Cards */}
            <div className="space-y-4 mb-6">
              {/* Monthly Plan */}
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`w-full p-5 rounded-xl text-left transition-all border-2 ${
                  selectedPlan === 'monthly'
                    ? 'bg-[#0393d5]/20 border-[#0393d5]'
                    : 'bg-white/5 border-transparent hover:border-[#0393d5]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-[#0393d5]" />
                    <span className="text-white font-semibold text-lg">Monthly</span>
                  </div>
                  {selectedPlan === 'monthly' && (
                    <Check className="w-6 h-6 text-[#0393d5]" />
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-white">${plans.monthly.price}</span>
                  <span className="text-white/60">/month</span>
                </div>
                <p className="text-white/60 text-sm">Billed monthly, cancel anytime</p>
              </button>

              {/* Yearly Plan */}
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`w-full p-5 rounded-xl text-left transition-all border-2 relative ${
                  selectedPlan === 'yearly'
                    ? 'bg-[#0393d5]/20 border-[#0393d5]'
                    : 'bg-white/5 border-transparent hover:border-[#0393d5]/50'
                }`}
              >
                {/* Popular Badge */}
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-white font-semibold text-lg">Yearly</span>
                  </div>
                  {selectedPlan === 'yearly' && (
                    <Check className="w-6 h-6 text-[#0393d5]" />
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-white">${plans.yearly.price}</span>
                  <span className="text-white/60">/year</span>
                </div>
                <p className="text-green-400 text-sm font-medium">Save $59.89 - 2 months FREE!</p>
              </button>
            </div>

            {/* Features List */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h3 className="text-white font-semibold mb-3">All plans include:</h3>
              <div className="grid grid-cols-2 gap-2">
                {plans.monthly.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#0393d5]" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Continue to Review
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-3 flex items-center justify-center gap-2 text-white/70 hover:text-white transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#0393d5] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Review Your Information
              </h2>
              <p className="text-[#0393d5]">
                Make sure everything looks good
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-5 space-y-4 mb-6">
              <div>
                <p className="text-white/50 text-sm">Business Name</p>
                <p className="text-white font-medium">{businessName}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Industry</p>
                <p className="text-white font-medium">{selectedCategory?.name}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Business Type</p>
                <p className="text-white font-medium">{selectedBusinessType?.name}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Owner Name</p>
                <p className="text-white font-medium">{name}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Business Email</p>
                <p className="text-white font-medium">{email}</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-white/50 text-sm">Subscription Plan</p>
                <p className="text-white font-medium">
                  {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} - ${plans[selectedPlan].price}/{plans[selectedPlan].period}
                </p>
                {selectedPlan === 'yearly' && (
                  <p className="text-green-400 text-sm">Saving $59.89 per year!</p>
                )}
              </div>
            </div>

            <div className="bg-[#0393d5]/10 border border-[#0393d5]/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#0393d5] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm">7-Day Money Back Guarantee</p>
                  <p className="text-white/70 text-sm">
                    Try Happy Inline risk-free. If you&apos;re not satisfied within 7 days, get a full refund.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <Check className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={() => setStep(3)}
              disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 text-white/70 hover:text-white transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Subscription
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-white/50 text-xs">
          &copy; {new Date().getFullYear()} Happy Inline. All rights reserved.
        </p>
      </div>
    </div>
  );
}

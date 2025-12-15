'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import {
  Store,
  Loader2,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn
} from 'lucide-react';

interface ShopData {
  id: string;
  name: string;
  logo_url: string | null;
}

export default function CustomerLoginPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (shopId) {
      loadShop();
    }
  }, [shopId]);

  const loadShop = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from('shops')
        .select('id, name, logo_url, status')
        .eq('id', shopId)
        .single();

      if (fetchError || !data || data.status !== 'approved') {
        router.push(`/join/${shopId}`);
        return;
      }

      setShop(data);
    } catch (err) {
      console.error('Error:', err);
      router.push(`/join/${shopId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseClient();

      // Sign in the user
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!authData.user) {
        throw new Error('Failed to sign in');
      }

      // Check if user already has an exclusive_shop_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, exclusive_shop_id')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      // If user doesn't have an exclusive_shop_id, set it to this shop
      // This links the existing customer to this shop
      if (profile && !profile.exclusive_shop_id) {
        await supabase
          .from('profiles')
          .update({
            role: 'customer',
            exclusive_shop_id: shopId,
          })
          .eq('id', authData.user.id);
      }

      // Check if user is already linked to a different shop
      if (profile?.exclusive_shop_id && profile.exclusive_shop_id !== shopId) {
        // User is already linked to another shop
        // Still let them log in, but they'll see their original shop
        console.log('User already linked to another shop:', profile.exclusive_shop_id);
      }

      // Redirect based on role
      if (profile?.role === 'owner') {
        router.push('/dashboard');
      } else if (profile?.role === 'barber') {
        router.push('/provider');
      } else {
        router.push('/customer');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0393d5] animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link
            href={`/join/${shopId}`}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0393d5] flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Sign in to</p>
              <p className="font-semibold text-gray-900">{shop.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-600 mb-6">
          Sign in to your account to book appointments
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0393d5] focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0393d5] focus:border-transparent outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#0393d5] text-white py-4 rounded-lg font-semibold hover:bg-[#027bb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Create Account Link */}
        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link
            href={`/join/${shopId}/signup`}
            className="text-[#0393d5] font-semibold hover:underline"
          >
            Create Account
          </Link>
        </p>

        {/* Forgot Password */}
        <p className="text-center mt-4">
          <Link
            href="/forgot-password"
            className="text-sm text-gray-500 hover:text-[#0393d5]"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}

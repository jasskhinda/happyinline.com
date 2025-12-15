'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import {
  Store,
  MapPin,
  Phone,
  Star,
  Calendar,
  Shield,
  Clock,
  Bell,
  Loader2,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface ShopData {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  status: string;
}

export default function JoinShopPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shopId) {
      loadShop();
    }
  }, [shopId]);

  const loadShop = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      const { data, error: fetchError } = await supabase
        .from('shops')
        .select('id, name, description, address, city, state, phone, logo_url, cover_image_url, rating, total_reviews, is_verified, status')
        .eq('id', shopId)
        .single();

      if (fetchError) {
        console.error('Error fetching shop:', fetchError);
        setError('Shop not found');
        return;
      }

      if (data.status !== 'approved') {
        setError('This shop is not currently accepting new customers');
        return;
      }

      setShop(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The shop you\'re looking for doesn\'t exist or is no longer available.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#0393d5] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#027bb5] transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Cover Image */}
      <div className="relative">
        {shop.cover_image_url ? (
          <div className="h-48 md:h-64 w-full">
            <img
              src={shop.cover_image_url}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
          </div>
        ) : (
          <div className="h-48 md:h-64 w-full bg-gradient-to-br from-[#0393d5] to-[#09264b]" />
        )}

        {/* Logo */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-[#0393d5] flex items-center justify-center">
              <Store className="w-16 h-16 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Shop Info */}
      <div className="pt-20 pb-6 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{shop.name}</h1>
          {shop.is_verified && (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
        </div>

        {shop.rating > 0 && (
          <div className="flex items-center justify-center gap-1 mb-4">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-gray-900">{shop.rating.toFixed(1)}</span>
            <span className="text-gray-500">({shop.total_reviews} reviews)</span>
          </div>
        )}

        {(shop.city || shop.address) && (
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
            <MapPin className="w-4 h-4" />
            <span>{shop.city ? `${shop.city}${shop.state ? `, ${shop.state}` : ''}` : shop.address}</span>
          </div>
        )}

        {shop.phone && (
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
            <Phone className="w-4 h-4" />
            <span>{shop.phone}</span>
          </div>
        )}

        {shop.description && (
          <p className="text-gray-600 max-w-md mx-auto mb-6">{shop.description}</p>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-white py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-[#0393d5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#0393d5]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Start Booking Today</h2>
          <p className="text-gray-600 mb-6">
            Create your account to book appointments at {shop.name}
          </p>

          {/* Create Account Button */}
          <Link
            href={`/join/${shopId}/signup`}
            className="w-full flex items-center justify-center gap-2 bg-[#0393d5] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#027bb5] transition-colors mb-4"
          >
            Create Account
            <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Sign In Button */}
          <Link
            href={`/join/${shopId}/login`}
            className="w-full flex items-center justify-center gap-2 border-2 border-[#0393d5] text-[#0393d5] py-4 px-6 rounded-xl font-semibold hover:bg-[#0393d5]/5 transition-colors"
          >
            Already have an account? Sign In
          </Link>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Secure & Private</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Instant Booking</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Real-time Updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 px-4 text-center border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Powered by <span className="font-semibold text-[#0393d5]">Happy InLine</span>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getSubscriptionStatus, SubscriptionStatus, getProfile } from '@/lib/auth';
import { STRIPE_PLANS, getPlanColor } from '@/lib/stripe';
import { getMyShop, Shop } from '@/lib/shop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  User,
  CreditCard,
  Calendar,
  Users,
  ArrowUpCircle,
  XCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  Building2,
  Store,
  Scissors,
  CalendarDays,
  Settings,
  Plus,
  Gift,
  AlertTriangle,
  QrCode,
  Eye,
  MessageSquare
} from 'lucide-react';
import ShopQRCodeModal from '@/components/ShopQRCodeModal';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showShopCreatedMessage, setShowShopCreatedMessage] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadData();

    // Check if user just subscribed
    if (searchParams.get('subscribed') === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
    // Check if shop was just created
    if (searchParams.get('shop_created') === 'true') {
      setShowShopCreatedMessage(true);
      setTimeout(() => setShowShopCreatedMessage(false), 5000);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check user role - redirect to appropriate dashboard
      const profile = await getProfile(user.id);
      if (profile?.role === 'super_admin') {
        router.push('/admin');
        return;
      }
      if (profile?.role === 'customer') {
        router.push('/customer');
        return;
      }
      // Owners and providers can access dashboard directly

      const subStatus = await getSubscriptionStatus(user.id);
      setSubscription(subStatus);

      // Load shop if subscription is active
      if (subStatus?.isActive) {
        const { shop: userShop } = await getMyShop(user.id);
        setShop(userShop || null);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    // Handle ISO timestamps (T separator), Postgres timestamps (space separator), and date-only strings
    const dateOnly = dateString.split('T')[0].split(' ')[0]; // Get just the date part
    const [year, month, day] = dateOnly.split('-').map(Number);
    if (!year || !month || !day) return 'N/A';
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
          <p className="text-[#0393d5]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-8 lg:px-12 py-8 pt-32 flex-1">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {subscription?.name || 'Business Owner'}!
          </h2>
          <p className="text-[#0393d5]">
            Manage your business settings
          </p>
        </div>

        {/* Success Message - Subscription */}
        {showSuccessMessage && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 text-green-200 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <p className="font-semibold">Welcome to Happy Inline!</p>
              <p className="text-sm text-green-300">Your subscription is now active. You can start adding providers and managing your business.</p>
            </div>
          </div>
        )}

        {/* Success Message - Shop Created */}
        {showShopCreatedMessage && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 text-green-200 flex items-center gap-3">
            <Store className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <p className="font-semibold">Business Created Successfully!</p>
              <p className="text-sm text-green-300">Now add your services and providers to get started.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-200">
            {error}
          </div>
        )}

        {/* Trial Banner, Trial Expired Banner, and Unlock Features Banner temporarily hidden for Apple review */}

        {/* Business Management Navigation - Only show if subscribed */}
        {subscription?.isActive && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Business Management</h3>

            {shop ? (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <button
                  onClick={() => router.push('/shop/settings')}
                  className="flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/10"
                >
                  <div className="w-12 h-12 bg-[#0393d5]/20 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6 text-[#0393d5]" />
                  </div>
                  <span className="text-white font-medium text-sm">Shop Settings</span>
                </button>

                <button
                  onClick={() => router.push('/providers')}
                  className="flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/10"
                >
                  <div className="w-12 h-12 bg-[#0393d5]/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#0393d5]" />
                  </div>
                  <span className="text-white font-medium text-sm">Providers</span>
                  <span className="text-[#0393d5] text-xs">
                    Team
                  </span>
                </button>

                <button
                  onClick={() => router.push('/services')}
                  className="flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/10"
                >
                  <div className="w-12 h-12 bg-[#0393d5]/20 rounded-full flex items-center justify-center">
                    <Scissors className="w-6 h-6 text-[#0393d5]" />
                  </div>
                  <span className="text-white font-medium text-sm">Services</span>
                </button>

                <button
                  onClick={() => router.push('/bookings')}
                  className="flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/10"
                >
                  <div className="w-12 h-12 bg-[#0393d5]/20 rounded-full flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-[#0393d5]" />
                  </div>
                  <span className="text-white font-medium text-sm">Bookings</span>
                </button>

                <button
                  onClick={() => router.push('/messages')}
                  className="flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/10"
                >
                  <div className="w-12 h-12 bg-[#0393d5]/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-[#0393d5]" />
                  </div>
                  <span className="text-white font-medium text-sm">Messages</span>
                </button>

                <button
                  onClick={() => window.open(`/store/${shop.id}`, '_blank')}
                  className="flex flex-col items-center gap-2 bg-gradient-to-br from-[#0393d5]/20 to-green-500/20 hover:from-[#0393d5]/30 hover:to-green-500/30 rounded-xl p-4 transition-all border border-[#0393d5]/30"
                >
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-white font-medium text-sm">View Store</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-[#0393d5]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-[#0393d5]" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Create Your Business</h4>
                <p className="text-[#0393d5] mb-4 text-sm">
                  Set up your business to start managing providers, services, and bookings.
                </p>
                <button
                  onClick={() => router.push('/shop/create')}
                  className="inline-flex items-center gap-2 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold px-6 py-3 rounded-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Business
                </button>
              </div>
            )}

            {/* Shop Status Banner */}
            {shop && shop.status !== 'approved' && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-200 text-sm">
                  <strong>Shop Status:</strong> {shop.status === 'draft' ? 'Draft - Complete your setup and submit for review' : shop.status === 'pending_review' ? 'Pending Review - We\'ll review your business soon' : shop.status}
                </p>
              </div>
            )}

            {/* Share QR Code Banner - Only for approved shops */}
            {shop && shop.status === 'approved' && (
              <div className="mt-4 bg-gradient-to-r from-[#0393d5]/20 to-green-500/20 border border-[#0393d5]/30 rounded-lg p-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-white font-semibold mb-1">Your shop is approved!</h4>
                    <p className="text-[#0393d5] text-sm">
                      Share your QR code with customers so they can book appointments
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="flex items-center gap-2 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold px-6 py-3 rounded-lg transition-all"
                  >
                    <QrCode className="w-5 h-5" />
                    Share QR Code
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <User className="w-6 h-6 text-[#0393d5]" />
              Profile
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-[#0393d5] text-sm mb-1">Name</p>
                <p className="text-white">{subscription?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[#0393d5] text-sm mb-1">Email</p>
                <p className="text-white">{subscription?.email || 'N/A'}</p>
              </div>
              {subscription?.business_name && (
                <div>
                  <p className="text-[#0393d5] text-sm mb-1">Business</p>
                  <p className="text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0393d5]" />
                    {subscription.business_name}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[#0393d5] text-sm mb-1">Account Type</p>
                <p className="text-white capitalize">{subscription?.role || 'Customer'}</p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-[#0393d5] py-2.5 rounded-lg transition-all border border-white/10"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {/* QR Code Modal */}
      {shop && (
        <ShopQRCodeModal
          visible={showQRModal}
          onClose={() => setShowQRModal(false)}
          shopId={shop.id}
          shopName={shop.name}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
            <p className="text-[#0393d5]">Loading your dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

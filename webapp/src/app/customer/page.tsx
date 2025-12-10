'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getProfile, signOut } from '@/lib/auth';
import { getActiveShops, getCategories, ShopPublic, Category } from '@/lib/customer';
import {
  Search,
  MapPin,
  Star,
  Clock,
  LogOut,
  Loader2,
  Store,
  Calendar,
  User,
  ChevronRight,
  BadgeCheck,
  Grid3X3
} from 'lucide-react';

export default function CustomerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [shops, setShops] = useState<ShopPublic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    searchShops();
  }, [searchQuery, selectedCategory]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const profile = await getProfile(user.id);

      // Redirect owners to owner dashboard
      if (profile?.role === 'owner') {
        router.push('/dashboard');
        return;
      }

      setUserName(profile?.name || 'Customer');

      // Load categories
      const catResult = await getCategories();
      if (catResult.success && catResult.categories) {
        setCategories(catResult.categories);
      }

      // Load shops
      await searchShops();
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchShops = async () => {
    const result = await getActiveShops({
      search: searchQuery || undefined,
      categoryId: selectedCategory || undefined,
      limit: 20
    });

    if (result.success && result.shops) {
      setShops(result.shops);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isShopOpen = (shop: ShopPublic) => {
    if (shop.is_manually_closed) return false;

    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    if (!shop.operating_days?.includes(dayName)) return false;

    if (shop.opening_time && shop.closing_time) {
      const currentTime = now.toTimeString().slice(0, 5);
      return currentTime >= shop.opening_time && currentTime <= shop.closing_time;
    }

    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
          <p className="text-[#0393d5]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b]">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-white">Happy Inline</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/customer/bookings')}
                className="flex items-center gap-2 text-[#0393d5] hover:text-white transition-colors"
              >
                <Calendar className="w-5 h-5" />
                My Bookings
              </button>
              <button
                onClick={() => router.push('/customer/profile')}
                className="flex items-center gap-2 text-[#0393d5] hover:text-white transition-colors"
              >
                <User className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-[#0393d5] hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Welcome & Search */}
          <div className="mb-4">
            <h2 className="text-xl text-white mb-1">Hello, {userName}!</h2>
            <p className="text-[#0393d5] text-sm">Find and book services near you</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search businesses, services, or locations..."
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-[#0393d5]" />
              Browse by Category
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  !selectedCategory
                    ? 'bg-[#0393d5] text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#0393d5] text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shops Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#0393d5]" />
            {selectedCategory ? 'Filtered Results' : 'Popular Businesses'}
          </h3>

          {shops.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Store className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-white mb-2">No businesses found</h4>
              <p className="text-[#0393d5]">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => {
                const isOpen = isShopOpen(shop);
                return (
                  <button
                    key={shop.id}
                    onClick={() => router.push(`/customer/shop/${shop.id}`)}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden hover:border-[#0393d5]/50 transition-all text-left group"
                  >
                    {/* Cover Image */}
                    <div className="h-32 bg-gradient-to-br from-[#0393d5]/30 to-purple-500/30 relative">
                      {shop.cover_image_url && (
                        <img
                          src={shop.cover_image_url}
                          alt={shop.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Status Badge */}
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                        isOpen ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                      }`}>
                        {isOpen ? 'Open' : 'Closed'}
                      </div>
                      {/* Logo */}
                      <div className="absolute -bottom-6 left-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur border-2 border-white/30 overflow-hidden flex items-center justify-center">
                          {shop.logo_url ? (
                            <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-7 h-7 text-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-8">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-white font-semibold text-lg group-hover:text-[#0393d5] transition-colors line-clamp-1">
                          {shop.name}
                        </h4>
                        {shop.is_verified && (
                          <BadgeCheck className="w-5 h-5 text-[#0393d5] flex-shrink-0" />
                        )}
                      </div>

                      {shop.city && (
                        <p className="text-[#0393d5] text-sm flex items-center gap-1 mb-2">
                          <MapPin className="w-4 h-4" />
                          {shop.city}{shop.state ? `, ${shop.state}` : ''}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-white text-sm font-medium">
                              {shop.rating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-white/50 text-xs">
                              ({shop.total_reviews || 0})
                            </span>
                          </div>

                          {/* Hours */}
                          {shop.opening_time && shop.closing_time && (
                            <div className="flex items-center gap-1 text-white/60 text-xs">
                              <Clock className="w-3 h-3" />
                              {shop.opening_time} - {shop.closing_time}
                            </div>
                          )}
                        </div>

                        <ChevronRight className="w-5 h-5 text-[#0393d5] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

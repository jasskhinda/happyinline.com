'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getProfile } from '@/lib/auth';
import { getCustomerLinkedShop, getCustomerBookings, ShopPublic, CustomerBooking } from '@/lib/customer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  MapPin,
  Phone,
  Clock,
  Loader2,
  Store,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Smartphone,
  QrCode,
  CalendarDays
} from 'lucide-react';

export default function CustomerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [shop, setShop] = useState<ShopPublic | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<CustomerBooking[]>([]);
  const [hasLinkedShop, setHasLinkedShop] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

      // Get customer's linked shop
      const shopResult = await getCustomerLinkedShop(user.id);
      if (shopResult.success && shopResult.shop) {
        setShop(shopResult.shop);
        setHasLinkedShop(true);

        // Get upcoming bookings
        const bookingsResult = await getCustomerBookings(user.id, 'upcoming');
        if (bookingsResult.success && bookingsResult.bookings) {
          setUpcomingBookings(bookingsResult.bookings.slice(0, 3)); // Show max 3
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-green-400 bg-green-500/20 px-2 py-1 rounded-full text-xs">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full text-xs">
            <AlertCircle className="w-3 h-3" /> Pending
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full text-xs">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-gray-400 bg-gray-500/20 px-2 py-1 rounded-full text-xs">
            <XCircle className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--brand)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--brand)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-dark)] flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 pt-32 flex-1 w-full">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Hello, {userName}!</h2>
          <p className="text-[var(--brand)]">
            {hasLinkedShop ? 'Welcome to your shop' : 'Get started with the mobile app'}
          </p>
        </div>

        {hasLinkedShop && shop ? (
          <>
            {/* My Shop Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden mb-6">
              {/* Shop Header */}
              <div className="h-32 bg-gradient-to-br from-[var(--brand)]/30 to-purple-500/30 relative">
                {shop.cover_image_url && (
                  <img
                    src={shop.cover_image_url}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isShopOpen(shop) ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {isShopOpen(shop) ? 'Open Now' : 'Closed'}
                </div>
                {/* Logo */}
                <div className="absolute -bottom-8 left-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-4 border-white/30 overflow-hidden flex items-center justify-center">
                    {shop.logo_url ? (
                      <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-10 h-10 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Shop Info */}
              <div className="p-6 pt-12">
                <h3 className="text-2xl font-bold text-white mb-2">{shop.name}</h3>

                {shop.description && (
                  <p className="text-white/70 text-sm mb-4">{shop.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shop.address && (
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <MapPin className="w-4 h-4 text-[var(--brand)]" />
                      {shop.address}, {shop.city}
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Phone className="w-4 h-4 text-[var(--brand)]" />
                      {shop.phone}
                    </div>
                  )}
                  {shop.opening_time && shop.closing_time && (
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Clock className="w-4 h-4 text-[var(--brand)]" />
                      {shop.opening_time} - {shop.closing_time}
                    </div>
                  )}
                </div>

                {/* Book Now Button - Links to mobile app */}
                <div className="mt-6 p-4 bg-[var(--brand)]/10 rounded-xl border border-[var(--brand)]/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Smartphone className="w-6 h-6 text-[var(--brand)]" />
                    <span className="text-white font-medium">Book via Mobile App</span>
                  </div>
                  <p className="text-white/60 text-sm">
                    Use the Happy InLine mobile app to book appointments, select services, and choose your preferred provider.
                  </p>
                </div>
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[var(--brand)]" />
                Upcoming Bookings
              </h3>

              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/60">No upcoming bookings</p>
                  <p className="text-white/40 text-sm mt-1">Book via the mobile app</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium">
                            {booking.services?.map((s: any) => s.name).join(', ') || 'Service'}
                          </p>
                          <p className="text-white/60 text-sm">
                            {new Date(booking.appointment_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })} at {booking.appointment_time}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      {booking.barber && (
                        <p className="text-[var(--brand)] text-sm">
                          with {booking.barber.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => router.push('/customer/bookings')}
                className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg transition-all border border-white/10 text-sm"
              >
                View All Bookings
              </button>
            </div>
          </>
        ) : (
          /* No Linked Shop - Show instructions */
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="w-20 h-20 bg-[var(--brand)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-[var(--brand)]" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">
              No Shop Connected
            </h3>

            <p className="text-white/70 mb-6 max-w-md mx-auto">
              To get started, download the Happy InLine mobile app and scan your business's QR code.
              This will connect you to your shop and allow you to book appointments.
            </p>

            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <h4 className="text-white font-medium mb-4">How to connect:</h4>
              <ol className="text-left text-white/70 space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-[var(--brand)] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">1</span>
                  Download Happy InLine from the App Store or Google Play
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-[var(--brand)] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">2</span>
                  Visit your local shop and scan their QR code
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-[var(--brand)] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">3</span>
                  Sign in with this account to connect
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-[var(--brand)] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">4</span>
                  Start booking appointments!
                </li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 px-4 py-2 rounded-full text-sm border border-white/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                App Store
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 px-4 py-2 rounded-full text-sm border border-white/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                </svg>
                Google Play
              </span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

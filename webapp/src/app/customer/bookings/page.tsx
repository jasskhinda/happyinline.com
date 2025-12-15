'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getProfile } from '@/lib/auth';
import { getCustomerBookings, cancelCustomerBooking, CustomerBooking } from '@/lib/customer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Store,
  User,
  X,
  AlertCircle,
  Check,
  XCircle,
  CheckCircle,
  DollarSign,
  Phone
} from 'lucide-react';

type TabType = 'upcoming' | 'completed' | 'cancelled';

export default function CustomerBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CustomerBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();

    // Check for success query parameter (from new booking)
    if (searchParams.get('success') === 'true') {
      setSuccess('Booking created successfully! You will receive a confirmation soon.');
      // Clear the URL parameter
      router.replace('/customer/bookings');
      setTimeout(() => setSuccess(''), 5000);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadBookings();
    }
  }, [activeTab, userId]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const profile = await getProfile(user.id);
      if (profile?.role === 'owner') {
        router.push('/dashboard');
        return;
      }

      setUserId(user.id);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!userId) return;

    const result = await getCustomerBookings(userId, activeTab);
    if (result.success && result.bookings) {
      setBookings(result.bookings);
    }
  };

  const handleCancelClick = (booking: CustomerBooking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking || !userId) return;

    setCancelling(true);
    setError('');

    try {
      const result = await cancelCustomerBooking(selectedBooking.id, userId);
      if (result.success) {
        setSuccess('Booking cancelled successfully');
        setShowCancelModal(false);
        setSelectedBooking(null);
        loadBookings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to cancel booking');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/20 text-white border-white/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 pt-32 flex-1 w-full">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-white mb-6">My Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['upcoming', 'completed', 'cancelled'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-[#0393d5] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Success Message */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-200">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Calendar className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No {activeTab} bookings</h3>
            <p className="text-[#0393d5] mb-6">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming appointments"
                : activeTab === 'completed'
                ? "You haven't completed any appointments yet"
                : "You don't have any cancelled bookings"}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => router.push('/customer')}
                className="inline-flex items-center gap-2 bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                <Store className="w-5 h-5" />
                Browse Businesses
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden"
              >
                {/* Booking Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0393d5]/20 flex items-center justify-center overflow-hidden">
                      {booking.shop?.logo_url ? (
                        <img src={booking.shop.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-[#0393d5]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{booking.shop?.name || 'Unknown Shop'}</h4>
                      <p className="text-[#0393d5] text-sm">Booking #{booking.booking_id}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>

                {/* Booking Details */}
                <div className="p-4 space-y-3">
                  {/* Date & Time */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-4 h-4 text-[#0393d5]" />
                      <span>{formatDate(booking.appointment_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Clock className="w-4 h-4 text-[#0393d5]" />
                      <span>{formatTime(booking.appointment_time)}</span>
                    </div>
                  </div>

                  {/* Location */}
                  {booking.shop?.address && (
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <MapPin className="w-4 h-4 text-[#0393d5]" />
                      <span>{booking.shop.address}, {booking.shop.city}</span>
                    </div>
                  )}

                  {/* Provider */}
                  {booking.barber && (
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <User className="w-4 h-4 text-[#0393d5]" />
                      <span>Provider: {booking.barber.name}</span>
                    </div>
                  )}

                  {/* Services */}
                  {booking.services && booking.services.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-[#0393d5] text-xs font-medium mb-2">Services</p>
                      {booking.services.map((service: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className="text-white">{service.name || service}</span>
                          {service.price && <span className="text-white/70">${service.price}</span>}
                        </div>
                      ))}
                      <div className="border-t border-white/10 mt-2 pt-2 flex justify-between text-white font-semibold">
                        <span>Total</span>
                        <span>${booking.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Shop Phone */}
                  {booking.shop?.phone && (
                    <a
                      href={`tel:${booking.shop.phone}`}
                      className="flex items-center gap-2 text-[#0393d5] text-sm hover:text-white transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {booking.shop.phone}
                    </a>
                  )}
                </div>

                {/* Actions */}
                {(booking.status === 'pending' || booking.status === 'approved') && (
                  <div className="p-4 border-t border-white/10">
                    <button
                      onClick={() => handleCancelClick(booking)}
                      className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Cancel Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Cancel Booking</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-white mb-2">Are you sure you want to cancel this booking?</p>
                <p className="text-[#0393d5] text-sm">
                  {selectedBooking.shop?.name} on {formatDate(selectedBooking.appointment_date)} at {formatTime(selectedBooking.appointment_time)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Booking'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

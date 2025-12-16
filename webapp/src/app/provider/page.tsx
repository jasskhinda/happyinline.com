'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getProfile } from '@/lib/auth';
import { getProviderBookings, updateBookingStatus, rescheduleBooking, Shop, Booking } from '@/lib/shop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Check,
  X,
  AlertCircle,
  Store,
  CalendarDays,
  CheckCircle,
  XCircle,
  Filter,
  CalendarClock
} from 'lucide-react';

export default function ProviderDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Action states
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Reschedule modal state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleBookingData, setRescheduleBookingData] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, dateFilter]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Get profile to check role
      const profile = await getProfile(user.id);
      if (!profile) {
        router.push('/login');
        return;
      }

      setUserName(profile.name || 'Provider');

      // If user is an owner, redirect to dashboard
      if (profile.role === 'owner') {
        router.push('/dashboard');
        return;
      }

      // If user is a customer, redirect to customer page
      if (profile.role === 'customer') {
        router.push('/customer');
        return;
      }

      // Get provider bookings
      const filters: { status?: string; date?: string } = {};
      if (statusFilter) filters.status = statusFilter;
      if (dateFilter) filters.date = dateFilter;

      const result = await getProviderBookings(user.id, filters);

      if (!result.success) {
        setError(result.error || 'Failed to load bookings');
        setLoading(false);
        return;
      }

      setShop(result.shop || null);
      setBookings(result.bookings || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    setProcessingBookingId(bookingId);
    setError('');

    try {
      const result = await updateBookingStatus(bookingId, newStatus);

      if (result.success) {
        setSuccess(`Booking ${newStatus} successfully!`);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to update booking');
      }
    } catch (err) {
      setError('Failed to update booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const openRescheduleModal = (booking: Booking) => {
    setRescheduleBookingData(booking);
    setNewDate(booking.appointment_date);
    setNewTime(booking.appointment_time);
    setRescheduleModalOpen(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleBookingData || !newDate || !newTime) return;

    setRescheduling(true);
    setError('');

    try {
      const result = await rescheduleBooking(rescheduleBookingData.id, newDate, newTime);

      if (result.success) {
        setSuccess('Appointment rescheduled successfully!');
        setRescheduleModalOpen(false);
        setRescheduleBookingData(null);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to reschedule appointment');
      }
    } catch (err) {
      setError('Failed to reschedule appointment');
    } finally {
      setRescheduling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400';
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
      case 'no_show':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-white/10 text-white/70';
    }
  };

  // Group bookings by date
  const groupedBookings = bookings.reduce((acc, booking) => {
    const date = booking.appointment_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.appointment_date === todayStr);
  const upcomingBookings = bookings.filter(b => b.appointment_date > todayStr);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
          <p className="text-[#0393d5]">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 pt-32 flex-1 w-full">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {userName}!
          </h1>
          {shop && (
            <div className="flex items-center gap-2 text-[#0393d5]">
              <Store className="w-5 h-5" />
              <span>{shop.name}</span>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-200">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">{pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0393d5]/20 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-[#0393d5]" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Today</p>
                <p className="text-2xl font-bold text-white">{todayBookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Upcoming</p>
                <p className="text-2xl font-bold text-white">{upcomingBookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-white">
              <Filter className="w-5 h-5 text-[#0393d5]" />
              <span className="font-medium">Filters:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#0393d5]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#0393d5]"
            />

            {(statusFilter || dateFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setDateFilter('');
                }}
                className="px-4 py-2 text-[#0393d5] hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Your Bookings</h3>
            <p className="text-[#0393d5] text-sm mt-1">
              Manage your assigned appointments
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-white mb-2">No Bookings Yet</h4>
              <p className="text-[#0393d5]">
                {statusFilter || dateFilter
                  ? 'No bookings match your filters'
                  : 'You don\'t have any bookings assigned yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {Object.entries(groupedBookings).map(([date, dateBookings]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="bg-white/5 px-6 py-3">
                    <p className="text-[#0393d5] font-medium">
                      {date === todayStr ? 'Today' : formatDate(date)}
                    </p>
                  </div>

                  {/* Bookings for this date */}
                  {dateBookings.map((booking) => (
                    <div key={booking.id} className="p-6 flex items-start gap-4 flex-wrap">
                      {/* Time */}
                      <div className="w-20 text-center flex-shrink-0">
                        <p className="text-2xl font-bold text-white">
                          {formatTime(booking.appointment_time).split(' ')[0]}
                        </p>
                        <p className="text-[#0393d5] text-sm">
                          {formatTime(booking.appointment_time).split(' ')[1]}
                        </p>
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-5 h-5 text-[#0393d5]" />
                          <span className="text-white font-medium">
                            {booking.customer?.name || 'Unknown Customer'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>

                        {booking.customer?.phone && (
                          <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                            <Phone className="w-4 h-4" />
                            <span>{booking.customer.phone}</span>
                          </div>
                        )}

                        {booking.customer?.email && (
                          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                            <Mail className="w-4 h-4" />
                            <span>{booking.customer.email}</span>
                          </div>
                        )}

                        {/* Services */}
                        {booking.services && booking.services.length > 0 && (
                          <div className="mt-2">
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Services</p>
                            <div className="flex gap-2 flex-wrap">
                              {booking.services.map((service: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="bg-white/10 text-white text-sm px-3 py-1 rounded-lg"
                                >
                                  {service.name} - ${service.price}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {booking.customer_notes && (
                          <div className="mt-2 p-3 bg-white/5 rounded-lg">
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Customer Notes</p>
                            <p className="text-white text-sm">{booking.customer_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Total & Actions */}
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-white/60 text-xs">Total</p>
                          <p className="text-2xl font-bold text-white">${booking.total_amount}</p>
                        </div>

                        {/* Action Buttons based on status */}
                        {booking.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                              disabled={processingBookingId === booking.id}
                              className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                            >
                              {processingBookingId === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                              disabled={processingBookingId === booking.id}
                              className="flex items-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Decline
                            </button>
                          </div>
                        )}

                        {booking.status === 'confirmed' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openRescheduleModal(booking)}
                              className="flex items-center gap-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors text-sm border border-amber-500/30"
                            >
                              <CalendarClock className="w-4 h-4" />
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'completed')}
                              disabled={processingBookingId === booking.id}
                              className="flex items-center gap-1 px-4 py-2 bg-[#0393d5] hover:bg-[#027bb5] text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                            >
                              {processingBookingId === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Mark Complete
                            </button>
                          </div>
                        )}

                        {/* Reschedule button for pending bookings */}
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => openRescheduleModal(booking)}
                            className="flex items-center gap-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors text-sm border border-amber-500/30 mt-2"
                          >
                            <CalendarClock className="w-4 h-4" />
                            Reschedule
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Reschedule Modal */}
      {rescheduleModalOpen && rescheduleBookingData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl p-6 max-w-md w-full border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Reschedule Appointment</h3>
                <p className="text-white/60 text-sm">
                  {rescheduleBookingData.customer?.name || 'Customer'}
                </p>
              </div>
            </div>

            {/* Current appointment info */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Current Appointment</p>
              <div className="flex items-center gap-4 text-white">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0393d5]" />
                  <span>{formatDate(rescheduleBookingData.appointment_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0393d5]" />
                  <span>{formatTime(rescheduleBookingData.appointment_time)}</span>
                </div>
              </div>
            </div>

            {/* New date/time inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  New Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRescheduleModalOpen(false);
                  setRescheduleBookingData(null);
                }}
                disabled={rescheduling}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={rescheduling || !newDate || !newTime}
                className="flex-1 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rescheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  <>
                    <CalendarClock className="w-4 h-4" />
                    Reschedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

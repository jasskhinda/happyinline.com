'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getProfile, Profile } from '@/lib/auth';
import { getProviderBookings, getAllShopBookingsForProvider, getShopProviders, updateBookingStatus, rescheduleBooking, Shop, Booking, ShopStaff } from '@/lib/shop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StaffDayCalendar from '@/components/StaffDayCalendar';
import {
  Loader2,
  Calendar,
  Clock,
  Check,
  X,
  AlertCircle,
  Store,
  CalendarDays,
  CalendarClock,
  Link as LinkIcon,
  Unlink,
  Users,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Scissors,
  Video,
  MapPin,
  ExternalLink,
  Lock
} from 'lucide-react';

function ProviderDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allShopBookings, setAllShopBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<ShopStaff[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'shop'>('my');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Booking detail modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | 'cancel' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Calendar sync state
  const [calendarConnecting, setCalendarConnecting] = useState(false);
  const [calendarDisconnecting, setCalendarDisconnecting] = useState(false);

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

    // Check for calendar connection status from URL
    const calendarStatus = searchParams.get('calendar');
    if (calendarStatus === 'connected') {
      setSuccess('Google Calendar connected successfully! Your bookings will now sync automatically.');
      // Clear the URL param
      window.history.replaceState({}, '', '/provider');
    } else if (calendarStatus === 'error') {
      setError('Failed to connect Google Calendar. Please try again.');
      window.history.replaceState({}, '', '/provider');
    }
  }, [searchParams]);

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
      setProfile(profile);

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

      // Get provider bookings (no filters - calendar shows all)
      const result = await getProviderBookings(user.id);

      if (!result.success) {
        setError(result.error || 'Failed to load bookings');
        setLoading(false);
        return;
      }

      setShop(result.shop || null);
      setBookings(result.bookings || []);

      // Also fetch all shop bookings for the "Shop Schedule" tab
      const allShopResult = await getAllShopBookingsForProvider(user.id);
      if (allShopResult.success) {
        setAllShopBookings(allShopResult.bookings || []);
      }

      // Load providers for the calendar
      if (result.shop?.id) {
        const providersResult = await getShopProviders(result.shop.id);
        if (providersResult.success && providersResult.providers) {
          setProviders(providersResult.providers);
        }
      }
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

  const handleConnectCalendar = async () => {
    if (!userId) return;

    setCalendarConnecting(true);
    try {
      const response = await fetch(`/api/calendar?userId=${userId}&redirect=/provider`);
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError('Failed to get calendar authorization URL');
        setCalendarConnecting(false);
      }
    } catch (err) {
      setError('Failed to connect calendar');
      setCalendarConnecting(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!userId) return;

    setCalendarDisconnecting(true);
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', userId })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Google Calendar disconnected');
        // Refresh profile data
        const updatedProfile = await getProfile(userId);
        if (updatedProfile) setProfile(updatedProfile);
      } else {
        setError('Failed to disconnect calendar');
      }
    } catch (err) {
      setError('Failed to disconnect calendar');
    } finally {
      setCalendarDisconnecting(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBookingData || !newDate || !newTime) return;

    // Store old date/time before rescheduling
    const oldDate = rescheduleBookingData.appointment_date;
    const oldTime = rescheduleBookingData.appointment_time;

    setRescheduling(true);
    setError('');

    try {
      const result = await rescheduleBooking(rescheduleBookingData.id, newDate, newTime);

      if (result.success) {
        // Send reschedule email notifications (non-blocking)
        fetch('/api/booking/reschedule-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: rescheduleBookingData.id,
            oldDate,
            oldTime,
            rescheduledBy: 'business'
          }),
        }).catch(err => console.error('Failed to send reschedule notifications:', err));

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
    // Parse date parts directly to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
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
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled':
      case 'no_show':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/20 text-white border-white/30';
    }
  };

  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleAction = (booking: Booking, action: 'approve' | 'reject' | 'complete' | 'cancel') => {
    setSelectedBooking(booking);
    setActionType(action);
    setActionNotes('');
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedBooking || !actionType) return;

    setProcessing(true);
    setError('');

    try {
      const statusMap: Record<string, 'confirmed' | 'no_show' | 'completed' | 'cancelled'> = {
        approve: 'confirmed',
        reject: 'no_show',
        complete: 'completed',
        cancel: 'cancelled'
      };

      const result = await updateBookingStatus(
        selectedBooking.id,
        statusMap[actionType],
        actionNotes || undefined
      );

      if (result.success) {
        // Send cancellation email if the action was cancel
        if (actionType === 'cancel') {
          fetch('/api/booking/cancel-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: selectedBooking.id,
              cancelledBy: 'business'
            }),
          }).catch(err => console.error('Failed to send cancellation notifications:', err));
        }

        const actionLabels: Record<string, string> = {
          approve: 'confirmed',
          reject: 'marked as no-show',
          complete: 'marked as complete',
          cancel: 'cancelled'
        };
        setSuccess(`Booking ${actionLabels[actionType]} successfully!`);
        setShowActionModal(false);
        setSelectedBooking(null);
        setActionType(null);
        loadData();
      } else {
        setError(result.error || 'Failed to update booking');
      }
    } catch (err) {
      setError('Failed to update booking');
    } finally {
      setProcessing(false);
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

      <main className="w-full px-4 md:px-8 lg:px-12 py-8 pt-32 flex-1">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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

          {/* Messages Button */}
          <button
            onClick={() => router.push('/messages')}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Messages</p>
                <p className="text-lg font-bold text-white">Chat</p>
              </div>
            </div>
          </button>

          {/* Google Calendar Sync Card */}
          <div className={`backdrop-blur-lg rounded-xl p-6 border ${
            profile?.google_calendar_connected
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-white/10 border-white/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                profile?.google_calendar_connected
                  ? 'bg-green-500/20'
                  : 'bg-purple-500/20'
              }`}>
                {profile?.google_calendar_connected ? (
                  <Check className="w-6 h-6 text-green-400" />
                ) : (
                  <LinkIcon className="w-6 h-6 text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-sm">Google Calendar</p>
                <p className={`text-sm font-medium ${
                  profile?.google_calendar_connected ? 'text-green-400' : 'text-white'
                }`}>
                  {profile?.google_calendar_connected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              {profile?.google_calendar_connected ? (
                <button
                  onClick={handleDisconnectCalendar}
                  disabled={calendarDisconnecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {calendarDisconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectCalendar}
                  disabled={calendarConnecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0393d5] hover:bg-[#027bb5] text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {calendarConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LinkIcon className="w-4 h-4" />
                  )}
                  Connect Calendar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Staff Day Calendar - Same as owner bookings page */}
        <StaffDayCalendar
          bookings={allShopBookings}
          providers={providers}
          onViewBooking={viewBookingDetails}
          onRefresh={loadData}
        />
      </main>

      <Footer />

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0a3a6b]">
              <h3 className="text-xl font-semibold text-white">Booking Details</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBooking(null);
                }}
                className="text-[#0393d5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="text-center">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                  {selectedBooking.status === 'pending' && <Clock className="w-4 h-4" />}
                  {(selectedBooking.status === 'cancelled' || selectedBooking.status === 'no_show') && <XCircle className="w-4 h-4" />}
                  {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                </span>
              </div>

              {/* Customer */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-[#0393d5] mb-3">Customer</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-white/50" />
                    <span className="text-white">{selectedBooking.customer?.name || 'Unknown'}</span>
                  </div>
                  {selectedBooking.customer?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-white/50" />
                      <span className="text-white/80">{selectedBooking.customer.email}</span>
                    </div>
                  )}
                  {selectedBooking.customer?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-white/50" />
                      <span className="text-white/80">{selectedBooking.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-[#0393d5] mb-3">Appointment</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-white/50" />
                    <span className="text-white">{formatDate(selectedBooking.appointment_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/50" />
                    <span className="text-white">{formatTime(selectedBooking.appointment_time)}</span>
                  </div>
                  {selectedBooking.barber && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-white/50" />
                      <span className="text-white/80">Provider: {selectedBooking.barber.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Services */}
              {selectedBooking.services && selectedBooking.services.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-[#0393d5] mb-3">Services</h4>
                  <div className="space-y-3">
                    {selectedBooking.services.map((service: any, idx: number) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Scissors className="w-4 h-4 text-white/50" />
                            <span className="text-white font-medium">{service.name || service}</span>
                            {/* Service Type Badge */}
                            {service.service_type === 'in_person' && (
                              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                In-Person
                              </span>
                            )}
                            {service.service_type === 'online' && (
                              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Online
                              </span>
                            )}
                            {service.service_type === 'both' && (
                              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                In-Person / Online
                              </span>
                            )}
                          </div>
                          {service.price && (
                            <span className="text-white/80">${service.price}</span>
                          )}
                        </div>
                        {/* Online Meeting Link */}
                        {(service.service_type === 'online' || service.service_type === 'both') && service.online_meeting_link && (
                          <div className="mt-2 bg-purple-500/10 rounded-lg p-2 border border-purple-500/20">
                            <a
                              href={service.online_meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-purple-300 hover:text-purple-200 text-sm transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="font-medium">Join Meeting</span>
                            </a>
                            {service.online_meeting_password && (
                              <div className="flex items-center gap-2 mt-1 text-xs text-purple-300/70">
                                <Lock className="w-3 h-3" />
                                <span>Password: <span className="font-mono font-medium text-purple-300">{service.online_meeting_password}</span></span>
                              </div>
                            )}
                            {service.online_instructions && (
                              <p className="mt-1 text-xs text-purple-300/70">{service.online_instructions}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-white font-medium">Total</span>
                      <span className="text-white font-semibold">${selectedBooking.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {(selectedBooking.customer_notes || selectedBooking.shop_notes) && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-[#0393d5] mb-3">Notes</h4>
                  {selectedBooking.customer_notes && (
                    <div className="mb-3">
                      <p className="text-xs text-white/50 mb-1">Customer note:</p>
                      <p className="text-white/80">{selectedBooking.customer_notes}</p>
                    </div>
                  )}
                  {selectedBooking.shop_notes && (
                    <div>
                      <p className="text-xs text-white/50 mb-1">Shop note:</p>
                      <p className="text-white/80">{selectedBooking.shop_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedBooking.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAction(selectedBooking, 'reject');
                    }}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAction(selectedBooking, 'approve');
                    }}
                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                </div>
              )}

              {selectedBooking.status === 'confirmed' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAction(selectedBooking, 'cancel');
                    }}
                    className="flex-1 px-4 py-3 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAction(selectedBooking, 'complete');
                    }}
                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && selectedBooking && actionType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">
                {actionType === 'approve' && 'Approve Booking'}
                {actionType === 'reject' && 'Reject Booking'}
                {actionType === 'complete' && 'Complete Booking'}
                {actionType === 'cancel' && 'Cancel Booking'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-white/80">
                {actionType === 'approve' && 'Are you sure you want to approve this booking?'}
                {actionType === 'reject' && 'Are you sure you want to reject this booking? The customer will be notified.'}
                {actionType === 'complete' && 'Mark this booking as completed?'}
                {actionType === 'cancel' && 'Are you sure you want to cancel this booking? The customer will be notified.'}
              </p>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-medium">{selectedBooking.customer?.name}</p>
                <p className="text-[#0393d5] text-sm">
                  {formatDate(selectedBooking.appointment_date)} at {formatTime(selectedBooking.appointment_time)}
                </p>
              </div>

              {(actionType === 'reject' || actionType === 'cancel') && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Reason (optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add a note for the customer..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5] resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedBooking(null);
                    setActionType(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={processing}
                  className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                    actionType === 'approve' || actionType === 'complete'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default function ProviderDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
          <p className="text-[#0393d5]">Loading...</p>
        </div>
      </div>
    }>
      <ProviderDashboardContent />
    </Suspense>
  );
}

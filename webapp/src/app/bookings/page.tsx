'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSubscriptionStatus, SubscriptionStatus } from '@/lib/auth';
import {
  getMyShop,
  getShopBookings,
  getShopProviders,
  updateBookingStatus,
  Shop,
  Booking,
  ShopStaff
} from '@/lib/shop';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  X,
  AlertCircle,
  Check,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  DollarSign,
  CalendarDays,
  Scissors
} from 'lucide-react';

type BookingStatus = 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected';

const STATUS_TABS: { key: BookingStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'white' },
  { key: 'pending', label: 'Pending', color: 'yellow' },
  { key: 'approved', label: 'Approved', color: 'blue' },
  { key: 'completed', label: 'Completed', color: 'green' },
  { key: 'cancelled', label: 'Cancelled', color: 'red' },
];

export default function BookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<ShopStaff[]>([]);
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('pending');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | 'cancel' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

      const subStatus = await getSubscriptionStatus(user.id);
      setSubscription(subStatus);

      if (!subStatus?.isActive) {
        router.push('/subscribe');
        return;
      }

      const shopResult = await getMyShop(user.id);
      if (!shopResult.success || !shopResult.shop) {
        router.push('/shop/create');
        return;
      }

      setShop(shopResult.shop);

      // Load bookings
      const bookingsResult = await getShopBookings(shopResult.shop.id);
      if (bookingsResult.success && bookingsResult.bookings) {
        setBookings(bookingsResult.bookings);
      }

      // Load providers for filter
      const providersResult = await getShopProviders(shopResult.shop.id);
      if (providersResult.success && providersResult.providers) {
        setProviders(providersResult.providers);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
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
      const statusMap: Record<string, BookingStatus> = {
        approve: 'approved',
        reject: 'rejected',
        complete: 'completed',
        cancel: 'cancelled'
      };

      const result = await updateBookingStatus(
        selectedBooking.id,
        statusMap[actionType],
        actionNotes || undefined
      );

      if (result.success) {
        const actionLabels: Record<string, string> = {
          approve: 'approved',
          reject: 'rejected',
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

  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    if (activeTab !== 'all' && booking.status !== activeTab) return false;
    if (selectedDate && booking.appointment_date !== selectedDate) return false;
    if (selectedProvider && booking.barber_id !== selectedProvider) return false;
    return true;
  });

  // Group bookings by date
  const groupedBookings = filteredBookings.reduce((acc, booking) => {
    const date = booking.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const sortedDates = Object.keys(groupedBookings).sort((a, b) => a.localeCompare(b));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-white/20 text-white border-white/30';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) return 'Today';
    if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Count bookings by status
  const bookingCounts = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-[#0393d5] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-yellow-400">{bookingCounts.pending || 0}</div>
            <div className="text-yellow-200 text-sm">Pending</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-400">{bookingCounts.approved || 0}</div>
            <div className="text-blue-200 text-sm">Approved</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-400">{bookingCounts.completed || 0}</div>
            <div className="text-green-200 text-sm">Completed</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="text-3xl font-bold text-red-400">{(bookingCounts.cancelled || 0) + (bookingCounts.rejected || 0)}</div>
            <div className="text-red-200 text-sm">Cancelled</div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 mb-6">
          {/* Status Tabs */}
          <div className="flex border-b border-white/10 overflow-x-auto">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-[#0393d5]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && bookingCounts[tab.key] > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-[#0393d5] text-white'
                      : 'bg-white/10 text-white/70'
                  }`}>
                    {bookingCounts[tab.key]}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0393d5]" />
                )}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="p-4 flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters || selectedDate || selectedProvider
                  ? 'bg-[#0393d5]/20 text-[#0393d5]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(selectedDate || selectedProvider) && (
                <span className="bg-[#0393d5] text-white text-xs px-2 py-0.5 rounded-full">
                  {(selectedDate ? 1 : 0) + (selectedProvider ? 1 : 0)}
                </span>
              )}
            </button>

            {showFilters && (
              <>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#0393d5]"
                  />
                </div>

                {providers.length > 0 && (
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#0393d5]"
                  >
                    <option value="">All Providers</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.user_id}>
                        {provider.user?.name || 'Unknown'}
                      </option>
                    ))}
                  </select>
                )}

                {(selectedDate || selectedProvider) && (
                  <button
                    onClick={() => {
                      setSelectedDate('');
                      setSelectedProvider('');
                    }}
                    className="text-[#0393d5] hover:text-white text-sm"
                  >
                    Clear filters
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-12 text-center">
              <Calendar className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-white mb-2">No Bookings Found</h4>
              <p className="text-[#0393d5]">
                {activeTab === 'pending'
                  ? 'No pending bookings to review'
                  : 'No bookings match your filters'}
              </p>
            </div>
          ) : (
            sortedDates.map(date => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#0393d5]" />
                  {formatDate(date)}
                  <span className="text-[#0393d5] font-normal text-sm">
                    ({groupedBookings[date].length} booking{groupedBookings[date].length !== 1 ? 's' : ''})
                  </span>
                </h3>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 divide-y divide-white/10">
                  {groupedBookings[date].map(booking => (
                    <div key={booking.id} className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Time */}
                        <div className="flex items-center gap-3 md:w-32">
                          <div className="w-10 h-10 rounded-lg bg-[#0393d5]/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-[#0393d5]" />
                          </div>
                          <span className="text-white font-medium">
                            {formatTime(booking.appointment_time)}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium truncate">
                              {booking.customer?.name || 'Unknown Customer'}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-[#0393d5] text-sm truncate">
                            {booking.customer?.email || booking.customer?.phone}
                          </p>
                          {booking.services && booking.services.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <Scissors className="w-4 h-4 text-white/50" />
                              <span className="text-white/70 text-sm">
                                {booking.services.map((s: any) => s.name || s).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Provider */}
                        {booking.barber && (
                          <div className="flex items-center gap-2 text-white/70">
                            <User className="w-4 h-4" />
                            <span className="text-sm">{booking.barber.name}</span>
                          </div>
                        )}

                        {/* Amount */}
                        <div className="flex items-center gap-1 text-white font-semibold">
                          <DollarSign className="w-4 h-4" />
                          {booking.total_amount.toFixed(2)}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewBookingDetails(booking)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                          >
                            View
                          </button>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(booking, 'approve')}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(booking, 'reject')}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                          {booking.status === 'approved' && (
                            <>
                              <button
                                onClick={() => handleAction(booking, 'complete')}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleAction(booking, 'cancel')}
                                className="px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

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
                  {(selectedBooking.status === 'cancelled' || selectedBooking.status === 'rejected') && <XCircle className="w-4 h-4" />}
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
                  <div className="space-y-2">
                    {selectedBooking.services.map((service: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-white/50" />
                          <span className="text-white">{service.name || service}</span>
                        </div>
                        {service.price && (
                          <span className="text-white/80">${service.price}</span>
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

              {selectedBooking.status === 'approved' && (
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
    </div>
  );
}

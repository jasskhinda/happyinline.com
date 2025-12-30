'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Filter,
  List,
  Grid3X3
} from 'lucide-react';
import { Booking, ShopStaff } from '@/lib/shop';

interface BookingCalendarProps {
  bookings: Booking[];
  providers: ShopStaff[];
  onViewBooking: (booking: Booking) => void;
  selectedProvider: string;
  onProviderChange: (providerId: string) => void;
}

type ViewMode = 'calendar' | 'list';

export default function BookingCalendar({
  bookings,
  providers,
  onViewBooking,
  selectedProvider,
  onProviderChange
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get start and end of the current month view
  const { startDate, endDate, daysInView } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDayOfMonth);
    const daysToAdd = 6 - lastDayOfMonth.getDay();
    endDate.setDate(endDate.getDate() + daysToAdd);

    // Generate all days in view
    const days: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return { startDate, endDate, daysInView: days };
  }, [currentDate]);

  // Filter bookings by selected provider
  const filteredBookings = useMemo(() => {
    if (!selectedProvider) return bookings;
    return bookings.filter(b => b.barber_id === selectedProvider);
  }, [bookings, selectedProvider]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    filteredBookings.forEach(booking => {
      const date = booking.appointment_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(booking);
    });
    // Sort bookings within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    });
    return grouped;
  }, [filteredBookings]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled':
      case 'no_show': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProviderColor = (providerId: string | null) => {
    if (!providerId) return 'bg-gray-500';
    const colors = [
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-rose-500',
      'bg-emerald-500'
    ];
    const index = providers.findIndex(p => p.user_id === providerId);
    return colors[index % colors.length];
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get bookings for selected date (for detail panel)
  const selectedDateBookings = selectedDate ? (bookingsByDate[selectedDate] || []) : [];

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-2 bg-[#0393d5]/20 hover:bg-[#0393d5]/30 text-[#0393d5] rounded-lg text-sm font-medium"
          >
            Today
          </button>
        </div>

        {/* Filters and view toggle */}
        <div className="flex items-center gap-3">
          {/* Provider filter */}
          {providers.length > 0 && (
            <select
              value={selectedProvider}
              onChange={(e) => onProviderChange(e.target.value)}
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

          {/* View toggle */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'calendar' ? 'bg-[#0393d5] text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-[#0393d5] text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Provider legend */}
      {providers.length > 0 && !selectedProvider && (
        <div className="flex flex-wrap gap-3">
          {providers.map(provider => (
            <div
              key={provider.id}
              className="flex items-center gap-2 text-sm text-white/80"
            >
              <div className={`w-3 h-3 rounded-full ${getProviderColor(provider.user_id)}`} />
              <span>{provider.user?.name || 'Unknown'}</span>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="flex gap-4">
          {/* Calendar grid */}
          <div className="flex-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-white/5">
              {dayNames.map(day => (
                <div key={day} className="py-3 text-center text-sm font-medium text-white/70">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {daysInView.map((date, idx) => {
                const dateStr = formatDate(date);
                const dayBookings = bookingsByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[100px] p-2 border-t border-l border-white/10 cursor-pointer transition-colors ${
                      !isCurrentMonth(date) ? 'bg-white/5 opacity-50' : ''
                    } ${isToday(date) ? 'bg-[#0393d5]/20' : ''} ${
                      isSelected ? 'ring-2 ring-[#0393d5] ring-inset' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(date) ? 'text-[#0393d5]' : 'text-white'
                    }`}>
                      {date.getDate()}
                    </div>

                    {/* Booking indicators */}
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map(booking => (
                        <div
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewBooking(booking);
                          }}
                          className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${
                            selectedProvider
                              ? getStatusColor(booking.status)
                              : getProviderColor(booking.barber_id)
                          }`}
                          title={`${formatTime(booking.appointment_time)} - ${booking.customer?.name || 'Customer'}`}
                        >
                          {formatTime(booking.appointment_time).split(' ')[0]} {booking.customer?.name?.split(' ')[0] || 'Customer'}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-white/50 px-1">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected date panel */}
          {selectedDate && (
            <div className="w-80 bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </h3>

              {selectedDateBookings.length === 0 ? (
                <p className="text-white/50 text-sm">No appointments</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateBookings.map(booking => (
                    <div
                      key={booking.id}
                      onClick={() => onViewBooking(booking)}
                      className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-[#0393d5]" />
                        <span className="text-white font-medium">
                          {formatTime(booking.appointment_time)}
                        </span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                          booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <User className="w-4 h-4" />
                        <span>{booking.customer?.name || 'Unknown'}</span>
                      </div>
                      {booking.barber && (
                        <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                          <div className={`w-2 h-2 rounded-full ${getProviderColor(booking.barber_id)}`} />
                          <span>{booking.barber.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* List view */
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          {Object.keys(bookingsByDate).length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
              <p className="text-white/70">No appointments found</p>
            </div>
          ) : (
            Object.entries(bookingsByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dayBookings]) => (
                <div key={date}>
                  <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                    <h3 className="text-white font-medium">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {dayBookings.map(booking => (
                      <div
                        key={booking.id}
                        onClick={() => onViewBooking(booking)}
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="w-16 text-center">
                          <div className="text-white font-semibold">
                            {formatTime(booking.appointment_time).split(' ')[0]}
                          </div>
                          <div className="text-[#0393d5] text-xs">
                            {formatTime(booking.appointment_time).split(' ')[1]}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {booking.customer?.name || 'Unknown'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                              booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          {booking.barber && (
                            <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                              <div className={`w-2 h-2 rounded-full ${getProviderColor(booking.barber_id)}`} />
                              <span>{booking.barber.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-white/80 text-sm">
                          ${booking.total_amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}

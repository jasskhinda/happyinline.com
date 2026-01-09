'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  CalendarClock,
  Loader2,
  X,
  Video,
  MapPin,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Booking } from '@/lib/shop';

interface ProviderCalendarProps {
  bookings: Booking[];
  onUpdateStatus?: (bookingId: string, status: 'confirmed' | 'completed' | 'cancelled') => Promise<void>;
  onReschedule?: (booking: Booking) => void;
  processingBookingId: string | null;
  readOnly?: boolean;
  showProviderName?: boolean;
}

export default function ProviderCalendar({
  bookings,
  onUpdateStatus,
  onReschedule,
  processingBookingId,
  readOnly = false,
  showProviderName = false
}: ProviderCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Get start and end of the current month view
  const { daysInView } = useMemo(() => {
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

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach(booking => {
      const date = booking.appointment_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(booking);
    });
    // Sort bookings within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    });
    return grouped;
  }, [bookings]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-white/10 text-white/70';
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(formatDate(today));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const todayStr = formatDate(new Date());
  const selectedDayBookings = selectedDate ? (bookingsByDate[selectedDate] || []) : [];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-4 py-2 bg-[#0393d5] hover:bg-[#027bb5] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Today
        </button>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Calendar Grid */}
        <div className="flex-1 p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-white/60 text-sm font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInView.map((date, index) => {
              const dateStr = formatDate(date);
              const dayBookings = bookingsByDate[dateStr] || [];
              const isSelected = selectedDate === dateStr;
              const hasPending = dayBookings.some(b => b.status === 'pending');

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    relative p-2 min-h-[80px] rounded-lg transition-all text-left
                    ${isCurrentMonth(date) ? 'bg-white/5' : 'bg-transparent'}
                    ${isSelected ? 'ring-2 ring-[#0393d5] bg-[#0393d5]/20' : 'hover:bg-white/10'}
                    ${isToday(date) ? 'border border-[#0393d5]' : ''}
                  `}
                >
                  <span className={`
                    text-sm font-medium
                    ${isCurrentMonth(date) ? 'text-white' : 'text-white/30'}
                    ${isToday(date) ? 'text-[#0393d5]' : ''}
                  `}>
                    {date.getDate()}
                  </span>

                  {/* Booking indicators */}
                  {dayBookings.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayBookings.slice(0, 2).map((booking, idx) => (
                        <div
                          key={idx}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${getStatusColor(booking.status)} text-white`}
                        >
                          {formatTime(booking.appointment_time).split(' ')[0]}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-white/60 px-1">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending indicator */}
                  {hasPending && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Bookings */}
        <div className="lg:w-[400px] border-t lg:border-t-0 lg:border-l border-white/10">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="text-lg font-semibold text-white">
              {selectedDate ? formatDateDisplay(selectedDate) : 'Select a date'}
            </h3>
            <p className="text-[#0393d5] text-sm">
              {selectedDayBookings.length} appointment{selectedDayBookings.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {selectedDayBookings.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">
                  {selectedDate ? 'No appointments on this day' : 'Select a date to view appointments'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {selectedDayBookings.map((booking) => (
                  <div key={booking.id} className="p-4">
                    {/* Time and Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0393d5]" />
                        <span className="text-white font-medium">
                          {formatTime(booking.appointment_time)}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Provider Name (for Shop Schedule view) */}
                    {showProviderName && booking.barber?.name && (
                      <div className="bg-[#0393d5]/20 rounded-lg px-3 py-2 mb-3 border border-[#0393d5]/30">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0393d5] flex items-center justify-center text-white text-xs font-medium">
                            {booking.barber.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[#0393d5] font-medium text-sm">{booking.barber.name}</span>
                        </div>
                      </div>
                    )}

                    {/* Customer Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-white/50" />
                        <span className="text-white">{booking.customer?.name || 'Unknown'}</span>
                      </div>
                      {booking.customer?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-white/50" />
                          <span className="text-white/70 text-sm">{booking.customer.phone}</span>
                        </div>
                      )}
                      {booking.customer?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-white/50" />
                          <span className="text-white/70 text-sm truncate">{booking.customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Services */}
                    {booking.services && booking.services.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {booking.services.map((service: any, idx: number) => (
                          <div key={idx} className="bg-white/5 rounded-lg p-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white text-sm font-medium">{service.name}</span>
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
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/60 text-sm">Total</span>
                      <span className="text-white font-bold">${booking.total_amount}</span>
                    </div>

                    {/* Actions (only shown when not read-only) */}
                    {!readOnly && booking.status === 'pending' && onUpdateStatus && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                          disabled={processingBookingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        >
                          {processingBookingId === booking.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Confirm
                        </button>
                        <button
                          onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                          disabled={processingBookingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Decline
                        </button>
                      </div>
                    )}

                    {!readOnly && booking.status === 'confirmed' && onUpdateStatus && onReschedule && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onReschedule(booking)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm rounded-lg transition-colors border border-amber-500/30"
                        >
                          <CalendarClock className="w-4 h-4" />
                          Reschedule
                        </button>
                        <button
                          onClick={() => onUpdateStatus(booking.id, 'completed')}
                          disabled={processingBookingId === booking.id}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#0393d5] hover:bg-[#027bb5] text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        >
                          {processingBookingId === booking.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

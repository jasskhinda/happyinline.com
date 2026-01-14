'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Booking, ShopStaff } from '@/lib/shop';

interface StaffDayCalendarProps {
  bookings: Booking[];
  providers: ShopStaff[];
  onViewBooking: (booking: Booking) => void;
  onRefresh?: () => void;
}

// Constants for calendar layout
const TIME_COLUMN_WIDTH = 60;
const PROVIDER_COLUMN_MIN_WIDTH = 180;
const HOUR_HEIGHT = 60; // Height per hour in pixels
const START_HOUR = 7; // 7 AM
const END_HOUR = 20; // 8 PM (20:00)

// Provider colors (Booksy-style)
const PROVIDER_COLORS = [
  { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-700', bgHex: '#E8EAF6', borderHex: '#5C6BC0' },
  { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', bgHex: '#E3F2FD', borderHex: '#42A5F5' },
  { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700', bgHex: '#F3E5F5', borderHex: '#AB47BC' },
  { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', bgHex: '#E8F5E9', borderHex: '#66BB6A' },
  { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', bgHex: '#FFF3E0', borderHex: '#FFA726' },
  { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-700', bgHex: '#FCE4EC', borderHex: '#EC407A' },
  { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-700', bgHex: '#E0F7FA', borderHex: '#26C6DA' },
  { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700', bgHex: '#FFF8E1', borderHex: '#FFCA28' },
];

// Generate time slots for the day
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    slots.push({
      hour,
      label: `${displayHour} ${ampm}`,
    });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function StaffDayCalendar({
  bookings,
  providers,
  onViewBooking,
  onRefresh
}: StaffDayCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
        const scrollPosition = (currentHour - START_HOUR) * HOUR_HEIGHT - 100;
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' });
        }, 300);
      }
    }
  }, []);

  // Format date for comparison
  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = formatDateStr(selectedDate);

  // Filter bookings for selected date
  const dayBookings = useMemo(() => {
    return bookings.filter(b => b.appointment_date === selectedDateStr);
  }, [bookings, selectedDateStr]);

  // Get bookings grouped by provider
  const bookingsByProvider = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    providers.forEach(p => {
      grouped[p.user_id] = [];
    });
    dayBookings.forEach(booking => {
      if (booking.barber_id && grouped[booking.barber_id]) {
        grouped[booking.barber_id].push(booking);
      }
    });
    return grouped;
  }, [dayBookings, providers]);

  // Navigation functions
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Check if selected date is today
  const isToday = formatDateStr(selectedDate) === formatDateStr(new Date());

  // Generate week days for picker
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Calculate current time position
  const getCurrentTimePosition = () => {
    if (!isToday) return null;

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    if (hours < START_HOUR || hours > END_HOUR) return null;

    const totalMinutes = (hours - START_HOUR) * 60 + minutes;
    return (totalMinutes / 60) * HOUR_HEIGHT;
  };

  const timePosition = getCurrentTimePosition();

  // Calculate booking position and height
  const getBookingPosition = (booking: Booking) => {
    if (!booking.appointment_time) return { top: 0, height: HOUR_HEIGHT / 2 };

    const [hours, minutes] = booking.appointment_time.split(':').map(Number);
    const top = ((hours - START_HOUR) * 60 + minutes) / 60 * HOUR_HEIGHT;

    // Calculate duration from services or default to 30 min
    let duration = 30;
    if (booking.services && Array.isArray(booking.services)) {
      duration = booking.services.reduce((sum: number, s: any) => sum + (s.duration || 30), 0);
    }

    const height = (duration / 60) * HOUR_HEIGHT;
    return { top, height: Math.max(height, 30) };
  };

  // Check if booking is in the past
  const isBookingPast = (booking: Booking) => {
    if (!isToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate < today;
    }

    if (!booking.appointment_time) return false;

    const [hours, minutes] = booking.appointment_time.split(':').map(Number);
    const bookingTime = new Date();
    bookingTime.setHours(hours, minutes, 0, 0);

    return bookingTime < currentTime;
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  // Get service names
  const getServiceNames = (booking: Booking) => {
    if (!booking.services || !Array.isArray(booking.services)) return 'Service';
    return booking.services.map((s: any) => s.name).join(', ');
  };

  // Get provider color
  const getProviderColor = (index: number) => {
    return PROVIDER_COLORS[index % PROVIDER_COLORS.length];
  };

  // Format date header
  const formatDateHeader = () => {
    if (isToday) return 'Today';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate column width based on number of providers
  const columnWidth = providers.length > 0
    ? Math.max(PROVIDER_COLUMN_MIN_WIDTH, (typeof window !== 'undefined' ? window.innerWidth - TIME_COLUMN_WIDTH - 100 : 800) / providers.length)
    : PROVIDER_COLUMN_MIN_WIDTH;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-4">
        {/* Date navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousDay}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-xl font-semibold text-white min-w-[150px] text-center">
              {formatDateHeader()}
            </h2>
            <button
              onClick={goToNextDay}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-3 py-2 bg-[#0393d5]/20 hover:bg-[#0393d5]/30 text-[#0393d5] rounded-lg text-sm font-medium"
              >
                Today
              </button>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-[#0393d5]" />
            </button>
          )}
        </div>

        {/* Week day picker */}
        <div className="flex justify-center gap-2">
          {weekDays.map((date, idx) => {
            const dateStr = formatDateStr(date);
            const isSelected = dateStr === selectedDateStr;
            const isTodayDate = dateStr === formatDateStr(new Date());

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors min-w-[50px] ${
                  isSelected
                    ? 'bg-[#0393d5] text-white'
                    : isTodayDate
                    ? 'bg-[#0393d5]/20 text-[#0393d5]'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xs font-medium">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()]}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider headers */}
      <div className="flex border-b border-white/10 bg-white/5 sticky top-0 z-10">
        <div className="flex-shrink-0 border-r border-white/10" style={{ width: TIME_COLUMN_WIDTH }} />
        <div className="flex overflow-x-auto">
          {providers.map((provider, index) => {
            const color = getProviderColor(index);
            return (
              <div
                key={provider.id}
                className="flex-shrink-0 p-3 text-center border-r border-white/10"
                style={{
                  width: columnWidth,
                  borderBottom: `3px solid ${color.borderHex}`
                }}
              >
                <div className="flex flex-col items-center">
                  {provider.user?.profile_image ? (
                    <img
                      src={provider.user.profile_image}
                      alt={provider.user?.name || 'Provider'}
                      className="w-10 h-10 rounded-full object-cover mb-2"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                      style={{ backgroundColor: color.bgHex }}
                    >
                      <User className="w-5 h-5" style={{ color: color.borderHex }} />
                    </div>
                  )}
                  <span className="text-white font-medium text-sm truncate max-w-full">
                    {provider.user?.name || 'Staff'}
                  </span>
                  <span className="text-white/50 text-xs">8:30 AM - 6:00 PM</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar grid */}
      <div
        ref={scrollContainerRef}
        className="overflow-auto"
        style={{ maxHeight: '600px' }}
      >
        <div className="flex relative">
          {/* Time column */}
          <div
            className="flex-shrink-0 bg-[#0a3a6b] border-r border-white/10 sticky left-0 z-10"
            style={{ width: TIME_COLUMN_WIDTH }}
          >
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.hour}
                className="border-b border-white/5 flex items-start justify-end pr-2"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="text-xs text-white/50 -mt-2">{slot.label}</span>
              </div>
            ))}
          </div>

          {/* Provider columns container */}
          <div className="flex relative">
            {providers.map((provider, providerIndex) => {
              const color = getProviderColor(providerIndex);
              const providerBookings = bookingsByProvider[provider.user_id] || [];

              return (
                <div
                  key={provider.id}
                  className="flex-shrink-0 relative border-r border-white/10"
                  style={{
                    width: columnWidth,
                    backgroundColor: providerIndex % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent'
                  }}
                >
                  {/* Grid lines */}
                  {TIME_SLOTS.map((slot) => (
                    <div
                      key={slot.hour}
                      className="border-b border-white/5"
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Bookings */}
                  {providerBookings.map((booking) => {
                    const { top, height } = getBookingPosition(booking);
                    const isPast = isBookingPast(booking);

                    return (
                      <div
                        key={booking.id}
                        onClick={() => onViewBooking(booking)}
                        className={`absolute left-1 right-1 rounded-md cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-l-4 overflow-hidden ${
                          isPast ? 'opacity-50' : ''
                        }`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: color.bgHex,
                          borderLeftColor: color.borderHex,
                        }}
                      >
                        <div className="p-2 h-full overflow-hidden">
                          <div className={`text-xs font-bold ${color.text}`}>
                            {formatTime(booking.appointment_time)}
                          </div>
                          <div className={`text-xs font-semibold ${color.text} truncate`}>
                            {booking.customer?.name || 'Walk-in'}
                          </div>
                          {height > 45 && (
                            <div className={`text-xs ${color.text} opacity-70 truncate`}>
                              {getServiceNames(booking)}
                            </div>
                          )}
                          {booking.status === 'pending' && (
                            <div className="absolute top-1 right-1">
                              <Clock className="w-3 h-3 text-yellow-500" />
                            </div>
                          )}
                          {booking.status === 'confirmed' && (
                            <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Current time indicator (Red line) */}
            {timePosition !== null && (
              <div
                className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                style={{ top: `${timePosition}px` }}
              >
                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {providers.length === 0 && (
        <div className="p-12 text-center">
          <Calendar className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
          <p className="text-white/70">No staff members found</p>
          <p className="text-white/50 text-sm mt-1">Add providers to see the staff calendar</p>
        </div>
      )}
    </div>
  );
}

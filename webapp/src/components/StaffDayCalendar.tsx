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
const TIME_COLUMN_WIDTH = 55;
const PROVIDER_COLUMN_MIN_WIDTH = 160;
const HOUR_HEIGHT = 60;
const START_HOUR = 7;
const END_HOUR = 20;

// Booksy-style appointment colors (vibrant, professional)
const APPOINTMENT_COLORS = [
  { bg: '#7C5CFC', text: '#FFFFFF' }, // Purple
  { bg: '#3B82F6', text: '#FFFFFF' }, // Blue
  { bg: '#10B981', text: '#FFFFFF' }, // Green
  { bg: '#EC4899', text: '#FFFFFF' }, // Pink
  { bg: '#F59E0B', text: '#FFFFFF' }, // Amber
  { bg: '#06B6D4', text: '#FFFFFF' }, // Cyan
  { bg: '#8B5CF6', text: '#FFFFFF' }, // Violet
  { bg: '#EF4444', text: '#FFFFFF' }, // Red
];

// Generate time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    slots.push({ hour, label: `${displayHour}${ampm}` });
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const formatDateStr = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const selectedDateStr = formatDateStr(selectedDate);
  const isToday = selectedDateStr === formatDateStr(new Date());

  const dayBookings = useMemo(() => {
    return bookings.filter(b => b.appointment_date === selectedDateStr);
  }, [bookings, selectedDateStr]);

  const bookingsByProvider = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    providers.forEach(p => { grouped[p.user_id] = []; });
    dayBookings.forEach(booking => {
      if (booking.barber_id && grouped[booking.barber_id]) {
        grouped[booking.barber_id].push(booking);
      }
    });
    return grouped;
  }, [dayBookings, providers]);

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

  const goToToday = () => setSelectedDate(new Date());

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    if (hours < START_HOUR || hours > END_HOUR) return null;
    return ((hours - START_HOUR) * 60 + minutes) / 60 * HOUR_HEIGHT;
  };

  const timePosition = getCurrentTimePosition();

  const getBookingPosition = (booking: Booking) => {
    if (!booking.appointment_time) return { top: 0, height: 30 };
    const [hours, minutes] = booking.appointment_time.split(':').map(Number);
    const top = ((hours - START_HOUR) * 60 + minutes) / 60 * HOUR_HEIGHT;
    let duration = 30;
    if (booking.services && Array.isArray(booking.services)) {
      duration = booking.services.reduce((sum: number, s: any) => sum + (s.duration || 30), 0);
    }
    return { top, height: Math.max((duration / 60) * HOUR_HEIGHT, 30) };
  };

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

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const displayHour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const formatTimeRange = (booking: Booking) => {
    if (!booking.appointment_time) return '';
    const [hours, minutes] = booking.appointment_time.split(':').map(Number);
    let duration = 30;
    if (booking.services && Array.isArray(booking.services)) {
      duration = booking.services.reduce((sum: number, s: any) => sum + (s.duration || 30), 0);
    }
    const endMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const startDisplay = `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    const endDisplay = `${endHours % 12 || 12}:${String(endMins).padStart(2, '0')} ${endHours >= 12 ? 'PM' : 'AM'}`;
    return `${startDisplay} - ${endDisplay}`;
  };

  const getServiceNames = (booking: Booking) => {
    if (!booking.services || !Array.isArray(booking.services)) return 'Service';
    return booking.services.map((s: any) => s.name).join(', ');
  };

  const getProviderColor = (index: number) => APPOINTMENT_COLORS[index % APPOINTMENT_COLORS.length];

  const formatDateHeader = () => {
    if (isToday) return 'Today';
    return selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const columnWidth = Math.max(PROVIDER_COLUMN_MIN_WIDTH, 200);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header - Dark themed like Booksy */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={goToPreviousDay} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-lg font-semibold text-white min-w-[120px] text-center">
              {formatDateHeader()}
            </h2>
            <button onClick={goToNextDay} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            {!isToday && (
              <button onClick={goToToday} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                Today
              </button>
            )}
          </div>
          {onRefresh && (
            <button onClick={onRefresh} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Week day picker */}
        <div className="flex justify-center gap-1">
          {weekDays.map((date, idx) => {
            const dateStr = formatDateStr(date);
            const isSelected = dateStr === selectedDateStr;
            const isTodayDate = dateStr === formatDateStr(new Date());

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors min-w-[46px] ${
                  isSelected
                    ? 'bg-white text-gray-900'
                    : isTodayDate
                    ? 'bg-blue-500/30 text-blue-300'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                </span>
                <span className="text-base font-bold">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider headers - Light background */}
      <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <div className="flex-shrink-0 border-r border-gray-200 bg-white" style={{ width: TIME_COLUMN_WIDTH }} />
        <div className="flex overflow-x-auto">
          {providers.map((provider, index) => {
            const color = getProviderColor(index);
            return (
              <div
                key={provider.id}
                className="flex-shrink-0 py-3 px-2 text-center border-r border-gray-200 bg-white"
                style={{ width: columnWidth }}
              >
                <div className="flex flex-col items-center">
                  {provider.user?.profile_image ? (
                    <img
                      src={provider.user.profile_image}
                      alt={provider.user?.name || 'Provider'}
                      className="w-10 h-10 rounded-full object-cover mb-1.5 border-2 border-gray-200"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-1.5 border-2"
                      style={{ backgroundColor: color.bg + '20', borderColor: color.bg }}
                    >
                      <User className="w-5 h-5" style={{ color: color.bg }} />
                    </div>
                  )}
                  <span className="text-gray-900 font-semibold text-sm truncate max-w-full">
                    {provider.user?.name || 'Staff'}
                  </span>
                  <span className="text-gray-400 text-xs">8:30 AM - 6:00 PM</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar grid - Light background with hatched pattern for off-hours */}
      <div ref={scrollContainerRef} className="overflow-auto" style={{ maxHeight: '600px' }}>
        <div className="flex relative">
          {/* Time column */}
          <div className="flex-shrink-0 bg-white border-r border-gray-200 sticky left-0 z-10" style={{ width: TIME_COLUMN_WIDTH }}>
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.hour}
                className="border-b border-gray-100 flex items-start justify-end pr-2 pt-0"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="text-[11px] text-gray-400 font-medium -mt-2">{slot.label}</span>
              </div>
            ))}
          </div>

          {/* Provider columns */}
          <div className="flex relative">
            {providers.map((provider, providerIndex) => {
              const color = getProviderColor(providerIndex);
              const providerBookings = bookingsByProvider[provider.user_id] || [];

              return (
                <div
                  key={provider.id}
                  className="flex-shrink-0 relative border-r border-gray-200"
                  style={{ width: columnWidth }}
                >
                  {/* Grid lines with hatched pattern for visual interest */}
                  {TIME_SLOTS.map((slot, slotIdx) => (
                    <div
                      key={slot.hour}
                      className="border-b border-gray-100"
                      style={{
                        height: HOUR_HEIGHT,
                        background: slotIdx < 1 || slotIdx > 11
                          ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)'
                          : providerIndex % 2 === 1 ? '#FAFAFA' : '#FFFFFF'
                      }}
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
                        className={`absolute left-1 right-1 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg overflow-hidden ${
                          isPast ? 'opacity-50' : 'shadow-md'
                        }`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: color.bg,
                        }}
                      >
                        <div className="p-2 h-full overflow-hidden relative">
                          <div className="text-[11px] font-bold text-white/90">
                            {formatTimeRange(booking)}
                          </div>
                          <div className="text-sm font-semibold text-white truncate">
                            {booking.customer?.name || 'Walk-in'}
                          </div>
                          {height > 50 && (
                            <div className="text-xs text-white/80 truncate">
                              {getServiceNames(booking)}
                            </div>
                          )}
                          {/* Red dot for confirmed bookings */}
                          {booking.status === 'confirmed' && (
                            <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
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
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {providers.length === 0 && (
        <div className="p-12 text-center bg-gray-50">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No staff members found</p>
          <p className="text-gray-400 text-sm mt-1">Add providers to see the staff calendar</p>
        </div>
      )}
    </div>
  );
}

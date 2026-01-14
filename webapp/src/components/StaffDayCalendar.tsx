'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Heart,
  Settings,
  Bell,
  Search,
  Plus
} from 'lucide-react';
import { Booking, ShopStaff } from '@/lib/shop';

interface StaffDayCalendarProps {
  bookings: Booking[];
  providers: ShopStaff[];
  onViewBooking: (booking: Booking) => void;
  onRefresh?: () => void;
}

// Constants for calendar layout
const SIDEBAR_WIDTH = 260;
const TIME_COLUMN_WIDTH = 65;
const PROVIDER_COLUMN_MIN_WIDTH = 280;
const HOUR_HEIGHT = 80;
const START_HOUR = 7;
const END_HOUR = 21;

// Generate time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    slots.push({ hour, label: `${displayHour} ${ampm}` });
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
  const [showStaffResources, setShowStaffResources] = useState(true);
  const [showHighlight, setShowHighlight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to current time on load
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

  // Calendar navigation
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

  const jumpByWeeks = (weeks: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setSelectedDate(newDate);
  };

  // Get mini calendar month data
  const getMonthCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Previous month padding
    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push(d);
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const monthCalendar = getMonthCalendar();

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    if (hours < START_HOUR || hours > END_HOUR) return null;
    return ((hours - START_HOUR) * 60 + minutes) / 60 * HOUR_HEIGHT;
  };

  const timePosition = getCurrentTimePosition();

  const formatCurrentTime = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const displayHour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const getBookingPosition = (booking: Booking) => {
    if (!booking.appointment_time) return { top: 0, height: 30 };
    const [hours, minutes] = booking.appointment_time.split(':').map(Number);
    const top = ((hours - START_HOUR) * 60 + minutes) / 60 * HOUR_HEIGHT;
    let duration = 30;
    if (booking.services && Array.isArray(booking.services)) {
      duration = booking.services.reduce((sum: number, s: any) => sum + (s.duration || 30), 0);
    }
    return { top, height: Math.max((duration / 60) * HOUR_HEIGHT, 40) };
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
    return booking.services.map((s: any) => s.name).join(' • ');
  };

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const columnWidth = Math.max(PROVIDER_COLUMN_MIN_WIDTH, 280);

  // Format header date
  const formatHeaderDate = () => {
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
    const day = selectedDate.getDate();
    const month = selectedDate.toLocaleDateString('en-US', { month: 'short' });
    return `${dayName}, ${day} ${month}`;
  };

  return (
    <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" style={{ minHeight: '700px' }}>
      {/* Left Sidebar - Booksy style */}
      <div className="flex-shrink-0 border-r border-gray-200 bg-white" style={{ width: SIDEBAR_WIDTH }}>
        {/* Month/Year Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-[10px] font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
            {monthCalendar.map((date, idx) => {
              if (!date) return <div key={idx} />;
              const dateStr = formatDateStr(date);
              const isSelected = dateStr === selectedDateStr;
              const isTodayDate = dateStr === formatDateStr(new Date());
              const isCurrentMonth = date.getMonth() === selectedDate.getMonth();

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={`text-xs py-1.5 rounded-md transition-colors ${
                    isSelected
                      ? 'bg-red-500 text-white font-semibold'
                      : isTodayDate
                      ? 'bg-red-100 text-red-600 font-semibold'
                      : isCurrentMonth
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Jump By Week */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 mb-3">Jump By Week</h4>
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={`+${n}`}
                onClick={() => jumpByWeeks(n)}
                className="px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
              >
                +{n}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {[-1, -2, -3, -4, -5, -6].map(n => (
              <button
                key={n}
                onClick={() => jumpByWeeks(n)}
                className="px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Staff and Resources */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowStaffResources(!showStaffResources)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900">Staff and Resources</span>
            {showStaffResources ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {showStaffResources && (
            <div className="px-4 pb-4 space-y-2">
              {providers.map(provider => (
                <div key={provider.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {getInitials(provider.user?.name || '')}
                  </div>
                  <span>{provider.user?.name || 'Staff'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Highlight Section */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowHighlight(!showHighlight)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900">Highlight</span>
            {showHighlight ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 space-y-2">
          <button className="w-full py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            CLEAR
          </button>
          <button className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
            APPLY
          </button>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          {/* Left side - View selector */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              <ChevronRight className="w-4 h-4 text-gray-400 -ml-2" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Day</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Center - Date Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg min-w-[180px] justify-center">
              <span className="text-sm font-semibold text-gray-900">{formatHeaderDate()}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Provider Headers */}
        <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex-shrink-0 border-r border-gray-100" style={{ width: TIME_COLUMN_WIDTH }} />
          <div className="flex overflow-x-auto">
            {providers.map((provider, index) => (
              <div
                key={provider.id}
                className="flex-shrink-0 py-4 px-4 border-r border-gray-100 bg-white"
                style={{ width: columnWidth }}
              >
                <div className="flex items-center gap-3">
                  {provider.user?.profile_image ? (
                    <img
                      src={provider.user.profile_image}
                      alt={provider.user?.name || 'Provider'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {getInitials(provider.user?.name || '')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {provider.user?.name || 'Staff'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                    <span className="text-xs text-gray-400">10:00 AM-7:00 PM</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          <div className="flex relative">
            {/* Time column */}
            <div className="flex-shrink-0 bg-white border-r border-gray-100 sticky left-0 z-10" style={{ width: TIME_COLUMN_WIDTH }}>
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.hour}
                  className="border-b border-gray-50 flex items-start justify-end pr-3 pt-0"
                  style={{ height: HOUR_HEIGHT }}
                >
                  <span className="text-xs text-gray-400 font-medium -mt-2">{slot.label}</span>
                </div>
              ))}
            </div>

            {/* Provider columns */}
            <div className="flex relative">
              {providers.map((provider, providerIndex) => {
                const providerBookings = bookingsByProvider[provider.user_id] || [];

                return (
                  <div
                    key={provider.id}
                    className="flex-shrink-0 relative border-r border-gray-100"
                    style={{ width: columnWidth }}
                  >
                    {/* Grid lines with hatched pattern for unavailable hours */}
                    {TIME_SLOTS.map((slot, slotIdx) => {
                      // Before 10AM and after 7PM are unavailable (hatched)
                      const isUnavailable = slot.hour < 10 || slot.hour >= 19;

                      return (
                        <div
                          key={slot.hour}
                          className="border-b border-gray-50"
                          style={{
                            height: HOUR_HEIGHT,
                            background: isUnavailable
                              ? 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 6px)'
                              : providerIndex % 2 === 1 ? '#FAFAFA' : '#FFFFFF'
                          }}
                        />
                      );
                    })}

                    {/* Bookings */}
                    {providerBookings.map((booking) => {
                      const { top, height } = getBookingPosition(booking);
                      const isPast = isBookingPast(booking);

                      return (
                        <div
                          key={booking.id}
                          onClick={() => onViewBooking(booking)}
                          className={`absolute left-2 right-2 rounded-lg cursor-pointer transition-all hover:shadow-lg overflow-hidden border-l-4 ${
                            isPast ? 'opacity-60' : ''
                          }`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: '#F3E8FF',
                            borderLeftColor: '#9333EA',
                          }}
                        >
                          <div className="p-2 h-full overflow-hidden relative">
                            <div className="text-[11px] font-semibold text-purple-900">
                              {formatTimeRange(booking)}
                            </div>
                            <div className="text-sm font-semibold text-purple-900 truncate">
                              {booking.customer?.name || 'Walk-in'} • {getServiceNames(booking)}
                            </div>
                            {/* Red heart for client-requested bookings */}
                            <div className="absolute top-2 right-2">
                              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Current time indicator */}
              {timePosition !== null && (
                <div
                  className="absolute flex items-center z-20 pointer-events-none"
                  style={{
                    top: `${timePosition}px`,
                    left: 0,
                    right: 0
                  }}
                >
                  <span className="text-xs font-semibold text-red-500 bg-white px-1 -ml-1">
                    {formatCurrentTime()}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-red-500 ml-1" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Add Button */}
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-30">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Empty state */}
      {providers.length === 0 && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No staff members found</p>
            <p className="text-gray-400 text-sm mt-1">Add providers to see the staff calendar</p>
          </div>
        </div>
      )}
    </div>
  );
}

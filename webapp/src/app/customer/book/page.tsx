'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getProfile } from '@/lib/auth';
import { getCustomerLinkedShop, getShopServicesPublic, getShopProvidersPublic, createBooking, getProvidersForServicesPublic } from '@/lib/customer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Store,
  Scissors,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
}

interface Provider {
  id: string;
  user_id: string;
  bio: string | null;
  specialties: string[] | null;
  rating: number | null;
  is_available: boolean;
  user?: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface OperatingHours {
  Monday?: DayHours;
  Tuesday?: DayHours;
  Wednesday?: DayHours;
  Thursday?: DayHours;
  Friday?: DayHours;
  Saturday?: DayHours;
  Sunday?: DayHours;
}

interface Shop {
  id: string;
  name: string;
  logo_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  operating_days: string[] | null;
  operating_hours: OperatingHours | null;
}

type BookingStep = 'services' | 'provider' | 'datetime' | 'confirm';

export default function BookingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Shop data
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  // Booking state
  const [step, setStep] = useState<BookingStep>('services');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Available time slots
  const [availableSlots, setAvailableSlots] = useState<{ value: string; display: string }[]>([]);

  // Provider filtering state
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [noQualifiedProviders, setNoQualifiedProviders] = useState(false);

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

      setUserId(user.id);

      const profile = await getProfile(user.id);
      if (profile?.role === 'owner') {
        router.push('/dashboard');
        return;
      }

      // Get linked shop
      const shopResult = await getCustomerLinkedShop(user.id);
      if (!shopResult.success || !shopResult.shop) {
        router.push('/customer');
        return;
      }

      setShop(shopResult.shop as Shop);

      // Load services and providers
      const [servicesResult, providersResult] = await Promise.all([
        getShopServicesPublic(shopResult.shopId!),
        getShopProvidersPublic(shopResult.shopId!)
      ]);

      if (servicesResult.success && servicesResult.services) {
        setServices(servicesResult.services);
      }

      if (providersResult.success && providersResult.providers) {
        setProviders(providersResult.providers);
        setAllProviders(providersResult.providers);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      }
      return [...prev, service];
    });
  };

  const selectProvider = (provider: Provider | null) => {
    setSelectedProvider(provider);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((sum, s) => sum + s.duration, 0);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  };

  const formatTimeDisplay = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const generateTimeSlots = (dateStr: string) => {
    if (!shop) return [];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // Parse date parts directly to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const dayName = dayNames[date.getDay()] as keyof OperatingHours;

    let openTime = '09:00';
    let closeTime = '17:00';

    // Check per-day hours first
    if (shop.operating_hours && shop.operating_hours[dayName]) {
      const dayHours = shop.operating_hours[dayName];
      if (dayHours?.closed) return [];
      if (dayHours?.open && dayHours?.close) {
        // Handle time format with or without seconds (10:00 or 10:00:00)
        openTime = dayHours.open.substring(0, 5);
        closeTime = dayHours.close.substring(0, 5);
      }
    } else if (shop.opening_time && shop.closing_time) {
      // Fallback to simple hours
      openTime = shop.opening_time.substring(0, 5);
      closeTime = shop.closing_time.substring(0, 5);
    }

    const slots: { value: string; display: string }[] = [];
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    let currentHour = openHour;
    let currentMin = openMin;

    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
      const time24 = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push({
        value: time24,
        display: formatTimeDisplay(time24)
      });
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  };

  const getAvailableDates = () => {
    const dates: { value: string; label: string }[] = [];
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()] as keyof OperatingHours;

      // Check per-day hours first
      if (shop?.operating_hours && shop.operating_hours[dayName]) {
        if (shop.operating_hours[dayName]?.closed) {
          continue; // Shop is closed this day
        }
      } else if (shop?.operating_days && !shop.operating_days.includes(dayName)) {
        // Fallback to simple operating_days
        continue;
      }

      // Format date as YYYY-MM-DD using local timezone (not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      dates.push({
        value: `${year}-${month}-${day}`,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }

    return dates;
  };

  const handleNext = async () => {
    if (step === 'services' && selectedServices.length > 0) {
      // Fetch providers who can perform the selected services
      setLoadingProviders(true);
      setNoQualifiedProviders(false);

      try {
        if (shop) {
          const serviceIds = selectedServices.map(s => s.id);
          const result = await getProvidersForServicesPublic(shop.id, serviceIds);

          if (result.success && result.providers && result.providers.length > 0) {
            // Found qualified providers
            setFilteredProviders(result.providers);
            setProviders(result.providers);
          } else {
            // No qualified providers - show all providers with notice
            setNoQualifiedProviders(true);
            setProviders(allProviders);
            setFilteredProviders([]);
          }
        }
      } catch (err) {
        console.error('Error loading providers:', err);
        // Fall back to all providers
        setProviders(allProviders);
      } finally {
        setLoadingProviders(false);
      }

      setStep('provider');
    } else if (step === 'provider') {
      setStep('datetime');
    } else if (step === 'datetime' && selectedDate && selectedTime) {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'provider') setStep('services');
    else if (step === 'datetime') setStep('provider');
    else if (step === 'confirm') setStep('datetime');
  };

  const handleSubmit = async () => {
    if (!userId || !shop || selectedServices.length === 0 || !selectedDate || !selectedTime) {
      setError('Please complete all booking details');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await createBooking({
        shopId: shop.id,
        customerId: userId,
        barberId: selectedProvider?.user_id,
        services: selectedServices.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration
        })),
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        customerNotes: notes || undefined
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create booking');
      }

      // Send email notifications (non-blocking)
      if (result.booking?.id) {
        fetch('/api/booking/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: result.booking.id }),
        }).catch(err => console.error('Failed to send booking notifications:', err));
      }

      // Redirect to success/bookings page
      router.push('/customer/bookings?success=true');

    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[var(--brand)] animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-dark)] flex flex-col">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 pt-32 flex-1 w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => step === 'services' ? router.push('/customer') : handleBack()}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Book Appointment</h1>
            <p className="text-white/60">{shop.name}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {['services', 'provider', 'datetime', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-[var(--brand)] text-white' :
                ['services', 'provider', 'datetime', 'confirm'].indexOf(step) > i ? 'bg-green-500 text-white' :
                'bg-white/20 text-white/60'
              }`}>
                {['services', 'provider', 'datetime', 'confirm'].indexOf(step) > i ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div className={`w-12 sm:w-20 h-1 mx-1 ${
                  ['services', 'provider', 'datetime', 'confirm'].indexOf(step) > i ? 'bg-green-500' : 'bg-white/20'
                }`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          {/* Services Step */}
          {step === 'services' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="w-5 h-5 text-[var(--brand)]" />
                <h2 className="text-lg font-semibold text-white">Select Services</h2>
              </div>

              {services.length === 0 ? (
                <p className="text-white/60 text-center py-8">No services available</p>
              ) : (
                <div className="space-y-3">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedServices.find(s => s.id === service.id)
                          ? 'border-[var(--brand)] bg-[var(--brand)]/20'
                          : 'border-white/20 hover:border-white/40 bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-white/60 mt-1">{service.description}</p>
                          )}
                          <p className="text-sm text-white/60 mt-1">{service.duration} min</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[var(--brand)]">${service.price}</p>
                          {selectedServices.find(s => s.id === service.id) && (
                            <CheckCircle className="w-5 h-5 text-[var(--brand)] mt-1 ml-auto" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedServices.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-white/80 mb-2">
                    <span>Duration:</span>
                    <span>{getTotalDuration()} min</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold">
                    <span>Total:</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Provider Step */}
          {step === 'provider' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[var(--brand)]" />
                <h2 className="text-lg font-semibold text-white">Select Provider</h2>
              </div>

              {loadingProviders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[var(--brand)] animate-spin" />
                </div>
              ) : (
                <>
                  {noQualifiedProviders && (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-200 text-sm">
                          No providers are specifically assigned to these services. Showing all available providers.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Any Provider Option */}
                    <button
                      onClick={() => selectProvider(null)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedProvider === null
                          ? 'border-[var(--brand)] bg-[var(--brand)]/20'
                          : 'border-white/20 hover:border-white/40 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Any Available Provider</p>
                          <p className="text-sm text-white/60">First available</p>
                        </div>
                        {selectedProvider === null && (
                          <CheckCircle className="w-5 h-5 text-[var(--brand)] ml-auto" />
                        )}
                      </div>
                    </button>

                    {providers.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => selectProvider(provider)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          selectedProvider?.id === provider.id
                            ? 'border-[var(--brand)] bg-[var(--brand)]/20'
                            : 'border-white/20 hover:border-white/40 bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                            {provider.user?.profile_image ? (
                              <img src={provider.user.profile_image} alt={provider.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{provider.user?.name || 'Provider'}</p>
                            {provider.specialties && provider.specialties.length > 0 && (
                              <p className="text-sm text-white/60">{provider.specialties.join(', ')}</p>
                            )}
                            {provider.rating && (
                              <p className="text-sm text-yellow-400">★ {provider.rating.toFixed(1)}</p>
                            )}
                          </div>
                          {selectedProvider?.id === provider.id && (
                            <CheckCircle className="w-5 h-5 text-[var(--brand)]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Date/Time Step */}
          {step === 'datetime' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[var(--brand)]" />
                <h2 className="text-lg font-semibold text-white">Select Date & Time</h2>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm text-white/80 mb-2">Date</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {getAvailableDates().map(date => (
                    <button
                      key={date.value}
                      onClick={() => {
                        setSelectedDate(date.value);
                        setSelectedTime(''); // Reset time when date changes
                        setAvailableSlots(generateTimeSlots(date.value));
                      }}
                      className={`p-3 rounded-lg text-center text-sm transition-all ${
                        selectedDate === date.value
                          ? 'bg-[var(--brand)] text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {date.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm text-white/80 mb-2">Time</label>
                  {availableSlots.length === 0 ? (
                    <p className="text-white/60 text-center py-4">No available time slots for this date</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot.value}
                          onClick={() => setSelectedTime(slot.value)}
                          className={`p-3 rounded-lg text-center text-sm transition-all ${
                            selectedTime === slot.value
                              ? 'bg-[var(--brand)] text-white'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {slot.display}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirm' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-[var(--brand)]" />
                <h2 className="text-lg font-semibold text-white">Confirm Booking</h2>
              </div>

              <div className="space-y-4">
                {/* Services Summary */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/60 mb-2">Services</p>
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex justify-between text-white">
                      <span>{s.name}</span>
                      <span>${s.price}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/20 mt-2 pt-2 flex justify-between font-semibold text-white">
                    <span>Total</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>

                {/* Provider */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/60 mb-1">Provider</p>
                  <p className="text-white font-medium">
                    {selectedProvider ? selectedProvider.user?.name : 'Any Available'}
                  </p>
                </div>

                {/* Date/Time */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-white/60 mb-1">Date & Time</p>
                  <p className="text-white font-medium">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })} at {formatTimeDisplay(selectedTime)}
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm text-white/80 mb-2">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests..."
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-[var(--brand)] outline-none resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/20 flex gap-3">
            {step !== 'services' && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
            )}

            {step !== 'confirm' ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 'services' && selectedServices.length === 0) ||
                  (step === 'datetime' && (!selectedDate || !selectedTime))
                }
                className="flex-1 py-3 bg-[var(--brand)] text-white rounded-xl font-medium hover:bg-[var(--brand)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Booking
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

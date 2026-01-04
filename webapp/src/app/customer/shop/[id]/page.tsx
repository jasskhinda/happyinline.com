'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser, getProfile } from '@/lib/auth';
import {
  getShopById,
  getShopServicesPublic,
  getShopProvidersPublic,
  createBooking,
  ShopPublic,
  ShopServicePublic,
  ProviderPublic
} from '@/lib/customer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ArrowLeft,
  Loader2,
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  BadgeCheck,
  Scissors,
  User,
  Calendar,
  Check,
  X,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Video,
  Link as LinkIcon,
  Lock,
  FileText
} from 'lucide-react';
import { ServiceType } from '@/lib/customer';

export default function ShopDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [shop, setShop] = useState<ShopPublic | null>(null);
  const [services, setServices] = useState<ShopServicePublic[]>([]);
  const [providers, setProviders] = useState<ProviderPublic[]>([]);

  // Booking state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(0); // 0: services, 1: service format (if needed), 2: provider, 3: datetime, 4: confirm
  const [selectedServices, setSelectedServices] = useState<ShopServicePublic[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderPublic | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  // Track service format choice for services that offer both in-person and online
  const [serviceFormatChoices, setServiceFormatChoices] = useState<Record<string, 'in_person' | 'online'>>({});

  useEffect(() => {
    loadData();
  }, [shopId]);

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

      // Load shop details
      const shopResult = await getShopById(shopId);
      if (!shopResult.success || !shopResult.shop) {
        router.push('/customer');
        return;
      }
      setShop(shopResult.shop);

      // Load services
      const servicesResult = await getShopServicesPublic(shopId);
      if (servicesResult.success && servicesResult.services) {
        setServices(servicesResult.services);
      }

      // Load providers
      const providersResult = await getShopProvidersPublic(shopId);
      if (providersResult.success && providersResult.providers) {
        setProviders(providersResult.providers);
      }
    } catch (err) {
      console.error('Failed to load shop:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: ShopServicePublic) => {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const getTotalPrice = () => selectedServices.reduce((sum, s) => sum + s.price, 0);
  const getTotalDuration = () => selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const getAvailableTimes = () => {
    if (!shop?.opening_time || !shop?.closing_time) return [];

    const times: string[] = [];
    const [openHour] = shop.opening_time.split(':').map(Number);
    const [closeHour] = shop.closing_time.split(':').map(Number);

    for (let h = openHour; h < closeHour; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`);
      times.push(`${h.toString().padStart(2, '0')}:30`);
    }

    return times;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleBooking = async () => {
    if (!userId || !shop) return;

    setBookingLoading(true);
    setBookingError('');

    try {
      const result = await createBooking({
        shopId: shop.id,
        customerId: userId,
        barberId: selectedProvider?.user_id,
        services: selectedServices.map(s => {
          // Determine the chosen format for each service
          let chosen_format: 'in_person' | 'online';
          if (s.service_type === 'both') {
            chosen_format = serviceFormatChoices[s.id] || 'in_person';
          } else if (s.service_type === 'online') {
            chosen_format = 'online';
          } else {
            chosen_format = 'in_person';
          }
          return {
            id: s.id,
            name: s.name,
            price: s.price,
            duration: s.duration,
            chosen_format
          };
        }),
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        customerNotes: customerNotes || undefined
      });

      if (result.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          setShowBookingModal(false);
          router.push('/customer/bookings');
        }, 2000);
      } else {
        setBookingError(result.error || 'Failed to create booking');
      }
    } catch (err) {
      setBookingError('An unexpected error occurred');
    } finally {
      setBookingLoading(false);
    }
  };

  const resetBooking = () => {
    setBookingStep(0);
    setSelectedServices([]);
    setSelectedProvider(null);
    setSelectedDate('');
    setSelectedTime('');
    setCustomerNotes('');
    setBookingError('');
    setBookingSuccess(false);
    setServiceFormatChoices({});
  };

  // Check if any selected service needs format choice (has "both" type)
  const needsFormatChoice = () => {
    return selectedServices.some(s => s.service_type === 'both');
  };

  // Get the effective service type for a service
  const getEffectiveServiceType = (service: ShopServicePublic): 'in_person' | 'online' => {
    if (service.service_type === 'both') {
      return serviceFormatChoices[service.id] || 'in_person';
    }
    return service.service_type === 'online' ? 'online' : 'in_person';
  };

  // Check if any selected service will be online
  const hasOnlineService = () => {
    return selectedServices.some(s => getEffectiveServiceType(s) === 'online');
  };

  const isShopOpen = () => {
    if (!shop) return false;
    if (shop.is_manually_closed) return false;

    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    if (!shop.operating_days?.includes(dayName)) return false;

    if (shop.opening_time && shop.closing_time) {
      const currentTime = now.toTimeString().slice(0, 5);
      return currentTime >= shop.opening_time && currentTime <= shop.closing_time;
    }

    return true;
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

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">Shop not found</h2>
          <button
            onClick={() => router.push('/customer')}
            className="text-[#0393d5] hover:text-white transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="w-full px-4 md:px-8 lg:px-12 py-6 pt-32 flex-1">
        {/* Cover & Info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-48 bg-gradient-to-br from-[#0393d5]/30 to-purple-500/30 relative">
            {shop.cover_image_url && (
              <img src={shop.cover_image_url} alt={shop.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
              Available Now
            </div>
          </div>

          {/* Info */}
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {shop.logo_url ? (
                  <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">{shop.name}</h2>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-white font-medium">{shop.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-white/50">({shop.total_reviews || 0} reviews)</span>
                </div>
                {shop.description && (
                  <p className="text-white/70 text-sm">{shop.description}</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {shop.address && (
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="w-4 h-4 text-[#0393d5]" />
                  <span>{shop.address}, {shop.city}</span>
                </div>
              )}
              {shop.phone && (
                <div className="flex items-center gap-2 text-white/80">
                  <Phone className="w-4 h-4 text-[#0393d5]" />
                  <span>{shop.phone}</span>
                </div>
              )}
              {shop.opening_time && shop.closing_time && (
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="w-4 h-4 text-[#0393d5]" />
                  <span>{shop.opening_time} - {shop.closing_time}</span>
                </div>
              )}
              {shop.email && (
                <div className="flex items-center gap-2 text-white/80">
                  <Mail className="w-4 h-4 text-[#0393d5]" />
                  <span>{shop.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-[#0393d5]" />
            Services
          </h3>

          {services.length === 0 ? (
            <p className="text-white/50 text-center py-8">No services available</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-medium">{service.name}</h4>
                      {service.service_type === 'online' && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Online
                        </span>
                      )}
                      {service.service_type === 'both' && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          In-Person / Online
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-sm">
                      {service.duration} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">${service.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Providers */}
        {providers.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#0393d5]" />
              Our Team
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[#0393d5]/20 mx-auto mb-3 overflow-hidden flex items-center justify-center">
                    {provider.user?.profile_image ? (
                      <img src={provider.user.profile_image} alt={provider.user?.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-[#0393d5]" />
                    )}
                  </div>
                  <h4 className="text-white font-medium">{provider.user?.name || 'Provider'}</h4>
                  {provider.rating && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white/70 text-sm">{provider.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book Button */}
        {services.length > 0 && (
          <button
            onClick={() => {
              resetBooking();
              setShowBookingModal(true);
            }}
            className="w-full bg-gradient-to-r from-[#0393d5] to-purple-500 hover:from-[#027bb5] hover:to-purple-600 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Book Appointment
          </button>
        )}
      </main>

      <Footer />

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-lg border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-semibold text-white">
                {bookingSuccess ? 'Booking Confirmed!' : `Book at ${shop.name}`}
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-[#0393d5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">Booking Submitted!</h4>
                  <p className="text-[#0393d5]">Your booking is pending confirmation from the business.</p>
                </div>
              ) : (
                <>
                  {/* Progress Steps */}
                  <div className="flex justify-center gap-2 mb-6">
                    {Array.from({ length: needsFormatChoice() ? 5 : 4 }).map((_, s) => (
                      <div
                        key={s}
                        className={`w-3 h-3 rounded-full transition-all ${
                          s <= bookingStep ? 'bg-[#0393d5]' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>

                  {bookingError && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-200 text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {bookingError}
                    </div>
                  )}

                  {/* Step 0: Select Services */}
                  {bookingStep === 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Select Services</h4>
                      <div className="space-y-2">
                        {services.map((service) => {
                          const isSelected = selectedServices.find(s => s.id === service.id);
                          return (
                            <button
                              key={service.id}
                              onClick={() => toggleService(service)}
                              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                                isSelected
                                  ? 'bg-[#0393d5]/20 border-[#0393d5]'
                                  : 'bg-white/5 border-white/10 hover:border-[#0393d5]/50'
                              }`}
                            >
                              <div className="text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-white font-medium">{service.name}</p>
                                  {service.service_type === 'online' && (
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Video className="w-3 h-3" />
                                      Online
                                    </span>
                                  )}
                                  {service.service_type === 'both' && (
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Video className="w-3 h-3" />
                                      Both
                                    </span>
                                  )}
                                </div>
                                <p className="text-white/50 text-sm">{service.duration} min</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-white font-semibold">${service.price}</span>
                                {isSelected && <Check className="w-5 h-5 text-[#0393d5]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 1: Choose Format (only if any service has "both" type) */}
                  {bookingStep === 1 && needsFormatChoice() && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Choose Service Format</h4>
                      <p className="text-white/60 text-sm mb-4">Some services you selected can be done in-person or online. Please choose your preference.</p>
                      <div className="space-y-4">
                        {selectedServices.filter(s => s.service_type === 'both').map((service) => (
                          <div key={service.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-white font-medium mb-3">{service.name}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setServiceFormatChoices(prev => ({ ...prev, [service.id]: 'in_person' }))}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                                  (serviceFormatChoices[service.id] || 'in_person') === 'in_person'
                                    ? 'bg-[#0393d5]/20 border-[#0393d5] text-white'
                                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                                }`}
                              >
                                <MapPin className="w-5 h-5" />
                                <span className="text-sm font-medium">In-Person</span>
                              </button>
                              <button
                                onClick={() => setServiceFormatChoices(prev => ({ ...prev, [service.id]: 'online' }))}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                                  serviceFormatChoices[service.id] === 'online'
                                    ? 'bg-purple-500/20 border-purple-500 text-white'
                                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                                }`}
                              >
                                <Video className="w-5 h-5" />
                                <span className="text-sm font-medium">Online</span>
                              </button>
                            </div>
                            {serviceFormatChoices[service.id] === 'online' && service.online_instructions && (
                              <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                <p className="text-purple-300 text-sm">{service.online_instructions}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Select Provider (or step 1 if no format choice needed) */}
                  {((bookingStep === 1 && !needsFormatChoice()) || (bookingStep === 2 && needsFormatChoice())) && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Select Provider (Optional)</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedProvider(null)}
                          className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                            !selectedProvider
                              ? 'bg-[#0393d5]/20 border-[#0393d5]'
                              : 'bg-white/5 border-white/10 hover:border-[#0393d5]/50'
                          }`}
                        >
                          <span className="text-white">Any Available Provider</span>
                          {!selectedProvider && <Check className="w-5 h-5 text-[#0393d5]" />}
                        </button>
                        {providers.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => setSelectedProvider(provider)}
                            className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                              selectedProvider?.id === provider.id
                                ? 'bg-[#0393d5]/20 border-[#0393d5]'
                                : 'bg-white/5 border-white/10 hover:border-[#0393d5]/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#0393d5]/20 flex items-center justify-center overflow-hidden">
                                {provider.user?.profile_image ? (
                                  <img src={provider.user.profile_image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-[#0393d5]" />
                                )}
                              </div>
                              <span className="text-white">{provider.user?.name}</span>
                            </div>
                            {selectedProvider?.id === provider.id && <Check className="w-5 h-5 text-[#0393d5]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Select Date & Time (or step 2 if no format choice needed) */}
                  {((bookingStep === 2 && !needsFormatChoice()) || (bookingStep === 3 && needsFormatChoice())) && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Select Date & Time</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#0393d5] mb-2">Date</label>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={getMinDate()}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#0393d5] mb-2">Time</label>
                          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                            {getAvailableTimes().map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                  selectedTime === time
                                    ? 'bg-[#0393d5] text-white'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Confirm (or step 3 if no format choice needed) */}
                  {((bookingStep === 3 && !needsFormatChoice()) || (bookingStep === 4 && needsFormatChoice())) && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Confirm Booking</h4>
                      <div className="space-y-4">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h5 className="text-[#0393d5] text-sm font-medium mb-2">Services</h5>
                          {selectedServices.map(s => (
                            <div key={s.id} className="flex justify-between text-white text-sm py-1">
                              <div className="flex items-center gap-2">
                                <span>{s.name}</span>
                                {getEffectiveServiceType(s) === 'online' && (
                                  <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                                    Online
                                  </span>
                                )}
                              </div>
                              <span>${s.price}</span>
                            </div>
                          ))}
                          <div className="border-t border-white/10 mt-2 pt-2 flex justify-between text-white font-semibold">
                            <span>Total</span>
                            <span>${getTotalPrice().toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Online Meeting Details */}
                        {hasOnlineService() && (
                          <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                            <h5 className="text-purple-300 text-sm font-medium mb-2 flex items-center gap-2">
                              <Video className="w-4 h-4" />
                              Online Meeting Details
                            </h5>
                            {selectedServices.filter(s => getEffectiveServiceType(s) === 'online').map(s => (
                              <div key={s.id} className="mb-3 last:mb-0">
                                <p className="text-white font-medium text-sm">{s.name}</p>
                                {s.online_meeting_link && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <LinkIcon className="w-3 h-3 text-purple-400" />
                                    <a href={s.online_meeting_link} target="_blank" rel="noopener noreferrer" className="text-purple-300 text-sm hover:underline break-all">
                                      {s.online_meeting_link}
                                    </a>
                                  </div>
                                )}
                                {s.online_meeting_password && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Lock className="w-3 h-3 text-purple-400" />
                                    <span className="text-purple-300 text-sm">Password: {s.online_meeting_password}</span>
                                  </div>
                                )}
                                {s.online_instructions && (
                                  <p className="text-purple-300/70 text-xs mt-1">{s.online_instructions}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h5 className="text-[#0393d5] text-sm font-medium mb-2">Appointment</h5>
                          <p className="text-white">{selectedDate} at {selectedTime}</p>
                          <p className="text-white/70 text-sm">
                            Provider: {selectedProvider?.user?.name || 'Any Available'}
                          </p>
                          <p className="text-white/70 text-sm">Duration: ~{getTotalDuration()} min</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#0393d5] mb-2">Notes (Optional)</label>
                          <textarea
                            value={customerNotes}
                            onChange={(e) => setCustomerNotes(e.target.value)}
                            placeholder="Any special requests..."
                            rows={2}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5] resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!bookingSuccess && (
              <div className="p-6 border-t border-white/10 flex-shrink-0">
                {/* Show summary on step 0 when services are selected */}
                {bookingStep === 0 && selectedServices.length > 0 && (
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-white/70">
                        <Clock className="w-4 h-4" />
                        <span>{getTotalDuration()} min</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <DollarSign className="w-4 h-4 text-[#0393d5]" />
                        <span>${getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/50">
                      {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  {bookingStep > 0 && (
                    <button
                      onClick={() => setBookingStep(bookingStep - 1)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                  )}
                  {(() => {
                    const maxStep = needsFormatChoice() ? 4 : 3;
                    const dateTimeStep = needsFormatChoice() ? 3 : 2;
                    const isLastStep = bookingStep === maxStep;

                    if (!isLastStep) {
                      return (
                        <button
                          onClick={() => setBookingStep(bookingStep + 1)}
                          disabled={
                            (bookingStep === 0 && selectedServices.length === 0) ||
                            (bookingStep === dateTimeStep && (!selectedDate || !selectedTime))
                          }
                          className="flex-1 bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          Continue
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      );
                    } else {
                      return (
                        <button
                          onClick={handleBooking}
                          disabled={bookingLoading}
                          className="flex-1 bg-gradient-to-r from-[#0393d5] to-purple-500 hover:from-[#027bb5] hover:to-purple-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {bookingLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Booking...
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              Confirm Booking
                            </>
                          )}
                        </button>
                      );
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

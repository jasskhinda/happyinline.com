'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  getShopById,
  getShopServicesPublic,
  getShopProvidersPublic,
  ShopPublic,
  ShopServicePublic,
  ProviderPublic
} from '@/lib/customer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Loader2,
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  BadgeCheck,
  Scissors,
  User,
  DollarSign,
  Calendar,
  ExternalLink,
  Video,
  Briefcase
} from 'lucide-react';

export default function StorePreviewPage() {
  const params = useParams();
  const shopId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<ShopPublic | null>(null);
  const [services, setServices] = useState<ShopServicePublic[]>([]);
  const [providers, setProviders] = useState<ProviderPublic[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [shopId]);

  const loadData = async () => {
    try {
      // Load shop details
      const shopResult = await getShopById(shopId);
      if (!shopResult.success || !shopResult.shop) {
        setError('Shop not found');
        setLoading(false);
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
      setError('Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
          <p className="text-[#0393d5]">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Store Not Found</h2>
          <p className="text-[#0393d5]">{error || 'This store does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 py-8 pt-32 flex-1 w-full">
        {/* Preview Banner */}
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
          <ExternalLink className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-200 font-medium">Store Preview Mode</p>
            <p className="text-yellow-200/70 text-sm">This is how your customers will see your store.</p>
          </div>
        </div>

        {/* Shop Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 mb-6">
          {/* Cover Image */}
          {shop.cover_image_url ? (
            <div className="h-48 md:h-64 bg-cover bg-center" style={{ backgroundImage: `url(${shop.cover_image_url})` }} />
          ) : (
            <div className="h-48 md:h-64 bg-gradient-to-r from-[#0393d5]/30 to-purple-500/30" />
          )}

          <div className="p-6 -mt-16 relative">
            {/* Logo */}
            <div className="flex items-end gap-4 mb-4">
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt={shop.name}
                  className="w-24 h-24 rounded-2xl border-4 border-[#0a3a6b] object-cover bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-[#0a3a6b] bg-[#0393d5]/20 flex items-center justify-center">
                  <Store className="w-10 h-10 text-[#0393d5]" />
                </div>
              )}
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{shop.name}</h1>
                  {shop.status === 'approved' && (
                    <BadgeCheck className="w-6 h-6 text-[#0393d5]" />
                  )}
                </div>
                {shop.rating !== null && shop.rating > 0 && (
                  <div className="flex items-center gap-1 text-yellow-400 mt-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{shop.rating.toFixed(1)}</span>
                    <span className="text-white/60 text-sm">({shop.total_reviews || 0} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {shop.description && (
              <p className="text-white/80 mb-4">{shop.description}</p>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {shop.address && (
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="w-4 h-4 text-[#0393d5]" />
                  <span className="text-sm">{shop.address}, {shop.city}, {shop.state} {shop.zip_code}</span>
                </div>
              )}
              {shop.phone && (
                <div className="flex items-center gap-2 text-white/70">
                  <Phone className="w-4 h-4 text-[#0393d5]" />
                  <span className="text-sm">{shop.phone}</span>
                </div>
              )}
              {shop.email && (
                <div className="flex items-center gap-2 text-white/70">
                  <Mail className="w-4 h-4 text-[#0393d5]" />
                  <span className="text-sm">{shop.email}</span>
                </div>
              )}
              {shop.opening_time && shop.closing_time && (
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="w-4 h-4 text-[#0393d5]" />
                  <span className="text-sm">{formatTime(shop.opening_time)} - {formatTime(shop.closing_time)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services */}
          <div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#0393d5]" />
                Services
              </h2>

              {services.length > 0 ? (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-medium">{service.name}</h3>
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
                          {service.description && (
                            <p className="text-white/60 text-sm mt-1">{service.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[#0393d5] font-semibold flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {service.price?.toFixed(2)}
                          </p>
                          <p className="text-white/50 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration} min
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Scissors className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">No services added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Join Our Team, Our Team, Hours */}
          <div className="space-y-6">
            {/* Join Our Team - Hiring Section */}
            {shop.is_hiring && shop.careers_form_url && (
              <div className="bg-gradient-to-r from-[#0393d5]/20 to-[#027bb5]/20 backdrop-blur-lg rounded-2xl p-6 border border-[#0393d5]/30">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-[#0393d5]/20 p-3 rounded-xl">
                    <Briefcase className="w-6 h-6 text-[#0393d5]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {shop.hiring_title || 'JOIN OUR TEAM!'}
                    </h2>
                    <p className="text-white/90 mb-1">
                      {shop.hiring_subtitle || 'Schedule your Zoom or In Person Interview here'}
                    </p>
                    <p className="text-[#0393d5] font-semibold text-lg">
                      {shop.hiring_tagline || 'Your New Career, STARTS HERE!'}
                    </p>
                  </div>
                </div>
                <a
                  href={shop.careers_form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold px-8 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  <Briefcase className="w-5 h-5" />
                  APPLY NOW
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Operating Hours */}
            {shop.operating_days && shop.operating_days.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0393d5]" />
                  Hours
                </h2>
                <div className="space-y-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isOpen = shop.operating_days?.includes(day);
                    return (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-white/70">{day}</span>
                        <span className={isOpen ? 'text-green-400' : 'text-red-400'}>
                          {isOpen ? `${formatTime(shop.opening_time || '')} - ${formatTime(shop.closing_time || '')}` : 'Closed'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSubscriptionStatus } from '@/lib/auth';
import { createShop, getMyShop } from '@/lib/shop';
import { getSupabaseClient } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Store,
  FileText,
  Image as ImageIcon,
  Plus,
  X,
  DollarSign,
  Timer,
  Camera
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export default function CreateShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Image refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Images
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('USA');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [operatingDays, setOperatingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');

  // Services
  const [services, setServices] = useState<Service[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration: '30' });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Check subscription
      const subStatus = await getSubscriptionStatus(user.id);
      if (!subStatus?.isActive) {
        router.push('/subscribe');
        return;
      }

      // Check if already has a shop
      const { shop } = await getMyShop(user.id);
      if (shop) {
        router.push('/shop/settings');
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error('Error checking access:', err);
      router.push('/dashboard');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter(d => d !== day));
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  const handleAddService = () => {
    if (!newService.name || !newService.price) return;

    const service: Service = {
      id: Date.now().toString(),
      name: newService.name,
      description: newService.description,
      price: parseFloat(newService.price),
      duration: parseInt(newService.duration) || 30
    };

    setServices([...services, service]);
    setNewService({ name: '', description: '', price: '', duration: '30' });
    setShowServiceModal(false);
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const uploadImage = async (file: File, shopId: string, type: 'logo' | 'cover'): Promise<string | null> => {
    try {
      const supabase = getSupabaseClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('shop-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      return null;
    }
  };

  const handleCreate = async () => {
    if (!userId) return;

    setSaving(true);
    setError('');

    try {
      // Create shop first
      const result = await createShop(userId, {
        name,
        description,
        address,
        city,
        state,
        zip_code: zipCode,
        country,
        phone,
        email,
        operating_days: operatingDays,
        opening_time: openingTime,
        closing_time: closingTime
      });

      if (!result.success || !result.shop) {
        setError(result.error || 'Failed to create business');
        setSaving(false);
        return;
      }

      const shopId = result.shop.id;
      const supabase = getSupabaseClient();

      // Upload images
      let logoUrl = null;
      let coverUrl = null;

      if (logoImage) {
        logoUrl = await uploadImage(logoImage, shopId, 'logo');
      }
      if (coverImage) {
        coverUrl = await uploadImage(coverImage, shopId, 'cover');
      }

      // Update shop with image URLs
      if (logoUrl || coverUrl) {
        await supabase
          .from('shops')
          .update({
            logo_url: logoUrl,
            cover_image_url: coverUrl
          })
          .eq('id', shopId);
      }

      // Add services
      for (const service of services) {
        await supabase
          .from('shop_services')
          .insert({
            shop_id: shopId,
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            is_active: true
          });
      }

      router.push('/dashboard?shop_created=true');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Validation
  const isStep0Valid = logoPreview && coverPreview;
  const isStep1Valid = name.length >= 2 && phone;
  const isStep2Valid = address && city && state && zipCode;
  const isStep3Valid = services.length >= 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--brand)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--brand)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-dark)] flex flex-col">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 py-8 pt-32 flex-1 w-full">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {['Images', 'Details', 'Location', 'Services', 'Hours'].map((label, s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    s < step ? 'bg-green-500 text-white' :
                    s === step ? 'bg-[var(--brand)] text-white' : 'bg-white/20 text-white/50'
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s + 1}
                </div>
                {s < 4 && <div className={`w-8 h-0.5 ${s < step ? 'bg-green-500' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 0: Images */}
        {step === 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[var(--brand)] rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Shop Images</h2>
              <p className="text-[var(--brand)]">Upload your logo and cover image</p>
            </div>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Shop Logo * <span className="text-white/50">(Square, 1:1 ratio)</span>
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className={`w-full h-40 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center ${
                    logoPreview ? 'border-green-500 bg-green-500/10' : 'border-white/30 hover:border-[var(--brand)] bg-white/5'
                  }`}
                >
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="w-24 h-24 rounded-xl object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-white/50 mb-2" />
                      <span className="text-white/70">Tap to upload logo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Cover Upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Cover Image * <span className="text-white/50">(Wide, 16:9 ratio)</span>
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className={`w-full h-48 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center ${
                    coverPreview ? 'border-green-500 p-0 overflow-hidden' : 'border-white/30 hover:border-[var(--brand)] bg-white/5'
                  }`}
                >
                  {coverPreview ? (
                    <div className="relative w-full h-full">
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                        <span className="text-white ml-2">Change Cover</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-white/50 mb-2" />
                      <span className="text-white/70">Tap to upload cover image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!isStep0Valid}
              className="w-full mt-8 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[var(--brand)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Business Details</h2>
              <p className="text-[var(--brand)]">Tell us about your business</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Business Name"
                    maxLength={50}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-[var(--brand)]" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell customers about your shop..."
                    rows={3}
                    maxLength={200}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
                <p className="text-right text-white/40 text-xs mt-1">{description.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand)]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Email (optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shop@example.com"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(0)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[var(--brand)] rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Location Details</h2>
              <p className="text-[var(--brand)]">Where is your business located?</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address"
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city name"
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Enter state"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                    Zip Code *
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Enter zip code"
                    maxLength={10}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!isStep2Valid}
                className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Services */}
        {step === 3 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[var(--brand)] rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Services *</h2>
              <p className="text-[var(--brand)]">Add at least one service</p>
            </div>

            {/* Add Service Button */}
            <button
              onClick={() => setShowServiceModal(true)}
              className="w-full bg-[var(--brand)]/20 hover:bg-[var(--brand)]/30 border border-[var(--brand)] text-[var(--brand)] font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mb-6"
            >
              <Plus className="w-5 h-5" />
              Add Service
            </button>

            {/* Services List */}
            {services.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <DollarSign className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/60">No services added yet</p>
                <p className="text-white/40 text-sm">Add at least 1 service to continue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{service.name}</p>
                        <p className="text-white/60 text-sm">
                          ${service.price.toFixed(2)} • {service.duration} min
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveService(service.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!isStep3Valid}
                className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Hours */}
        {step === 4 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[var(--brand)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Operating Hours</h2>
              <p className="text-[var(--brand)]">When are you open?</p>
            </div>

            <div className="space-y-6">
              {/* Operating Days */}
              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-3">
                  Operating Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        operatingDays.includes(day)
                          ? 'bg-[var(--brand)] text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-[var(--brand)]/10 border border-[var(--brand)]/30 rounded-xl p-4 mt-6 flex gap-3">
              <Store className="w-6 h-6 text-[var(--brand)] flex-shrink-0" />
              <p className="text-white/80 text-sm">
                After listing your business, you can add service providers (counted toward your plan) from the Providers page.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mt-6 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Store className="w-5 h-5" />
                    List Business
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--primary)] rounded-2xl p-6 max-w-md w-full border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add Service</h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g., Haircut"
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                    Price ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand)]" />
                    <input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-10 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--brand)] mb-2">
                    Duration (min)
                  </label>
                  <div className="relative">
                    <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand)]" />
                    <input
                      type="number"
                      value={newService.duration}
                      onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                      placeholder="30"
                      min="5"
                      step="5"
                      className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-10 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowServiceModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={!newService.name || !newService.price}
                className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

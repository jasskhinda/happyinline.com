'use client';

import { useState, useEffect } from 'react';
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
  Globe,
  Clock,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Store,
  FileText
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface BusinessType {
  id: string;
  name: string;
  description: string;
}

export default function CreateShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [operatingDays, setOperatingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');

  // Category & Business Type
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (step === 1) {
      loadCategories();
    }
  }, [step]);

  useEffect(() => {
    if (selectedCategory) {
      loadBusinessTypes(selectedCategory.id);
    }
  }, [selectedCategory]);

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

  const loadCategories = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('get_business_categories');
      if (!error && data) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadBusinessTypes = async (categoryId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('get_business_types_by_category', {
        p_category_id: categoryId
      });
      if (!error && data) {
        setBusinessTypes(data);
        setSelectedBusinessType(null);
      }
    } catch (err) {
      console.error('Error loading business types:', err);
    }
  };

  const toggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter(d => d !== day));
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  const handleCreate = async () => {
    if (!userId) return;

    setSaving(true);
    setError('');

    try {
      const result = await createShop(userId, {
        name,
        description,
        address,
        city,
        state,
        zip_code: zipCode,
        phone,
        email,
        website,
        operating_days: operatingDays,
        opening_time: openingTime,
        closing_time: closingTime,
        category_id: selectedCategory?.id,
        business_type_id: selectedBusinessType?.id
      });

      if (result.success) {
        router.push('/dashboard?shop_created=true');
      } else {
        setError(result.error || 'Failed to create business');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const isStep0Valid = name.length >= 2;
  const isStep1Valid = selectedCategory && selectedBusinessType;
  const isStep2Valid = address && city;

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
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 pt-32 flex-1 w-full">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${
                  s <= step ? 'bg-[#0393d5]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#0393d5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Business Details</h2>
              <p className="text-[#0393d5]">Tell us about your business</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Business Name"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-[#0393d5]" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your business..."
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Business Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@yourbusiness.com"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Website (optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!isStep0Valid}
              className="w-full mt-8 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 1: Category & Business Type */}
        {step === 1 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              What type of business?
            </h2>
            <p className="text-[#0393d5] text-center mb-6">
              Select your industry and business type
            </p>

            {/* Category Selection */}
            <h3 className="text-lg font-semibold text-white mb-4">Industry</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    selectedCategory?.id === category.id
                      ? 'bg-[#0393d5] border-2 border-[#0393d5]'
                      : 'bg-white/10 border-2 border-transparent hover:border-[#0393d5]/50'
                  }`}
                >
                  <p className="text-white font-medium text-sm">{category.name}</p>
                </button>
              ))}
            </div>

            {/* Business Type Selection */}
            {selectedCategory && businessTypes.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Business Type</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
                  {businessTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedBusinessType(type)}
                      className={`w-full p-4 rounded-lg text-left transition-all flex items-center justify-between ${
                        selectedBusinessType?.id === type.id
                          ? 'bg-[#0393d5]/30 border-2 border-[#0393d5]'
                          : 'bg-white/5 border-2 border-transparent hover:border-[#0393d5]/30'
                      }`}
                    >
                      <div>
                        <p className="text-white font-medium">{type.name}</p>
                        <p className="text-white/50 text-sm">{type.description}</p>
                      </div>
                      {selectedBusinessType?.id === type.id && (
                        <Check className="w-5 h-5 text-[#0393d5]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
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
                className="flex-1 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="w-20 h-20 bg-[#0393d5] rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Location</h2>
              <p className="text-[#0393d5]">Where is your business located?</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street"
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0393d5] mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0393d5] mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="12345"
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
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
                className="flex-1 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Hours */}
        {step === 3 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#0393d5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Business Hours</h2>
              <p className="text-[#0393d5]">When are you open?</p>
            </div>

            <div className="space-y-6">
              {/* Operating Days */}
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-3">
                  Operating Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        operatingDays.includes(day)
                          ? 'bg-[#0393d5] text-white'
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
                  <label className="block text-sm font-medium text-[#0393d5] mb-2">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0393d5] mb-2">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mt-6 text-red-200 text-sm">
                {error}
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
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Business
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

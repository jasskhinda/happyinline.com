'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSubscriptionStatus } from '@/lib/auth';
import { getMyShop, updateShop, toggleShopStatus, submitShopForReview, deleteShop, Shop } from '@/lib/shop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Save,
  Loader2,
  Store,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Power,
  Send
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ShopSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shop, setShop] = useState<Shop | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

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
  const [operatingDays, setOperatingDays] = useState<string[]>([]);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const subStatus = await getSubscriptionStatus(user.id);
      if (!subStatus?.isActive) {
        router.push('/subscribe');
        return;
      }

      const { shop: userShop, error: shopError } = await getMyShop(user.id);
      if (shopError || !userShop) {
        router.push('/shop/create');
        return;
      }

      setShop(userShop);
      // Populate form
      setName(userShop.name || '');
      setDescription(userShop.description || '');
      setAddress(userShop.address || '');
      setCity(userShop.city || '');
      setState(userShop.state || '');
      setZipCode(userShop.zip_code || '');
      setPhone(userShop.phone || '');
      setEmail(userShop.email || '');
      setWebsite(userShop.website || '');
      setOperatingDays(userShop.operating_days || []);
      setOpeningTime(userShop.opening_time || '09:00');
      setClosingTime(userShop.closing_time || '18:00');
    } catch (err) {
      console.error('Error loading shop:', err);
      setError('Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter(d => d !== day));
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  const handleSave = async () => {
    if (!shop) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateShop(shop.id, {
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
        closing_time: closingTime
      });

      if (result.success) {
        setSuccess('Changes saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to save changes');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!shop) return;

    try {
      const result = await toggleShopStatus(shop.id, !shop.is_manually_closed);
      if (result.success) {
        setShop({ ...shop, is_manually_closed: !shop.is_manually_closed });
        setSuccess(shop.is_manually_closed ? 'Shop is now open!' : 'Shop is now closed.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to toggle status');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    }
  };

  const handleSubmitForReview = async () => {
    if (!shop) return;

    try {
      const result = await submitShopForReview(shop.id);
      if (result.success) {
        setShop({ ...shop, status: 'pending_review' });
        setSuccess('Shop submitted for review! We\'ll review it within 24-48 hours.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(result.error || 'Failed to submit for review');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    }
  };

  const handleDelete = async () => {
    if (!shop || deleteConfirm !== shop.name) return;

    setDeleting(true);
    try {
      const result = await deleteShop(shop.id);
      if (result.success) {
        router.push('/dashboard?shop_deleted=true');
      } else {
        setError(result.error || 'Failed to delete shop');
        setDeleting(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setDeleting(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="w-full px-4 md:px-8 lg:px-12 py-8 pt-32 flex-1">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 text-green-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Shop Status Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Shop Status</h2>
              <p className="text-[#0393d5] text-sm">
                Status: <span className="capitalize">{shop?.status}</span>
                {shop?.is_manually_closed && ' (Manually Closed)'}
              </p>
            </div>
            <div className="flex gap-3">
              {shop?.status === 'draft' && (
                <button
                  onClick={handleSubmitForReview}
                  className="flex items-center gap-2 bg-[#0393d5] hover:bg-[#027bb5] text-white px-4 py-2 rounded-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  Submit for Review
                </button>
              )}
              {shop?.status === 'approved' && (
                <button
                  onClick={handleToggleStatus}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    shop.is_manually_closed
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {shop.is_manually_closed ? 'Open Shop' : 'Close Shop'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Store className="w-6 h-6 text-[#0393d5]" />
            Business Details
          </h2>

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
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0393d5] mb-2">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#0393d5]" />
            Location
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#0393d5] mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0393d5] mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#0393d5]" />
            Operating Hours
          </h2>

          <div className="space-y-5">
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
        </div>

        {/* Save Button */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold px-6 py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Danger Zone
          </h2>
          <p className="text-red-200/80 text-sm mb-4">
            Deleting your business will permanently remove all data including providers, services, and bookings.
            This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-all border border-red-500/30"
          >
            <Trash2 className="w-4 h-4" />
            Delete Business
          </button>
        </div>
      </main>

      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl p-6 max-w-md w-full border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Delete Business</h3>
            <p className="text-white/80 text-sm mb-4">
              This will permanently delete <strong>{shop?.name}</strong> and all associated data.
              Type the business name to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={shop?.name}
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== shop?.name || deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

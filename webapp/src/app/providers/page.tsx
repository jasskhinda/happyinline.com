'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSubscriptionStatus, SubscriptionStatus } from '@/lib/auth';
import {
  getMyShop,
  getShopProviders,
  updateProvider,
  removeProvider,
  Shop,
  ShopStaff
} from '@/lib/shop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Loader2,
  Users,
  Plus,
  Phone,
  Mail,
  X,
  AlertCircle,
  Check,
  UserCircle,
  Star,
  Edit,
  Trash2,
  User,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ProvidersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [providers, setProviders] = useState<ShopStaff[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ShopStaff | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add provider form state
  const [providerName, setProviderName] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [addingProvider, setAddingProvider] = useState(false);

  // New provider credentials (shown after creation)
  const [newProviderCredentials, setNewProviderCredentials] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Edit provider form state
  const [editBio, setEditBio] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');
  const [editIsAvailable, setEditIsAvailable] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Remove provider state
  const [removingProvider, setRemovingProvider] = useState(false);

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

      const subStatus = await getSubscriptionStatus(user.id);
      setSubscription(subStatus);

      if (!subStatus?.isActive) {
        router.push('/subscribe');
        return;
      }

      const shopResult = await getMyShop(user.id);
      if (!shopResult.success || !shopResult.shop) {
        router.push('/shop/create');
        return;
      }

      setShop(shopResult.shop);

      const providersResult = await getShopProviders(shopResult.shop.id);
      if (providersResult.success && providersResult.providers) {
        setProviders(providersResult.providers);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async () => {
    if (!shop || !userId || !providerName.trim() || !providerEmail.trim()) {
      setError('Please fill in name and email');
      return;
    }

    // Check license limit
    const maxLicenses = subscription?.max_licenses || 0;
    if (providers.length >= maxLicenses) {
      setError(`You've reached your license limit of ${maxLicenses} providers. Upgrade your plan to add more.`);
      return;
    }

    setAddingProvider(true);
    setError('');

    try {
      const response = await fetch('/api/providers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId: shop.id,
          ownerId: userId,
          name: providerName.trim(),
          email: providerEmail.trim(),
          phone: providerPhone.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to add provider');
        return;
      }

      // If new user was created, show credentials
      if (result.isNewUser && result.generatedPassword) {
        setNewProviderCredentials({
          email: providerEmail.trim(),
          password: result.generatedPassword,
          name: providerName.trim(),
        });
        setShowAddModal(false);
        setShowCredentialsModal(true);
      } else {
        setSuccess('Provider added successfully!');
        setShowAddModal(false);
      }

      resetAddForm();
      loadData();
    } catch (err) {
      setError('Failed to add provider');
    } finally {
      setAddingProvider(false);
    }
  };

  const resetAddForm = () => {
    setProviderName('');
    setProviderEmail('');
    setProviderPhone('');
  };

  const handleEditProvider = (provider: ShopStaff) => {
    setSelectedProvider(provider);
    setEditBio(provider.bio || '');
    setEditSpecialties(provider.specialties?.join(', ') || '');
    setEditIsAvailable(provider.is_available);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProvider) return;

    setSavingEdit(true);
    setError('');

    try {
      const specialtiesArray = editSpecialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const result = await updateProvider(selectedProvider.id, {
        bio: editBio || null,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : null,
        is_available: editIsAvailable
      });

      if (result.success) {
        setSuccess('Provider updated successfully!');
        setShowEditModal(false);
        setSelectedProvider(null);
        loadData();
      } else {
        setError(result.error || 'Failed to update provider');
      }
    } catch (err) {
      setError('Failed to update provider');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemoveClick = (provider: ShopStaff) => {
    setSelectedProvider(provider);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedProvider) return;

    setRemovingProvider(true);
    setError('');

    try {
      const result = await removeProvider(selectedProvider.id);
      if (result.success) {
        setSuccess('Provider removed successfully!');
        setShowRemoveModal(false);
        setSelectedProvider(null);
        loadData();
      } else {
        setError(result.error || 'Failed to remove provider');
      }
    } catch (err) {
      setError('Failed to remove provider');
    } finally {
      setRemovingProvider(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const maxLicenses = subscription?.max_licenses || 0;
  const licensesUsed = providers.length;
  const canAddProvider = licensesUsed < maxLicenses;

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
        {/* Success Message */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-200">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* License Usage Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0393d5]/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#0393d5]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">License Usage</h2>
                <p className="text-[#0393d5]">
                  {licensesUsed} of {maxLicenses} providers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Progress bar */}
              <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                <div
                  className={`h-full rounded-full transition-all ${
                    licensesUsed >= maxLicenses ? 'bg-red-500' : 'bg-[#0393d5]'
                  }`}
                  style={{ width: `${Math.min((licensesUsed / maxLicenses) * 100, 100)}%` }}
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                disabled={!canAddProvider}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  canAddProvider
                    ? 'bg-[#0393d5] hover:bg-[#027bb5] text-white'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5" />
                Add Provider
              </button>
            </div>
          </div>
          {!canAddProvider && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm">
                You&apos;ve reached your provider limit.
                <button
                  onClick={() => router.push('/manage')}
                  className="text-yellow-400 hover:text-yellow-300 underline ml-1"
                >
                  Upgrade your plan
                </button>
                {' '}to add more providers.
              </p>
            </div>
          )}
        </div>

        {/* Providers List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Your Team</h3>
            <p className="text-[#0393d5] text-sm mt-1">
              Manage your service providers
            </p>
          </div>

          {providers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-white mb-2">No Providers Yet</h4>
              <p className="text-[#0393d5] mb-6">
                Add your first team member to start managing bookings
              </p>
              {canAddProvider && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Provider
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {providers.map((provider) => (
                <div key={provider.id} className="p-6 flex items-center gap-4 flex-wrap">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-[#0393d5]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {provider.user?.profile_image ? (
                      <img
                        src={provider.user.profile_image}
                        alt={provider.user?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-10 h-10 text-[#0393d5]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-lg font-medium text-white truncate">
                        {provider.user?.name || 'Unknown User'}
                      </h4>
                      <span className="text-xs bg-[#0393d5]/20 text-[#0393d5] px-2 py-0.5 rounded-full">
                        Provider
                      </span>
                    </div>
                    <p className="text-[#0393d5] text-sm truncate">
                      {provider.user?.email}
                    </p>
                    {provider.user?.phone && (
                      <p className="text-white/60 text-sm">{provider.user.phone}</p>
                    )}
                    {provider.specialties && provider.specialties.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {provider.specialties.slice(0, 3).map((specialty, idx) => (
                          <span key={idx} className="text-xs bg-white/10 text-white/80 px-2 py-0.5 rounded">
                            {specialty}
                          </span>
                        ))}
                        {provider.specialties.length > 3 && (
                          <span className="text-xs text-[#0393d5]">+{provider.specialties.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  {provider.rating && (
                    <div className="text-center hidden sm:block">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-white font-medium">{provider.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-[#0393d5] text-xs">{provider.total_reviews || 0} reviews</p>
                    </div>
                  )}

                  {/* Status */}
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    provider.is_available
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {provider.is_available ? 'Available' : 'Unavailable'}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditProvider(provider)}
                      className="p-2 text-[#0393d5] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveClick(provider)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Add Provider</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetAddForm();
                  setError('');
                }}
                className="text-[#0393d5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="email"
                    value={providerEmail}
                    onChange={(e) => setProviderEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                  <input
                    type="tel"
                    value={providerPhone}
                    onChange={(e) => setProviderPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-[#0393d5]/10 border border-[#0393d5]/30 rounded-lg p-4">
                <p className="text-[#0393d5] text-sm">
                  A temporary password will be generated for the provider. Share these credentials so they can log in and view their bookings.
                </p>
              </div>

              {/* Error in modal */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Add Button */}
              <button
                onClick={handleAddProvider}
                disabled={!providerName.trim() || !providerEmail.trim() || addingProvider}
                className="w-full bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingProvider ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Provider
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Credentials Modal */}
      {showCredentialsModal && newProviderCredentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Provider Created!</h3>
                  <p className="text-[#0393d5] text-sm">Share these login credentials</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Provider Name</p>
                <p className="text-white font-medium">{newProviderCredentials.name}</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Email</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-medium truncate">{newProviderCredentials.email}</p>
                  <button
                    onClick={() => copyToClipboard(newProviderCredentials.email)}
                    className="p-2 text-[#0393d5] hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Temporary Password</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-medium font-mono">
                    {showPassword ? newProviderCredentials.password : '••••••••••'}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-[#0393d5] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(newProviderCredentials.password)}
                      className="p-2 text-[#0393d5] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  <strong>Important:</strong> Save these credentials now. The password cannot be retrieved later. The provider should change their password after logging in.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setNewProviderCredentials(null);
                  setShowPassword(false);
                }}
                className="w-full bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium py-3 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Provider Modal */}
      {showEditModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Edit Provider</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProvider(null);
                }}
                className="text-[#0393d5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Provider Info */}
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-[#0393d5]/20 flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-[#0393d5]" />
                </div>
                <div>
                  <p className="text-white font-medium">{selectedProvider.user?.name}</p>
                  <p className="text-[#0393d5] text-sm">{selectedProvider.user?.email}</p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Short bio about this provider..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5] resize-none"
                />
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Specialties
                </label>
                <input
                  type="text"
                  value={editSpecialties}
                  onChange={(e) => setEditSpecialties(e.target.value)}
                  placeholder="Haircuts, Fades, Beard Trim (comma separated)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                />
                <p className="text-[#0393d5] text-xs mt-1">Separate multiple specialties with commas</p>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10">
                <div>
                  <p className="text-white font-medium">Available for Bookings</p>
                  <p className="text-[#0393d5] text-sm">Toggle provider availability</p>
                </div>
                <button
                  onClick={() => setEditIsAvailable(!editIsAvailable)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    editIsAvailable ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    editIsAvailable ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="w-full bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Provider Modal */}
      {showRemoveModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Remove Provider</h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-white mb-2">
                  Are you sure you want to remove <strong>{selectedProvider.user?.name}</strong>?
                </p>
                <p className="text-[#0393d5] text-sm">
                  This will remove them from your business. They will no longer be able to receive bookings.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveModal(false);
                    setSelectedProvider(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  disabled={removingProvider}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {removingProvider ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove Provider'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

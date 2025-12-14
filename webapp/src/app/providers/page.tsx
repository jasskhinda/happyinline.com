'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSubscriptionStatus, SubscriptionStatus } from '@/lib/auth';
import {
  getMyShop,
  getShopProviders,
  addProvider,
  inviteProvider,
  updateProvider,
  removeProvider,
  searchUserByEmail,
  Shop,
  ShopStaff
} from '@/lib/shop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Loader2,
  Users,
  Plus,
  Search,
  Mail,
  X,
  AlertCircle,
  Check,
  UserCircle,
  Star,
  Edit,
  Trash2,
  Crown,
  Shield
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
  const [selectedProvider, setSelectedProvider] = useState<ShopStaff | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add provider form state
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [addingProvider, setAddingProvider] = useState(false);

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

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;

    setSearching(true);
    setSearchResult(null);
    setSearchPerformed(true);
    setError('');

    try {
      const result = await searchUserByEmail(searchEmail.trim());
      if (result.success) {
        setSearchResult(result.user || null);
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAddExistingUser = async () => {
    if (!shop || !searchResult) return;

    // Check license limit
    const maxLicenses = subscription?.max_licenses || 0;
    if (providers.length >= maxLicenses) {
      setError(`You've reached your license limit of ${maxLicenses} providers. Upgrade your plan to add more.`);
      return;
    }

    setAddingProvider(true);
    setError('');

    try {
      const result = await addProvider(shop.id, searchResult.id, 'barber');
      if (result.success) {
        setSuccess('Provider added successfully!');
        setShowAddModal(false);
        resetAddForm();
        loadData();
      } else {
        setError(result.error || 'Failed to add provider');
      }
    } catch (err) {
      setError('Failed to add provider');
    } finally {
      setAddingProvider(false);
    }
  };

  const handleInviteNewUser = async () => {
    if (!shop || !userId || !searchEmail.trim() || !inviteName.trim()) return;

    // Check license limit
    const maxLicenses = subscription?.max_licenses || 0;
    if (providers.length >= maxLicenses) {
      setError(`You've reached your license limit of ${maxLicenses} providers. Upgrade your plan to add more.`);
      return;
    }

    setAddingProvider(true);
    setError('');

    try {
      const result = await inviteProvider(shop.id, userId, searchEmail.trim(), inviteName.trim());
      if (result.success) {
        setSuccess('Invitation sent successfully!');
        setShowAddModal(false);
        resetAddForm();
        loadData();
      } else {
        setError(result.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setAddingProvider(false);
    }
  };

  const resetAddForm = () => {
    setSearchEmail('');
    setSearchResult(null);
    setSearchPerformed(false);
    setInviteName('');
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

      <main className="max-w-6xl mx-auto px-4 py-8 pt-32 flex-1 w-full">
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
          <div className="flex items-center justify-between">
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
              <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden">
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
              Manage your providers and their availability
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
                <div key={provider.id} className="p-6 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-[#0393d5]/20 flex items-center justify-center overflow-hidden">
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
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-medium text-white truncate">
                        {provider.user?.name || 'Unknown User'}
                      </h4>
                      {provider.role === 'admin' ? (
                        <span className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-[#0393d5]/20 text-[#0393d5] px-2 py-0.5 rounded-full">
                          <Shield className="w-3 h-3" />
                          Provider
                        </span>
                      )}
                    </div>
                    <p className="text-[#0393d5] text-sm truncate">
                      {provider.user?.email}
                    </p>
                    {provider.bio && (
                      <p className="text-white/60 text-sm mt-1 line-clamp-1">{provider.bio}</p>
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
                    <div className="text-center">
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
                    {provider.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveClick(provider)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
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
                }}
                className="text-[#0393d5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Search by email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Search by Email
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => {
                        setSearchEmail(e.target.value);
                        setSearchPerformed(false);
                        setSearchResult(null);
                      }}
                      placeholder="provider@email.com"
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                    />
                  </div>
                  <button
                    onClick={handleSearchUser}
                    disabled={!searchEmail.trim() || searching}
                    className="px-4 py-3 bg-[#0393d5] hover:bg-[#027bb5] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {searching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Search results */}
              {searchPerformed && (
                <div className="space-y-4">
                  {searchResult ? (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#0393d5]/20 flex items-center justify-center overflow-hidden">
                          {searchResult.profile_image ? (
                            <img
                              src={searchResult.profile_image}
                              alt={searchResult.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserCircle className="w-8 h-8 text-[#0393d5]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{searchResult.name}</p>
                          <p className="text-[#0393d5] text-sm">{searchResult.email}</p>
                        </div>
                        <button
                          onClick={handleAddExistingUser}
                          disabled={addingProvider}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {addingProvider ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white/70 text-center mb-4">
                        No user found with that email. Send them an invitation?
                      </p>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          placeholder="Provider's full name"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                        />
                        <button
                          onClick={handleInviteNewUser}
                          disabled={!inviteName.trim() || addingProvider}
                          className="w-full px-4 py-3 bg-[#0393d5] hover:bg-[#027bb5] text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingProvider ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              Send Invitation
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="bg-[#0393d5]/10 border border-[#0393d5]/30 rounded-lg p-4">
                <p className="text-[#0393d5] text-sm">
                  Search for existing Happy Inline users by their email address, or send an invitation to a new user.
                </p>
              </div>
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

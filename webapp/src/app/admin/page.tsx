'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getProfile } from '@/lib/auth';
import {
  getPendingShops,
  getAllShops,
  approveShop,
  rejectShop,
  suspendShop,
  reactivateShop,
  getPlatformStats,
  PendingShop,
  PlatformStats
} from '@/lib/admin';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Loader2,
  Store,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Check,
  X,
  MapPin,
  Phone,
  Mail,
  User,
  Building2,
  TrendingUp,
  Ban,
  RefreshCw,
  Filter
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pendingShops, setPendingShops] = useState<PendingShop[]>([]);
  const [allShops, setAllShops] = useState<PendingShop[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showShopModal, setShowShopModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<PendingShop | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      loadAllShops();
    }
  }, [statusFilter, activeTab]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const profile = await getProfile(user.id);

      if (!profile || profile.role !== 'super_admin') {
        // Not a super admin, redirect to appropriate dashboard
        if (profile?.role === 'owner') {
          router.push('/dashboard');
        } else if (profile?.role === 'provider') {
          router.push('/provider');
        } else if (profile?.role === 'customer') {
          router.push('/customer');
        } else {
          router.push('/login');
        }
        return;
      }

      setUserName(profile.name || 'Admin');

      // Load stats
      const statsResult = await getPlatformStats();
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }

      // Load pending shops
      const pendingResult = await getPendingShops();
      if (pendingResult.success && pendingResult.shops) {
        setPendingShops(pendingResult.shops);
      }

      // Load all shops
      const allResult = await getAllShops();
      if (allResult.success && allResult.shops) {
        setAllShops(allResult.shops);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllShops = async () => {
    const result = await getAllShops(statusFilter || undefined);
    if (result.success && result.shops) {
      setAllShops(result.shops);
    }
  };

  const handleViewShop = (shop: PendingShop) => {
    setSelectedShop(shop);
    setShowShopModal(true);
  };

  const handleApprove = async (shop: PendingShop) => {
    setActionLoading(true);
    setError('');

    try {
      const result = await approveShop(shop.id);
      if (result.success) {
        setSuccess(`${shop.name} has been approved!`);
        setShowShopModal(false);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to approve shop');
      }
    } catch (err) {
      setError('Failed to approve shop');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedShop) return;

    setActionLoading(true);
    setError('');

    try {
      const result = await rejectShop(selectedShop.id, rejectReason);
      if (result.success) {
        setSuccess(`${selectedShop.name} has been rejected.`);
        setShowRejectModal(false);
        setShowShopModal(false);
        setRejectReason('');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to reject shop');
      }
    } catch (err) {
      setError('Failed to reject shop');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (shop: PendingShop) => {
    setActionLoading(true);
    setError('');

    try {
      const result = await suspendShop(shop.id);
      if (result.success) {
        setSuccess(`${shop.name} has been suspended.`);
        setShowShopModal(false);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to suspend shop');
      }
    } catch (err) {
      setError('Failed to suspend shop');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (shop: PendingShop) => {
    setActionLoading(true);
    setError('');

    try {
      const result = await reactivateShop(shop.id);
      if (result.success) {
        setSuccess(`${shop.name} has been reactivated!`);
        setShowShopModal(false);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to reactivate shop');
      }
    } catch (err) {
      setError('Failed to reactivate shop');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'pending_review':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      case 'suspended':
        return 'bg-orange-500/20 text-orange-400';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-white/10 text-white/70';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0393d5] animate-spin mx-auto mb-4" />
          <p className="text-[#0393d5]">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b] flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 pt-32 flex-1 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-[#0393d5]">
            Welcome back, {userName}! Manage the platform from here.
          </p>
        </div>

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
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Pending Reviews - Highlighted */}
            <div className="bg-yellow-500/20 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-200 text-sm">Pending Review</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.pendingShops}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Store className="w-6 h-6 text-green-400" />
                <span className="text-white/60 text-sm">Active Shops</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.activeShops}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-[#0393d5]" />
                <span className="text-white/60 text-sm">Total Users</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-purple-400" />
                <span className="text-white/60 text-sm">Total Bookings</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalBookings}</p>
            </div>

            {/* Additional stats */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-[#0393d5]" />
                <span className="text-white/50 text-xs">Business Owners</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.totalOwners}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-[#0393d5]" />
                <span className="text-white/50 text-xs">Providers</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.totalProviders}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-[#0393d5]" />
                <span className="text-white/50 text-xs">Customers</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.totalCustomers}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/50 text-xs">Completed Bookings</span>
              </div>
              <p className="text-xl font-bold text-white">{stats.completedBookings}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Clock className="w-5 h-5" />
            Pending Review
            {pendingShops.length > 0 && (
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingShops.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-[#0393d5] text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Store className="w-5 h-5" />
            All Shops
          </button>
        </div>

        {/* Filter for All Shops */}
        {activeTab === 'all' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-white">
                <Filter className="w-5 h-5 text-[#0393d5]" />
                <span className="font-medium">Filter:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#0393d5]"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending_review">Pending Review</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
              <button
                onClick={loadData}
                className="p-2 text-[#0393d5] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Shops List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">
              {activeTab === 'pending' ? 'Shops Awaiting Review' : 'All Shops'}
            </h3>
            <p className="text-[#0393d5] text-sm mt-1">
              {activeTab === 'pending'
                ? 'Review and approve or reject shop applications'
                : 'Manage all registered shops'}
            </p>
          </div>

          {(activeTab === 'pending' ? pendingShops : allShops).length === 0 ? (
            <div className="p-12 text-center">
              <Store className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-white mb-2">
                {activeTab === 'pending' ? 'No Pending Reviews' : 'No Shops Found'}
              </h4>
              <p className="text-[#0393d5]">
                {activeTab === 'pending'
                  ? 'All shop applications have been reviewed'
                  : 'No shops match your filter criteria'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {(activeTab === 'pending' ? pendingShops : allShops).map((shop) => (
                <div key={shop.id} className="p-6 flex items-center gap-4 flex-wrap">
                  {/* Logo */}
                  <div className="w-16 h-16 rounded-xl bg-[#0393d5]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {shop.logo_url ? (
                      <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-[#0393d5]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-lg font-medium text-white truncate">
                        {shop.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shop.status)}`}>
                        {shop.status.replace('_', ' ')}
                      </span>
                    </div>
                    {shop.city && (
                      <div className="flex items-center gap-1 text-white/60 text-sm mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>{shop.city}, {shop.state}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-white/50 text-sm">
                      <User className="w-4 h-4" />
                      <span>Owner: {shop.owner?.name || 'Unknown'}</span>
                      <span className="mx-2">•</span>
                      <span>Submitted: {formatDate(shop.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewShop(shop)}
                      className="flex items-center gap-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {shop.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => handleApprove(shop)}
                          className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedShop(shop);
                            setShowRejectModal(true);
                          }}
                          className="flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Shop Details Modal */}
      {showShopModal && selectedShop && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-semibold text-white">Shop Details</h3>
              <button
                onClick={() => setShowShopModal(false)}
                className="text-[#0393d5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Shop Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 rounded-xl bg-[#0393d5]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedShop.logo_url ? (
                    <img src={selectedShop.logo_url} alt={selectedShop.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-10 h-10 text-[#0393d5]" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white mb-1">{selectedShop.name}</h4>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedShop.status)}`}>
                    {selectedShop.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Cover Image */}
              {selectedShop.cover_image_url && (
                <div className="mb-6 rounded-xl overflow-hidden">
                  <img src={selectedShop.cover_image_url} alt="Cover" className="w-full h-48 object-cover" />
                </div>
              )}

              {/* Description */}
              {selectedShop.description && (
                <div className="mb-6">
                  <h5 className="text-white/60 text-sm uppercase tracking-wider mb-2">Description</h5>
                  <p className="text-white">{selectedShop.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedShop.address && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-[#0393d5] mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Address</span>
                    </div>
                    <p className="text-white">
                      {selectedShop.address}
                      {selectedShop.city && `, ${selectedShop.city}`}
                      {selectedShop.state && `, ${selectedShop.state}`}
                    </p>
                  </div>
                )}

                {selectedShop.phone && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-[#0393d5] mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Phone</span>
                    </div>
                    <p className="text-white">{selectedShop.phone}</p>
                  </div>
                )}

                {selectedShop.email && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-[#0393d5] mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email</span>
                    </div>
                    <p className="text-white">{selectedShop.email}</p>
                  </div>
                )}

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-[#0393d5] mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Submitted</span>
                  </div>
                  <p className="text-white">{formatDate(selectedShop.created_at)}</p>
                </div>
              </div>

              {/* Owner Info */}
              {selectedShop.owner && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h5 className="text-white/60 text-sm uppercase tracking-wider mb-3">Owner Information</h5>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#0393d5]/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-[#0393d5]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedShop.owner.name}</p>
                      <p className="text-[#0393d5] text-sm">{selectedShop.owner.email}</p>
                      {selectedShop.owner.phone && (
                        <p className="text-white/60 text-sm">{selectedShop.owner.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex-shrink-0">
              <div className="flex gap-3 flex-wrap">
                {selectedShop.status === 'pending_review' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedShop)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      Approve Shop
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Shop
                    </button>
                  </>
                )}

                {selectedShop.status === 'active' && (
                  <button
                    onClick={() => handleSuspend(selectedShop)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ban className="w-5 h-5" />}
                    Suspend Shop
                  </button>
                )}

                {(selectedShop.status === 'suspended' || selectedShop.status === 'rejected') && (
                  <button
                    onClick={() => handleReactivate(selectedShop)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    Reactivate Shop
                  </button>
                )}

                <button
                  onClick={() => setShowShopModal(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedShop && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Reject Shop</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-white">
                Are you sure you want to reject <strong>{selectedShop.name}</strong>?
              </p>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSubscriptionStatus, SubscriptionStatus } from '@/lib/auth';
import {
  getMyShop,
  getShopServices,
  getServiceCatalog,
  addShopService,
  updateShopService,
  removeShopService,
  getShopProviders,
  getShopServiceProviders,
  updateServiceProviders,
  Shop,
  ShopService,
  ShopStaff
} from '@/lib/shop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Loader2,
  Scissors,
  Plus,
  X,
  AlertCircle,
  Check,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Tag,
  Search,
  ToggleLeft,
  ToggleRight,
  Users,
  UserPlus,
  UserMinus
} from 'lucide-react';

export default function ServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<ShopService[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ShopService | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add service form state
  const [addMode, setAddMode] = useState<'catalog' | 'custom'>('catalog');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customDuration, setCustomDuration] = useState('30');
  const [customPrice, setCustomPrice] = useState('');
  const [customCategory, setCustomCategory] = useState('General');
  const [addingService, setAddingService] = useState(false);

  // Edit service form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState('30');
  const [editPrice, setEditPrice] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [deletingService, setDeletingService] = useState(false);

  // Provider assignment state
  const [providers, setProviders] = useState<ShopStaff[]>([]);
  const [serviceAssignments, setServiceAssignments] = useState<{ service_id: string; provider_id: string }[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningService, setAssigningService] = useState<ShopService | null>(null);
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

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

      const servicesResult = await getShopServices(shopResult.shop.id);
      if (servicesResult.success && servicesResult.services) {
        setServices(servicesResult.services);
      }

      const catalogResult = await getServiceCatalog();
      if (catalogResult.success && catalogResult.services) {
        setCatalog(catalogResult.services);
      }

      // Load providers
      const providersResult = await getShopProviders(shopResult.shop.id);
      if (providersResult.success && providersResult.providers) {
        setProviders(providersResult.providers);
      }

      // Load service-provider assignments
      const assignmentsResult = await getShopServiceProviders(shopResult.shop.id);
      if (assignmentsResult.success && assignmentsResult.assignments) {
        setServiceAssignments(assignmentsResult.assignments);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromCatalog = async (catalogService: any) => {
    if (!shop) return;

    setAddingService(true);
    setError('');

    try {
      const result = await addShopService(shop.id, {
        service_id: catalogService.id,
        name: catalogService.name,
        description: catalogService.description,
        duration: catalogService.duration || 30,
        category: catalogService.category,
        price: catalogService.default_price || 0
      });

      if (result.success) {
        setSuccess('Service added successfully!');
        setShowAddModal(false);
        resetAddForm();
        loadData();
      } else {
        setError(result.error || 'Failed to add service');
      }
    } catch (err) {
      setError('Failed to add service');
    } finally {
      setAddingService(false);
    }
  };

  const handleAddCustomService = async () => {
    if (!shop || !customName.trim() || !customPrice.trim()) return;

    setAddingService(true);
    setError('');

    try {
      const result = await addShopService(shop.id, {
        name: customName.trim(),
        description: customDescription.trim() || undefined,
        duration: parseInt(customDuration) || 30,
        category: customCategory,
        price: parseFloat(customPrice)
      });

      if (result.success) {
        setSuccess('Service added successfully!');
        setShowAddModal(false);
        resetAddForm();
        loadData();
      } else {
        setError(result.error || 'Failed to add service');
      }
    } catch (err) {
      setError('Failed to add service');
    } finally {
      setAddingService(false);
    }
  };

  const resetAddForm = () => {
    setAddMode('catalog');
    setCatalogSearch('');
    setCustomName('');
    setCustomDescription('');
    setCustomDuration('30');
    setCustomPrice('');
    setCustomCategory('General');
  };

  const handleEditService = (service: ShopService) => {
    setSelectedService(service);
    setEditName(service.name);
    setEditDescription(service.description || '');
    setEditDuration(service.duration.toString());
    setEditPrice(service.price.toString());
    setEditIsActive(service.is_active);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedService || !editName.trim() || !editPrice.trim()) return;

    setSavingEdit(true);
    setError('');

    try {
      const result = await updateShopService(selectedService.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        duration: parseInt(editDuration) || 30,
        price: parseFloat(editPrice),
        is_active: editIsActive
      });

      if (result.success) {
        setSuccess('Service updated successfully!');
        setShowEditModal(false);
        setSelectedService(null);
        loadData();
      } else {
        setError(result.error || 'Failed to update service');
      }
    } catch (err) {
      setError('Failed to update service');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClick = (service: ShopService) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedService) return;

    setDeletingService(true);
    setError('');

    try {
      const result = await removeShopService(selectedService.id);
      if (result.success) {
        setSuccess('Service removed successfully!');
        setShowDeleteModal(false);
        setSelectedService(null);
        loadData();
      } else {
        setError(result.error || 'Failed to remove service');
      }
    } catch (err) {
      setError('Failed to remove service');
    } finally {
      setDeletingService(false);
    }
  };

  const handleToggleActive = async (service: ShopService) => {
    setError('');

    try {
      const result = await updateShopService(service.id, {
        is_active: !service.is_active
      });

      if (result.success) {
        loadData();
      } else {
        setError(result.error || 'Failed to update service');
      }
    } catch (err) {
      setError('Failed to update service');
    }
  };

  const handleOpenAssignModal = (service: ShopService) => {
    setAssigningService(service);
    // Get currently assigned provider IDs for this service
    const currentAssignments = serviceAssignments
      .filter(a => a.service_id === service.id)
      .map(a => a.provider_id);
    setSelectedProviderIds(currentAssignments);
    setShowAssignModal(true);
  };

  const handleToggleProviderAssignment = (providerId: string) => {
    setSelectedProviderIds(prev =>
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!shop || !assigningService) return;

    setSavingAssignments(true);
    setError('');

    try {
      const result = await updateServiceProviders(
        shop.id,
        assigningService.id,
        selectedProviderIds
      );

      if (result.success) {
        setSuccess('Provider assignments updated!');
        setShowAssignModal(false);
        setAssigningService(null);
        loadData();
      } else {
        setError(result.error || 'Failed to update assignments');
      }
    } catch (err) {
      setError('Failed to update assignments');
    } finally {
      setSavingAssignments(false);
    }
  };

  const getAssignedProviderCount = (serviceId: string): number => {
    return serviceAssignments.filter(a => a.service_id === serviceId).length;
  };

  const filteredCatalog = catalog.filter(service =>
    service.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (service.category && service.category.toLowerCase().includes(catalogSearch.toLowerCase()))
  );

  const categories = [...new Set(services.map(s => s.category || 'General'))];

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

        {/* Services Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0393d5]/20 flex items-center justify-center">
                <Scissors className="w-6 h-6 text-[#0393d5]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Your Services</h2>
                <p className="text-[#0393d5]">
                  {services.length} service{services.length !== 1 ? 's' : ''} • {services.filter(s => s.is_active).length} active
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0393d5] hover:bg-[#027bb5] text-white rounded-lg font-medium transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Service
            </button>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          {services.length === 0 ? (
            <div className="p-12 text-center">
              <Scissors className="w-16 h-16 text-[#0393d5]/50 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-white mb-2">No Services Yet</h4>
              <p className="text-[#0393d5] mb-6">
                Add services that your business offers to enable bookings
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Service
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {categories.map(category => (
                <div key={category}>
                  <div className="px-6 py-3 bg-white/5">
                    <h3 className="text-sm font-medium text-[#0393d5] uppercase tracking-wide">
                      {category}
                    </h3>
                  </div>
                  {services
                    .filter(s => (s.category || 'General') === category)
                    .map(service => (
                      <div key={service.id} className="p-6 flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          service.is_active ? 'bg-[#0393d5]/20' : 'bg-white/10'
                        }`}>
                          <Scissors className={`w-6 h-6 ${
                            service.is_active ? 'text-[#0393d5]' : 'text-white/50'
                          }`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-lg font-medium ${
                              service.is_active ? 'text-white' : 'text-white/50'
                            }`}>
                              {service.name}
                            </h4>
                            {!service.is_active && (
                              <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-[#0393d5] text-sm line-clamp-1">{service.description}</p>
                          )}
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1 text-white/70">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} min</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-1 text-white font-semibold min-w-[80px] justify-end">
                          <DollarSign className="w-4 h-4" />
                          <span>{service.price.toFixed(2)}</span>
                        </div>

                        {/* Assign Providers */}
                        <button
                          onClick={() => handleOpenAssignModal(service)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm"
                          title="Assign Providers"
                        >
                          <Users className="w-4 h-4" />
                          <span>{getAssignedProviderCount(service.id)}</span>
                        </button>

                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={`p-2 rounded-lg transition-colors ${
                            service.is_active
                              ? 'text-green-400 hover:bg-green-500/10'
                              : 'text-white/50 hover:bg-white/10'
                          }`}
                          title={service.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {service.is_active ? (
                            <ToggleRight className="w-6 h-6" />
                          ) : (
                            <ToggleLeft className="w-6 h-6" />
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleEditService(service)}
                          className="p-2 text-[#0393d5] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteClick(service)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-lg border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Add Service</h3>
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

            {/* Mode Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setAddMode('catalog')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  addMode === 'catalog'
                    ? 'text-[#0393d5] border-b-2 border-[#0393d5]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                From Catalog
              </button>
              <button
                onClick={() => setAddMode('custom')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  addMode === 'custom'
                    ? 'text-[#0393d5] border-b-2 border-[#0393d5]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Custom Service
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {addMode === 'catalog' ? (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Search services..."
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                    />
                  </div>

                  {/* Catalog List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredCatalog.length === 0 ? (
                      <p className="text-center text-[#0393d5] py-8">
                        {catalogSearch ? 'No services found' : 'No services in catalog'}
                      </p>
                    ) : (
                      filteredCatalog.map(service => (
                        <div
                          key={service.id}
                          className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-[#0393d5]/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#0393d5]/20 flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-[#0393d5]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium">{service.name}</p>
                            <p className="text-[#0393d5] text-sm truncate">{service.category}</p>
                          </div>
                          <div className="text-white/70 text-sm">
                            {service.duration || 30} min
                          </div>
                          <button
                            onClick={() => handleAddFromCatalog(service)}
                            disabled={addingService}
                            className="px-3 py-1.5 bg-[#0393d5] hover:bg-[#027bb5] text-white text-sm rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {addingService ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Custom Service Form */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g., Premium Haircut"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Description
                    </label>
                    <textarea
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Brief description of the service..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Duration (minutes) *
                      </label>
                      <select
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#0393d5]"
                      >
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Price ($) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="e.g., Haircuts, Styling, etc."
                        className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddCustomService}
                    disabled={!customName.trim() || !customPrice.trim() || addingService}
                    className="w-full bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingService ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add Service
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Edit Service</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedService(null);
                }}
                className="text-[#0393d5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Duration *
                  </label>
                  <select
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#0393d5]"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Price ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0393d5]" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#0393d5]"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10">
                <div>
                  <p className="text-white font-medium">Active</p>
                  <p className="text-[#0393d5] text-sm">Show service in booking</p>
                </div>
                <button
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    editIsActive ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    editIsActive ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim() || !editPrice.trim() || savingEdit}
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

      {/* Delete Service Modal */}
      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Remove Service</h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-white mb-2">
                  Are you sure you want to remove <strong>{selectedService.name}</strong>?
                </p>
                <p className="text-[#0393d5] text-sm">
                  This service will no longer be available for booking.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedService(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deletingService}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingService ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove Service'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Providers Modal */}
      {showAssignModal && assigningService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3a6b] rounded-2xl w-full max-w-md border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Assign Providers</h3>
                <p className="text-[#0393d5] text-sm mt-1">{assigningService.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningService(null);
                }}
                className="text-[#0393d5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {providers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-[#0393d5]/50 mx-auto mb-3" />
                  <p className="text-white mb-2">No providers yet</p>
                  <p className="text-[#0393d5] text-sm">
                    Add providers in the Providers section first
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-white/70 text-sm mb-4">
                    Select which providers can perform this service:
                  </p>
                  {providers.map(provider => {
                    const isSelected = selectedProviderIds.includes(provider.user_id);
                    const user = provider.user as { id: string; name: string; email: string; phone: string | null; profile_image: string | null } | undefined;
                    return (
                      <button
                        key={provider.id}
                        onClick={() => handleToggleProviderAssignment(provider.user_id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {/* Provider Avatar */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${
                          isSelected ? 'bg-purple-500/30' : 'bg-white/10'
                        }`}>
                          {user?.profile_image ? (
                            <img
                              src={user.profile_image}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className={`text-lg font-semibold ${
                              isSelected ? 'text-purple-300' : 'text-white/70'
                            }`}>
                              {user?.name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>

                        {/* Provider Info */}
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                            {user?.name || 'Unknown'}
                          </p>
                          <p className="text-[#0393d5] text-sm">
                            {provider.role === 'admin' ? 'Admin' : 'Provider'}
                          </p>
                        </div>

                        {/* Selection Indicator */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-white/30'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {providers.length > 0 && (
              <div className="p-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/70 text-sm">
                    {selectedProviderIds.length} provider{selectedProviderIds.length !== 1 ? 's' : ''} selected
                  </span>
                  {selectedProviderIds.length > 0 && (
                    <button
                      onClick={() => setSelectedProviderIds([])}
                      className="text-red-400 text-sm hover:text-red-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSaveAssignments}
                  disabled={savingAssignments}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingAssignments ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Save Assignments
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

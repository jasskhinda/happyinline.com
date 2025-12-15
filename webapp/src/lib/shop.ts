import { getSupabaseClient } from './supabase';

// ============================================
// TYPES
// ============================================

export interface Shop {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  operating_days: string[] | null;
  opening_time: string | null;
  closing_time: string | null;
  is_manually_closed: boolean;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended' | 'active';
  is_active: boolean;
  created_by: string;
  created_at: string;
  category_id: string | null;
  business_type_id: string | null;
}

export interface ShopStaff {
  id: string;
  shop_id: string;
  user_id: string;
  role: 'admin' | 'barber';
  bio: string | null;
  specialties: string[] | null;
  rating: number | null;
  total_reviews: number | null;
  is_available: boolean;
  is_active: boolean;
  hired_date: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profile_image: string | null;
  };
}

export interface ShopService {
  id: string;
  shop_id: string;
  service_id: string | null;
  name: string;
  description: string | null;
  duration: number;
  category: string | null;
  icon_url: string | null;
  price: number;
  is_active: boolean;
}

export interface Booking {
  id: string;
  booking_id: string;
  shop_id: string;
  customer_id: string;
  barber_id: string | null;
  services: any[];
  appointment_date: string;
  appointment_time: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected';
  customer_notes: string | null;
  shop_notes: string | null;
  created_at: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profile_image: string | null;
  };
  barber?: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

export interface CreateShopData {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  cover_image_url?: string;
  operating_days?: string[];
  opening_time?: string;
  closing_time?: string;
  category_id?: string;
  business_type_id?: string;
}

// ============================================
// SHOP MANAGEMENT
// ============================================

/**
 * Get the shop owned by the current user
 */
export const getMyShop = async (userId: string): Promise<{ success: boolean; shop?: Shop; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('created_by', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No shop found
        return { success: true, shop: undefined };
      }
      console.error('Error fetching shop:', error);
      return { success: false, error: error.message };
    }

    return { success: true, shop };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a new shop
 */
export const createShop = async (userId: string, shopData: CreateShopData): Promise<{ success: boolean; shop?: Shop; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // Check if user already has a shop
    const { data: existingShop } = await supabase
      .from('shops')
      .select('id')
      .eq('created_by', userId)
      .single();

    if (existingShop) {
      return { success: false, error: 'You already have a business. Each account can only have one business.' };
    }

    // Create the shop
    const { data: shop, error } = await supabase
      .from('shops')
      .insert({
        name: shopData.name,
        description: shopData.description || null,
        address: shopData.address || null,
        city: shopData.city || null,
        state: shopData.state || null,
        zip_code: shopData.zip_code || null,
        country: shopData.country || null,
        phone: shopData.phone || null,
        email: shopData.email || null,
        website: shopData.website || null,
        logo_url: shopData.logo_url || null,
        cover_image_url: shopData.cover_image_url || null,
        operating_days: shopData.operating_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opening_time: shopData.opening_time || '09:00',
        closing_time: shopData.closing_time || '18:00',
        created_by: userId,
        status: 'draft',
        is_active: false,
        category_id: shopData.category_id || null,
        business_type_id: shopData.business_type_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shop:', error);
      return { success: false, error: error.message };
    }

    // Note: Owner is NOT added as a provider automatically
    // Owner manages the shop but doesn't count toward license limits
    // Owner can add themselves as a provider if they also provide services

    return { success: true, shop };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update shop details
 */
export const updateShop = async (shopId: string, updates: Partial<Shop>): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shops')
      .update(updates)
      .eq('id', shopId);

    if (error) {
      console.error('Error updating shop:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle shop open/closed status
 */
export const toggleShopStatus = async (shopId: string, isClosed: boolean): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shops')
      .update({ is_manually_closed: isClosed })
      .eq('id', shopId);

    if (error) {
      console.error('Error toggling shop status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Submit shop for review
 */
export const submitShopForReview = async (shopId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shops')
      .update({ status: 'pending_review' })
      .eq('id', shopId);

    if (error) {
      console.error('Error submitting for review:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete shop and all related data
 */
export const deleteShop = async (shopId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // Delete related data first
    await supabase.from('shop_reviews').delete().eq('shop_id', shopId);
    await supabase.from('bookings').delete().eq('shop_id', shopId);
    await supabase.from('shop_services').delete().eq('shop_id', shopId);

    // Delete shop (staff will be deleted after)
    const { error: shopError } = await supabase
      .from('shops')
      .delete()
      .eq('id', shopId);

    if (shopError) {
      console.error('Error deleting shop:', shopError);
      return { success: false, error: shopError.message };
    }

    // Delete staff records
    await supabase.from('shop_staff').delete().eq('shop_id', shopId);

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PROVIDER/STAFF MANAGEMENT
// ============================================

/**
 * Get all providers for a shop
 */
export const getShopProviders = async (shopId: string): Promise<{ success: boolean; providers?: ShopStaff[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: providers, error } = await supabase
      .from('shop_staff')
      .select(`
        id,
        shop_id,
        user_id,
        role,
        bio,
        specialties,
        rating,
        total_reviews,
        is_available,
        is_active,
        hired_date,
        user:profiles!shop_staff_user_id_fkey(
          id,
          name,
          email,
          phone,
          profile_image
        )
      `)
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('role', { ascending: true })
      .order('hired_date', { ascending: true });

    if (error) {
      console.error('Error fetching providers:', error);
      return { success: false, error: error.message };
    }

    return { success: true, providers: providers || [] };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a provider to the shop
 */
export const addProvider = async (
  shopId: string,
  userId: string,
  role: 'admin' | 'barber' = 'barber',
  additionalData?: { bio?: string; specialties?: string[] }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // Check if already a staff member
    const { data: existing } = await supabase
      .from('shop_staff')
      .select('id')
      .eq('shop_id', shopId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { success: false, error: 'This user is already a provider at your business.' };
    }

    const { error } = await supabase
      .from('shop_staff')
      .insert({
        shop_id: shopId,
        user_id: userId,
        role: role,
        bio: additionalData?.bio || null,
        specialties: additionalData?.specialties || [],
        is_active: true,
        is_available: true
      });

    if (error) {
      console.error('Error adding provider:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a new user and add as provider (invite flow)
 * @deprecated Use /api/providers/create instead for direct account creation
 */
export const inviteProvider = async (
  shopId: string,
  invitedBy: string,
  email: string,
  _name: string // Name would be used in email invitation, keeping for API compatibility
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      // User exists, just add them
      return addProvider(shopId, existingUser.id, 'barber');
    }

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    const { error } = await supabase
      .from('shop_invitations')
      .insert({
        shop_id: shopId,
        invited_by: invitedBy,
        invitee_email: email.toLowerCase(),
        role: 'barber',
        status: 'pending',
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('Error creating invitation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update provider details
 */
export const updateProvider = async (staffId: string, updates: Partial<ShopStaff>): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shop_staff')
      .update(updates)
      .eq('id', staffId);

    if (error) {
      console.error('Error updating provider:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove provider from shop
 */
export const removeProvider = async (staffId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shop_staff')
      .delete()
      .eq('id', staffId);

    if (error) {
      console.error('Error removing provider:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search for users by email (for adding providers)
 */
export const searchUserByEmail = async (email: string): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, profile_image')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, user: undefined };
      }
      console.error('Error searching user:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SERVICES MANAGEMENT
// ============================================

/**
 * Get all services for a shop
 */
export const getShopServices = async (shopId: string): Promise<{ success: boolean; services?: ShopService[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: services, error } = await supabase
      .from('shop_services')
      .select('*')
      .eq('shop_id', shopId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
      return { success: false, error: error.message };
    }

    return { success: true, services: services || [] };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get global service catalog
 */
export const getServiceCatalog = async (): Promise<{ success: boolean; services?: any[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching catalog:', error);
      return { success: false, error: error.message };
    }

    return { success: true, services: services || [] };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a service to the shop (from catalog or custom)
 */
export const addShopService = async (
  shopId: string,
  serviceData: {
    service_id?: string;
    name: string;
    description?: string;
    duration: number;
    category?: string;
    price: number;
  }
): Promise<{ success: boolean; service?: ShopService; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: service, error } = await supabase
      .from('shop_services')
      .insert({
        shop_id: shopId,
        service_id: serviceData.service_id || null,
        name: serviceData.name,
        description: serviceData.description || null,
        duration: serviceData.duration,
        category: serviceData.category || 'General',
        price: serviceData.price,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding service:', error);
      return { success: false, error: error.message };
    }

    return { success: true, service };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a shop service
 */
export const updateShopService = async (serviceId: string, updates: Partial<ShopService>): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shop_services')
      .update(updates)
      .eq('id', serviceId);

    if (error) {
      console.error('Error updating service:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove a service from shop
 */
export const removeShopService = async (serviceId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shop_services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error('Error removing service:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// BOOKINGS MANAGEMENT
// ============================================

/**
 * Get bookings for a shop with optional filters
 */
export const getShopBookings = async (
  shopId: string,
  filters?: { status?: string; date?: string; barber_id?: string }
): Promise<{ success: boolean; bookings?: Booking[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from('bookings')
      .select(`
        *,
        customer:profiles!bookings_customer_id_fkey(id, name, email, phone, profile_image),
        barber:profiles!bookings_barber_id_fkey(id, name, profile_image)
      `)
      .eq('shop_id', shopId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date) {
      query = query.eq('appointment_date', filters.date);
    }
    if (filters?.barber_id) {
      query = query.eq('barber_id', filters.barber_id);
    }

    query = query
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, bookings: bookings || [] };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: 'approved' | 'rejected' | 'completed' | 'cancelled',
  notes?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const updates: any = { status };
    if (notes) {
      updates.shop_notes = notes;
    }

    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get bookings for a specific provider
 */
export const getProviderBookings = async (
  providerId: string,
  filters?: { status?: string; date?: string }
): Promise<{ success: boolean; bookings?: Booking[]; shop?: Shop; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // First, get the shop this provider belongs to
    const { data: staffRecord, error: staffError } = await supabase
      .from('shop_staff')
      .select('shop_id')
      .eq('user_id', providerId)
      .eq('is_active', true)
      .single();

    if (staffError || !staffRecord) {
      return { success: false, error: 'Provider not assigned to any shop' };
    }

    // Get shop details
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', staffRecord.shop_id)
      .single();

    if (shopError) {
      return { success: false, error: 'Failed to fetch shop details' };
    }

    // Get bookings assigned to this provider
    let query = supabase
      .from('bookings')
      .select(`
        *,
        customer:profiles!bookings_customer_id_fkey(id, name, email, phone, profile_image),
        barber:profiles!bookings_barber_id_fkey(id, name, profile_image)
      `)
      .eq('shop_id', staffRecord.shop_id)
      .eq('barber_id', providerId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date) {
      query = query.eq('appointment_date', filters.date);
    }

    query = query
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching provider bookings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, bookings: bookings || [], shop };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get shop that a provider belongs to
 */
export const getProviderShop = async (providerId: string): Promise<{ success: boolean; shop?: Shop; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: staffRecord, error: staffError } = await supabase
      .from('shop_staff')
      .select('shop_id')
      .eq('user_id', providerId)
      .eq('is_active', true)
      .single();

    if (staffError || !staffRecord) {
      return { success: false, error: 'Not assigned to any shop' };
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', staffRecord.shop_id)
      .single();

    if (shopError || !shop) {
      return { success: false, error: 'Shop not found' };
    }

    return { success: true, shop };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// IMAGE UPLOAD
// ============================================

/**
 * Upload shop image (logo or cover)
 */
export const uploadShopImage = async (
  shopId: string,
  file: File,
  type: 'logo' | 'cover'
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    const filePath = `shop_${shopId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('shop-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('shop-images')
      .getPublicUrl(filePath);

    // Update shop record
    const fieldName = type === 'logo' ? 'logo_url' : 'cover_image_url';
    const { error: updateError } = await supabase
      .from('shops')
      .update({ [fieldName]: publicUrl })
      .eq('id', shopId);

    if (updateError) {
      console.error('Error updating shop image URL:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

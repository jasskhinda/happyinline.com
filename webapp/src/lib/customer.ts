import { getSupabaseClient } from './supabase';

// ============================================
// TYPES
// ============================================

export interface ShopPublic {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  operating_days: string[] | null;
  opening_time: string | null;
  closing_time: string | null;
  is_manually_closed: boolean;
  status: string;
  category?: {
    id: string;
    name: string;
  };
  business_type?: {
    id: string;
    name: string;
  };
}

export interface ShopServicePublic {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  category: string | null;
  price: number;
  is_active: boolean;
}

export interface ProviderPublic {
  id: string;
  user_id: string;
  bio: string | null;
  specialties: string[] | null;
  rating: number | null;
  total_reviews: number | null;
  is_available: boolean;
  user?: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

export interface CustomerBooking {
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
  created_at: string;
  shop?: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    logo_url: string | null;
    phone: string | null;
  };
  barber?: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

// ============================================
// SHOP BROWSING
// ============================================

/**
 * Get all active/approved shops
 */
export const getActiveShops = async (options?: {
  search?: string;
  categoryId?: string;
  city?: string;
  limit?: number;
}): Promise<{ success: boolean; shops?: ShopPublic[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from('shops')
      .select(`
        id,
        name,
        description,
        address,
        city,
        state,
        zip_code,
        phone,
        email,
        logo_url,
        cover_image_url,
        rating,
        total_reviews,
        is_verified,
        operating_days,
        opening_time,
        closing_time,
        is_manually_closed,
        status
      `)
      .in('status', ['active', 'approved'])
      .eq('is_active', true);

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,city.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options?.city) {
      query = query.ilike('city', `%${options.city}%`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    query = query.order('rating', { ascending: false });

    const { data: shops, error } = await query;

    if (error) {
      console.error('Error fetching shops:', error);
      return { success: false, error: error.message };
    }

    return { success: true, shops: shops || [] };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get shop by ID with full details
 */
export const getShopById = async (shopId: string): Promise<{ success: boolean; shop?: ShopPublic; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: shop, error } = await supabase
      .from('shops')
      .select(`
        id,
        name,
        description,
        address,
        city,
        state,
        zip_code,
        phone,
        email,
        logo_url,
        cover_image_url,
        rating,
        total_reviews,
        is_verified,
        operating_days,
        opening_time,
        closing_time,
        is_manually_closed,
        status
      `)
      .eq('id', shopId)
      .single();

    if (error) {
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
 * Get services for a shop
 */
export const getShopServicesPublic = async (shopId: string): Promise<{ success: boolean; services?: ShopServicePublic[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: services, error } = await supabase
      .from('shop_services')
      .select('id, name, description, duration, category, price, is_active')
      .eq('shop_id', shopId)
      .eq('is_active', true)
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
 * Get providers for a shop
 */
export const getShopProvidersPublic = async (shopId: string): Promise<{ success: boolean; providers?: ProviderPublic[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: providers, error } = await supabase
      .from('shop_staff')
      .select(`
        id,
        user_id,
        bio,
        specialties,
        rating,
        total_reviews,
        is_available,
        user:profiles!shop_staff_user_id_fkey(id, name, profile_image)
      `)
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .eq('is_available', true)
      .order('rating', { ascending: false });

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
 * Get all categories
 */
export const getCategories = async (): Promise<{ success: boolean; categories?: Category[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, icon')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return { success: false, error: error.message };
    }

    return { success: true, categories: categories || [] };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// BOOKINGS
// ============================================

/**
 * Get customer's bookings
 */
export const getCustomerBookings = async (
  customerId: string,
  filter?: 'upcoming' | 'completed' | 'cancelled'
): Promise<{ success: boolean; bookings?: CustomerBooking[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_id,
        shop_id,
        customer_id,
        barber_id,
        services,
        appointment_date,
        appointment_time,
        total_amount,
        status,
        customer_notes,
        created_at,
        shop:shops(id, name, address, city, logo_url, phone),
        barber:profiles!bookings_barber_id_fkey(id, name, profile_image)
      `)
      .eq('customer_id', customerId);

    if (filter === 'upcoming') {
      query = query.in('status', ['pending', 'approved']);
    } else if (filter === 'completed') {
      query = query.eq('status', 'completed');
    } else if (filter === 'cancelled') {
      query = query.in('status', ['cancelled', 'rejected']);
    }

    query = query
      .order('appointment_date', { ascending: filter === 'upcoming' })
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
 * Create a new booking
 */
export const createBooking = async (bookingData: {
  shopId: string;
  customerId: string;
  barberId?: string;
  services: { id: string; name: string; price: number; duration: number }[];
  appointmentDate: string;
  appointmentTime: string;
  customerNotes?: string;
}): Promise<{ success: boolean; booking?: CustomerBooking; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // Calculate total amount and generate booking ID
    const totalAmount = bookingData.services.reduce((sum, s) => sum + s.price, 0);
    const bookingId = `BK${Date.now().toString(36).toUpperCase()}`;

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        booking_id: bookingId,
        shop_id: bookingData.shopId,
        customer_id: bookingData.customerId,
        barber_id: bookingData.barberId || null,
        services: bookingData.services,
        appointment_date: bookingData.appointmentDate,
        appointment_time: bookingData.appointmentTime,
        total_amount: totalAmount,
        status: 'pending',
        customer_notes: bookingData.customerNotes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }

    return { success: true, booking };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a booking (customer)
 */
export const cancelCustomerBooking = async (bookingId: string, customerId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // Only allow cancelling own bookings that are pending or approved
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('customer_id', customerId)
      .in('status', ['pending', 'approved']);

    if (error) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CUSTOMER'S LINKED SHOP
// ============================================

/**
 * Get the customer's exclusive/linked shop
 * Customers are tied to ONE shop only (via QR code scan)
 */
export const getCustomerLinkedShop = async (customerId: string): Promise<{
  success: boolean;
  shop?: ShopPublic;
  shopId?: string;
  error?: string
}> => {
  try {
    const supabase = getSupabaseClient();

    // First get the customer's exclusive_shop_id from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('exclusive_shop_id')
      .eq('id', customerId)
      .single();

    if (profileError) {
      console.error('Error fetching customer profile:', profileError);
      return { success: false, error: profileError.message };
    }

    if (!profile?.exclusive_shop_id) {
      // Customer hasn't scanned a QR code yet - no linked shop
      return { success: true, shop: undefined, shopId: undefined };
    }

    // Now get the shop details
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select(`
        id,
        name,
        description,
        address,
        city,
        state,
        zip_code,
        phone,
        email,
        logo_url,
        cover_image_url,
        rating,
        total_reviews,
        is_verified,
        operating_days,
        opening_time,
        closing_time,
        is_manually_closed,
        status
      `)
      .eq('id', profile.exclusive_shop_id)
      .single();

    if (shopError) {
      console.error('Error fetching linked shop:', shopError);
      return { success: false, error: shopError.message };
    }

    return { success: true, shop, shopId: profile.exclusive_shop_id };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PROFILE
// ============================================

/**
 * Update customer profile
 */
export const updateCustomerProfile = async (
  userId: string,
  updates: { name?: string; phone?: string; address?: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SERVICE-PROVIDER FILTERING
// ============================================

/**
 * Get providers who can perform specific services (for customer booking)
 */
export const getProvidersForServicesPublic = async (
  shopId: string,
  serviceIds: string[]
): Promise<{ success: boolean; providers?: ProviderPublic[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // Get provider IDs who are assigned to ALL the selected services
    const { data: assignments, error: assignError } = await supabase
      .from('service_providers')
      .select('provider_id, service_id')
      .eq('shop_id', shopId)
      .in('service_id', serviceIds);

    if (assignError) {
      console.error('Error fetching service providers:', assignError);
      return { success: false, error: assignError.message };
    }

    if (!assignments || assignments.length === 0) {
      // No assignments found - return empty list
      return { success: true, providers: [] };
    }

    // Count how many of the selected services each provider can do
    const providerServiceCount: { [key: string]: number } = {};
    assignments.forEach((a: { provider_id: string; service_id: string }) => {
      providerServiceCount[a.provider_id] = (providerServiceCount[a.provider_id] || 0) + 1;
    });

    // Filter to providers who can do ALL selected services
    const qualifiedProviderIds = Object.entries(providerServiceCount)
      .filter(([_, count]) => count === serviceIds.length)
      .map(([providerId]) => providerId);

    if (qualifiedProviderIds.length === 0) {
      return { success: true, providers: [] };
    }

    // Get provider details
    const { data: providers, error: providerError } = await supabase
      .from('shop_staff')
      .select(`
        id,
        user_id,
        bio,
        specialties,
        rating,
        total_reviews,
        is_available,
        user:profiles!shop_staff_user_id_fkey(id, name, profile_image)
      `)
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .eq('is_available', true)
      .in('user_id', qualifiedProviderIds);

    if (providerError) {
      console.error('Error fetching providers:', providerError);
      return { success: false, error: providerError.message };
    }

    return { success: true, providers: providers || [] };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

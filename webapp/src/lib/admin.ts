import { getSupabaseClient } from './supabase';

// ============================================
// TYPES
// ============================================

export interface PendingShop {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  status: string;
  created_at: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface PlatformStats {
  totalShops: number;
  pendingShops: number;
  activeShops: number;
  totalUsers: number;
  totalOwners: number;
  totalProviders: number;
  totalCustomers: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
}

// ============================================
// SHOP MANAGEMENT
// ============================================

/**
 * Get all shops pending review
 */
export const getPendingShops = async (): Promise<{ success: boolean; shops?: PendingShop[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // First get shops
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending shops:', error);
      return { success: false, error: error.message };
    }

    if (!shops || shops.length === 0) {
      return { success: true, shops: [] };
    }

    // Get owner details for each shop
    const ownerIds = [...new Set(shops.map((s: any) => s.created_by).filter(Boolean))];
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, name, email, phone')
      .in('id', ownerIds);

    const ownerMap = new Map(owners?.map((o: any) => [o.id, o]) || []);

    const shopsWithOwners = shops.map((shop: any) => ({
      ...shop,
      owner: ownerMap.get(shop.created_by) || null
    }));

    return { success: true, shops: shopsWithOwners };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all shops with optional status filter
 */
export const getAllShops = async (status?: string): Promise<{ success: boolean; shops?: PendingShop[]; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: shops, error } = await query;

    if (error) {
      console.error('Error fetching shops:', error);
      return { success: false, error: error.message };
    }

    if (!shops || shops.length === 0) {
      return { success: true, shops: [] };
    }

    // Get owner details for each shop
    const ownerIds = [...new Set(shops.map((s: any) => s.created_by).filter(Boolean))];
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, name, email, phone')
      .in('id', ownerIds);

    const ownerMap = new Map(owners?.map((o: any) => [o.id, o]) || []);

    const shopsWithOwners = shops.map((shop: any) => ({
      ...shop,
      owner: ownerMap.get(shop.created_by) || null
    }));

    return { success: true, shops: shopsWithOwners };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Approve a shop
 */
export const approveShop = async (shopId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shops')
      .update({
        status: 'active',
        is_active: true
      })
      .eq('id', shopId);

    if (error) {
      console.error('Error approving shop:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject a shop
 */
export const rejectShop = async (shopId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shops')
      .update({
        status: 'rejected',
        is_active: false
        // Could add rejection_reason field if needed
      })
      .eq('id', shopId);

    if (error) {
      console.error('Error rejecting shop:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Suspend a shop
 */
export const suspendShop = async (shopId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shops')
      .update({
        status: 'suspended',
        is_active: false
      })
      .eq('id', shopId);

    if (error) {
      console.error('Error suspending shop:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reactivate a shop
 */
export const reactivateShop = async (shopId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('shops')
      .update({
        status: 'active',
        is_active: true
      })
      .eq('id', shopId);

    if (error) {
      console.error('Error reactivating shop:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PLATFORM STATS
// ============================================

/**
 * Get platform statistics
 */
export const getPlatformStats = async (): Promise<{ success: boolean; stats?: PlatformStats; error?: string }> => {
  try {
    const supabase = getSupabaseClient();

    // Get shop counts
    const { count: totalShops } = await supabase
      .from('shops')
      .select('*', { count: 'exact', head: true });

    const { count: pendingShops } = await supabase
      .from('shops')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_review');

    const { count: activeShops } = await supabase
      .from('shops')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get user counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalOwners } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'owner');

    const { count: totalProviders } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'provider');

    const { count: totalCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    // Get booking counts
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    const { count: pendingBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    return {
      success: true,
      stats: {
        totalShops: totalShops || 0,
        pendingShops: pendingShops || 0,
        activeShops: activeShops || 0,
        totalUsers: totalUsers || 0,
        totalOwners: totalOwners || 0,
        totalProviders: totalProviders || 0,
        totalCustomers: totalCustomers || 0,
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        completedBookings: completedBookings || 0
      }
    };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

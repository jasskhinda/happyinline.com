import { NextRequest, NextResponse } from 'next/server';
import { sendRescheduleNotifications } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, oldDate, oldTime, rescheduledBy } = await request.json();

    if (!bookingId || !oldDate || !oldTime) {
      return NextResponse.json(
        { error: 'Booking ID, old date, and old time are required' },
        { status: 400 }
      );
    }

    // Create admin client for fetching booking details
    const supabase = createAdminClient();

    // Fetch booking with all related data (after reschedule, so it has new date/time)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        shop_id,
        customer_id,
        barber_id,
        provider_id,
        services,
        appointment_date,
        appointment_time,
        total_amount,
        status
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Fetch shop details
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, created_by, address, city, state, zip_code')
      .eq('id', booking.shop_id)
      .single();

    if (shopError || !shop) {
      console.error('Error fetching shop:', shopError);
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', booking.customer_id)
      .single();

    if (customerError || !customer) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fetch owner details
    const { data: owner } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', shop.created_by)
      .single();

    // Fetch provider details if assigned
    // Check both barber_id (legacy) and provider_id (mobile app uses this)
    let provider = null;
    const providerId = booking.barber_id || booking.provider_id;
    if (providerId) {
      const { data: providerData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', providerId)
        .single();
      provider = providerData;
    }

    // Parse services
    let services: { name: string; price: number; duration: number }[] = [];
    if (booking.services) {
      if (typeof booking.services === 'string') {
        try {
          services = JSON.parse(booking.services);
        } catch {
          services = [];
        }
      } else if (Array.isArray(booking.services)) {
        services = booking.services.map((s: any) => ({
          name: s.name || 'Service',
          price: s.price || 0,
          duration: s.duration || 30,
        }));
      }
    }

    // Build full address
    const fullAddress = [shop.address, shop.city, shop.state, shop.zip_code]
      .filter(Boolean)
      .join(', ');

    // Send reschedule notifications
    const emailData = {
      customerName: customer.name || 'Customer',
      customerEmail: customer.email,
      ownerName: owner?.name,
      ownerEmail: owner?.email,
      providerName: provider?.name,
      providerEmail: provider?.email,
      shopName: shop.name,
      shopAddress: fullAddress || undefined,
      services,
      oldDate,
      oldTime,
      newDate: booking.appointment_date,
      newTime: booking.appointment_time,
      totalAmount: booking.total_amount || 0,
      rescheduledBy: rescheduledBy || 'business',
      bookingId: booking.id,
    };

    console.log('📧 Sending reschedule emails for booking:', bookingId);
    const results = await sendRescheduleNotifications(emailData);
    console.log('📧 Reschedule email results:', results);

    return NextResponse.json({
      success: true,
      emailsSent: results,
    });

  } catch (error: any) {
    console.error('Error in booking reschedule-notify API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

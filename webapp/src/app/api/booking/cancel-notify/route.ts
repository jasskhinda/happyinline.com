import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendCancellationNotifications } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { bookingId, cancelledBy } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Create admin client for fetching booking details
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking with all related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        shop_id,
        customer_id,
        barber_id,
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
      .select('id, name, owner_id')
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
      .eq('id', shop.owner_id)
      .single();

    // Fetch provider details if assigned
    let provider = null;
    if (booking.barber_id) {
      const { data: providerData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', booking.barber_id)
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

    // Send cancellation notifications
    const emailData = {
      customerName: customer.name || 'Customer',
      customerEmail: customer.email,
      ownerName: owner?.name,
      ownerEmail: owner?.email,
      providerName: provider?.name,
      providerEmail: provider?.email,
      shopName: shop.name,
      services,
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      totalAmount: booking.total_amount || 0,
      cancelledBy: cancelledBy || 'customer',
      bookingId: booking.id,
    };

    console.log('📧 Sending cancellation emails for booking:', bookingId);
    const results = await sendCancellationNotifications(emailData);
    console.log('📧 Cancellation email results:', results);

    return NextResponse.json({
      success: true,
      emailsSent: results,
    });

  } catch (error: any) {
    console.error('Error in booking cancel-notify API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

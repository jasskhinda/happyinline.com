import { NextRequest, NextResponse } from 'next/server';
import { sendBookingNotifications } from '@/lib/email';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

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
        customer_notes,
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

    // Fetch shop details
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, address, city, state, zip_code, phone, created_by')
      .eq('id', booking.shop_id)
      .single();

    if (shopError || !shop) {
      console.error('Error fetching shop:', shopError);
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Fetch owner details
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', shop.created_by)
      .single();

    if (ownerError) {
      console.error('Error fetching owner:', ownerError);
    }

    // Fetch provider details if assigned
    let provider = null;
    if (booking.barber_id) {
      // barber_id is the user_id of the provider
      const { data: providerData, error: providerError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', booking.barber_id)
        .single();

      if (!providerError && providerData) {
        provider = providerData;
      }
    }

    // Build full address
    const fullAddress = [shop.address, shop.city, shop.state, shop.zip_code]
      .filter(Boolean)
      .join(', ');

    // Send all booking notification emails
    const emailData = {
      customerName: customer.name || 'Customer',
      customerEmail: customer.email,
      ownerName: owner?.name,
      ownerEmail: owner?.email,
      providerName: provider?.name,
      providerEmail: provider?.email,
      shopName: shop.name,
      shopAddress: fullAddress || undefined,
      shopPhone: shop.phone || undefined,
      services: booking.services || [],
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      totalAmount: booking.total_amount || 0,
      customerNotes: booking.customer_notes || undefined,
      bookingId: booking.id,
    };

    console.log('📧 Sending booking notification emails...');
    console.log('  - Customer:', customer.email);
    console.log('  - Owner:', owner?.email || 'N/A');
    console.log('  - Provider:', provider?.email || 'N/A');

    const results = await sendBookingNotifications(emailData);

    console.log('📧 Email results:', results);

    return NextResponse.json({
      success: true,
      results: {
        customerEmailSent: results.customerSent,
        ownerEmailSent: results.ownerSent,
        providerEmailSent: results.providerSent,
      },
    });
  } catch (error: any) {
    console.error('Error in booking notify API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

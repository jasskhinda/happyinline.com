import { NextRequest, NextResponse } from 'next/server';
import { sendBookingNotifications } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase-admin';
import { createBookingEvent, formatBookingForCalendar, refreshAccessToken } from '@/lib/google-calendar';

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

    const supabase = createAdminClient();

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

    // Fetch owner details with Google Calendar tokens
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('id, name, email, google_calendar_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry')
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

    // Sync to Google Calendar if owner has it connected
    let calendarSynced = false;
    let calendarEventId = null;

    if (owner?.google_calendar_connected && owner?.google_calendar_access_token) {
      console.log('📅 Attempting to sync to Google Calendar...');

      let accessToken = owner.google_calendar_access_token;
      const refreshToken = owner.google_calendar_refresh_token;

      // Check if token is expired and refresh if needed
      if (owner.google_calendar_token_expiry) {
        const expiryDate = new Date(owner.google_calendar_token_expiry);
        if (expiryDate < new Date()) {
          console.log('📅 Access token expired, refreshing...');
          if (refreshToken) {
            const newTokens = await refreshAccessToken(refreshToken);
            if (newTokens) {
              accessToken = newTokens.access_token;
              // Update tokens in database
              await supabase
                .from('profiles')
                .update({
                  google_calendar_access_token: newTokens.access_token,
                  google_calendar_token_expiry: newTokens.expiry_date
                    ? new Date(newTokens.expiry_date).toISOString()
                    : null
                })
                .eq('id', owner.id);
            }
          }
        }
      }

      // Format booking data for calendar
      const calendarEventData = formatBookingForCalendar({
        customerName: customer.name || 'Customer',
        services: booking.services || [],
        appointmentDate: booking.appointment_date,
        appointmentTime: booking.appointment_time,
        shopName: shop.name,
        shopAddress: fullAddress || undefined,
        customerNotes: booking.customer_notes || undefined,
        totalAmount: booking.total_amount
      });

      // Create calendar event
      const calendarResult = await createBookingEvent(
        accessToken,
        refreshToken || undefined,
        calendarEventData
      );

      if (calendarResult.success) {
        calendarSynced = true;
        calendarEventId = calendarResult.eventId;
        console.log('📅 Calendar event created:', calendarResult.eventLink);

        // Store event ID in booking for future reference (e.g., cancellation)
        if (calendarEventId) {
          await supabase
            .from('bookings')
            .update({ google_calendar_event_id: calendarEventId })
            .eq('id', bookingId);
        }
      } else {
        console.error('📅 Failed to create calendar event:', calendarResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        customerEmailSent: results.customerSent,
        ownerEmailSent: results.ownerSent,
        providerEmailSent: results.providerSent,
        calendarSynced,
        calendarEventId
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

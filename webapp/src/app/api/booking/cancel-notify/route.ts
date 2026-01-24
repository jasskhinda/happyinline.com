import { NextRequest, NextResponse } from 'next/server';
import { sendCancellationNotifications } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase-admin';
import { deleteCalendarEvent, refreshAccessToken } from '@/lib/google-calendar';

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
    const supabase = createAdminClient();

    // Fetch booking with all related data
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
        status,
        google_calendar_event_id
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found', details: bookingError?.message },
        { status: 404 }
      );
    }

    console.log('📧 Booking found:', { id: booking.id, shop_id: booking.shop_id, customer_id: booking.customer_id });

    // Fetch shop details
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, created_by')
      .eq('id', booking.shop_id)
      .single();

    if (shopError || !shop) {
      console.error('Error fetching shop:', shopError, 'shop_id:', booking.shop_id);
      return NextResponse.json(
        { error: 'Shop not found', shop_id: booking.shop_id, details: shopError?.message },
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

    // Fetch owner details with Google Calendar tokens
    const { data: owner } = await supabase
      .from('profiles')
      .select('id, name, email, google_calendar_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry')
      .eq('id', shop.created_by)
      .single();

    // Fetch provider details with Google Calendar tokens if assigned
    // Check both barber_id (legacy) and provider_id (mobile app uses this)
    let provider = null;
    const providerId = booking.barber_id || booking.provider_id;
    if (providerId) {
      const { data: providerData } = await supabase
        .from('profiles')
        .select('id, name, email, google_calendar_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry')
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

    // Delete Google Calendar event if it exists
    let calendarDeleted = false;
    if (booking.google_calendar_event_id) {
      // Determine who to delete calendar event for: provider first (if assigned and has calendar), then owner
      const calendarUser = (provider?.google_calendar_connected && provider?.google_calendar_access_token)
        ? provider
        : (owner?.google_calendar_connected && owner?.google_calendar_access_token)
          ? owner
          : null;

      if (calendarUser) {
        console.log('📅 Attempting to delete Google Calendar event...');

        let accessToken = calendarUser.google_calendar_access_token;
        const refreshToken = calendarUser.google_calendar_refresh_token;

        // Check if token is expired and refresh if needed
        if (calendarUser.google_calendar_token_expiry) {
          const expiryDate = new Date(calendarUser.google_calendar_token_expiry);
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
                  .eq('id', calendarUser.id);
              }
            }
          }
        }

        // Delete calendar event
        const calendarResult = await deleteCalendarEvent(
          accessToken,
          refreshToken || undefined,
          booking.google_calendar_event_id
        );

        if (calendarResult.success) {
          calendarDeleted = true;
          console.log('📅 Calendar event deleted successfully');

          // Clear the event ID from booking record
          await supabase
            .from('bookings')
            .update({ google_calendar_event_id: null })
            .eq('id', bookingId);
        } else {
          console.error('📅 Failed to delete calendar event:', calendarResult.error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: results,
      calendarDeleted,
    });

  } catch (error: any) {
    console.error('Error in booking cancel-notify API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

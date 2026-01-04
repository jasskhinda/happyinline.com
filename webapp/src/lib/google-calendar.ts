import { google } from 'googleapis';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : 'http://localhost:3000/api/auth/google/callback';

// OAuth scopes needed for calendar access
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

/**
 * Create OAuth2 client
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate OAuth authorization URL
 * @param userId - The user ID to associate with this connection
 * @param redirectPath - Optional path to redirect to after connection (defaults to /shop/settings)
 */
export function getAuthUrl(userId: string, redirectPath?: string): string {
  const oauth2Client = createOAuth2Client();

  // Encode both userId and redirectPath in the state parameter
  const stateData = JSON.stringify({ userId, redirectPath: redirectPath || '/shop/settings' });
  const state = Buffer.from(stateData).toString('base64');

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
    state // Encoded state containing userId and redirect info
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return {
    access_token: tokens.access_token || '',
    refresh_token: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date || undefined
  };
}

/**
 * Create authenticated calendar client
 */
export function createCalendarClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

interface BookingEventData {
  summary: string;
  description: string;
  startDateTime: string; // ISO format
  endDateTime: string; // ISO format
  location?: string;
  customerName?: string;
  customerEmail?: string;
}

/**
 * Create a calendar event for a booking
 */
export async function createBookingEvent(
  accessToken: string,
  refreshToken: string | undefined,
  eventData: BookingEventData
): Promise<{ success: boolean; eventId?: string; eventLink?: string; error?: string }> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: 'America/Los_Angeles' // Default timezone, could be made configurable
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: 'America/Los_Angeles'
      },
      location: eventData.location,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 }, // 1 hour before
          { method: 'popup', minutes: 30 }  // 30 min before
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });

    return {
      success: true,
      eventId: response.data.id || undefined,
      eventLink: response.data.htmlLink || undefined
    };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to create calendar event'
    };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete calendar event'
    };
  }
}

/**
 * Format booking data into calendar event
 */
export function formatBookingForCalendar(booking: {
  customerName: string;
  services: Array<{ name: string; duration_minutes?: number; duration?: number }>;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  shopName: string;
  shopAddress?: string;
  customerNotes?: string;
  totalAmount?: number;
}): BookingEventData {
  // Calculate total duration
  const totalMinutes = booking.services.reduce((sum, s) => {
    return sum + (s.duration_minutes || s.duration || 30);
  }, 0);

  // Parse date and time
  const [year, month, day] = booking.appointmentDate.split('-').map(Number);
  const [hours, minutes] = booking.appointmentTime.split(':').map(Number);

  const startDate = new Date(year, month - 1, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);

  // Format services list
  const servicesList = booking.services.map(s => s.name).join(', ');

  // Build description
  let description = `Customer: ${booking.customerName}\n`;
  description += `Services: ${servicesList}\n`;
  if (booking.totalAmount) {
    description += `Total: $${booking.totalAmount.toFixed(2)}\n`;
  }
  if (booking.customerNotes) {
    description += `\nNotes: ${booking.customerNotes}`;
  }
  description += '\n\n---\nBooked via Happy InLine';

  return {
    summary: `${booking.customerName} - ${booking.shopName}`,
    description,
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    location: booking.shopAddress,
    customerName: booking.customerName
  };
}

/**
 * Refresh access token if expired
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expiry_date?: number;
} | null> {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      access_token: credentials.access_token || '',
      expiry_date: credentials.expiry_date || undefined
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

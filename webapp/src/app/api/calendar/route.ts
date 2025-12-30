import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/calendar - Get auth URL for connecting calendar
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Generate auth URL
    const authUrl = getAuthUrl(userId);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}

// POST /api/calendar - Disconnect calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    if (action === 'disconnect') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required' },
          { status: 400 }
        );
      }

      const supabase = createAdminClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          google_calendar_access_token: null,
          google_calendar_refresh_token: null,
          google_calendar_token_expiry: null,
          google_calendar_connected: false
        })
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in calendar API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

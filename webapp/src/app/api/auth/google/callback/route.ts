import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-calendar';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the userId
    const error = searchParams.get('error');

    // Handle errors from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/shop/settings?calendar_error=access_denied', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/shop/settings?calendar_error=missing_params', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL('/shop/settings?calendar_error=token_exchange_failed', request.url)
      );
    }

    // Store tokens in database
    const supabase = createAdminClient();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_calendar_access_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token || null,
        google_calendar_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        google_calendar_connected: true
      })
      .eq('id', state);

    if (updateError) {
      console.error('Error storing tokens:', updateError);
      return NextResponse.redirect(
        new URL('/shop/settings?calendar_error=storage_failed', request.url)
      );
    }

    // Success - redirect back to settings
    return NextResponse.redirect(
      new URL('/shop/settings?calendar_connected=true', request.url)
    );
  } catch (error: any) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/shop/settings?calendar_error=unknown', request.url)
    );
  }
}

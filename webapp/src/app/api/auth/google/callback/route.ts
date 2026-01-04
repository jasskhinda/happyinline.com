import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-calendar';
import { createAdminClient } from '@/lib/supabase-admin';

// Parse state parameter which can be either plain userId (legacy) or JSON encoded
function parseState(state: string): { userId: string; redirectPath: string } {
  try {
    // Try to decode as base64 JSON first (new format)
    const decoded = Buffer.from(state, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    return {
      userId: parsed.userId,
      redirectPath: parsed.redirectPath || '/shop/settings'
    };
  } catch {
    // Fall back to treating state as plain userId (legacy format)
    return {
      userId: state,
      redirectPath: '/shop/settings'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Parse state to get userId and redirect path
    const { userId, redirectPath } = state ? parseState(state) : { userId: '', redirectPath: '/shop/settings' };

    // Handle errors from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(`${redirectPath}?calendar=error`, request.url)
      );
    }

    if (!code || !userId) {
      return NextResponse.redirect(
        new URL(`${redirectPath}?calendar=error`, request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL(`${redirectPath}?calendar=error`, request.url)
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
      .eq('id', userId);

    if (updateError) {
      console.error('Error storing tokens:', updateError);
      return NextResponse.redirect(
        new URL(`${redirectPath}?calendar=error`, request.url)
      );
    }

    // Success - redirect back to the appropriate page
    return NextResponse.redirect(
      new URL(`${redirectPath}?calendar=connected`, request.url)
    );
  } catch (error: any) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/shop/settings?calendar=error', request.url)
    );
  }
}

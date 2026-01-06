import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/customer/settings';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Handle PKCE code exchange (new flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if this was an email change by looking at the type or just redirect to next
      return NextResponse.redirect(new URL(`${next}?email_changed=true`, requestUrl.origin));
    }

    console.error('Auth callback code exchange error:', error);
    return NextResponse.redirect(new URL(`${next}?email_error=true`, requestUrl.origin));
  }

  // Handle token_hash verification (legacy flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error) {
      // Redirect based on the type of verification
      if (type === 'email_change') {
        // Email change confirmed - redirect to settings with success message
        return NextResponse.redirect(new URL(`${next}?email_changed=true`, requestUrl.origin));
      }

      // For other types, redirect to the next URL
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    console.error('Auth callback error:', error);

    // Redirect with error
    return NextResponse.redirect(new URL(`${next}?email_error=true`, requestUrl.origin));
  }

  // If no token or code, just redirect to the next URL
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

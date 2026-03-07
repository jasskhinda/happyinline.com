import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle /join/* routes
  if (!pathname.startsWith('/join/')) return NextResponse.next();

  const userAgent = request.headers.get('user-agent') || '';
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);

  // Mobile users: redirect to app store
  // (If the app IS installed, Universal Links / App Links intercept before this runs)
  if (isIOS) {
    return NextResponse.redirect('https://apps.apple.com/ca/app/happy-inline/id6756240306');
  }
  if (isAndroid) {
    return NextResponse.redirect('https://play.google.com/store/apps/details?id=com.happyinline.app');
  }

  // Desktop: show the web page
  return NextResponse.next();
}

export const config = {
  matcher: '/join/:path*',
};

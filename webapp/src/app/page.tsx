import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-page-gradient text-[var(--text-primary)] font-sans overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-5 pt-32 pb-20 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(3, 147, 213, 0.4), transparent), radial-gradient(ellipse 60% 40% at 50% 120%, rgba(3, 147, 213, 0.2), transparent), linear-gradient(to bottom right, var(--primary-dark), var(--primary), var(--primary-dark))'
        }}
      >
        <div className="relative z-10 max-w-[900px]">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-gradient">
            Happy InLine
          </h1>

          <p className="text-xl md:text-2xl text-[var(--text-muted)] italic mb-6">
            &quot;The Only Place You&apos;ll Be HAPPY In Line&quot;
          </p>

          <p className="text-lg text-[var(--text-muted)] max-w-[650px] mx-auto mb-12">
            The complete booking platform for service businesses. Owners manage their shops, customers book appointments — all connected through one seamless ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-3 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-medium px-8 py-4 rounded-full transition-all hover:scale-105 shadow-brand"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              Register Your Business
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-3 bg-transparent border border-[var(--border-light)] hover:bg-white/10 text-white font-medium px-8 py-4 rounded-full transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* App Download Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
            {/* Business App */}
            <div className="bg-white/[0.07] backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"></path>
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">Happy InLine Business</h3>
                  <p className="text-white/50 text-xs">For Business Owners &amp; Providers</p>
                </div>
              </div>
              <div className="mb-4 rounded-xl overflow-hidden">
                <img
                  src="/business.png"
                  alt="Happy InLine Business App"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <a
                  href="https://apps.apple.com/ca/app/happy-inline-business/id6760150083"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-black font-medium px-5 py-3 rounded-xl transition-all hover:bg-white/90 text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Download on App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.happyinline.provider"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-black font-medium px-5 py-3 rounded-xl transition-all hover:bg-white/90 text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                  </svg>
                  Download on Google Play
                </a>
              </div>
            </div>

            {/* Customer App */}
            <div className="bg-white/[0.07] backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">Happy InLine Customer</h3>
                  <p className="text-white/50 text-xs">For Customers</p>
                </div>
              </div>
              <div className="mb-4 rounded-xl overflow-hidden">
                <img
                  src="/customer.png"
                  alt="Happy InLine Customer App"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <a
                  href="https://apps.apple.com/ca/app/happy-inline/id6756240306"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-black font-medium px-5 py-3 rounded-xl transition-all hover:bg-white/90 text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Download on App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.happyinline.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-black font-medium px-5 py-3 rounded-xl transition-all hover:bg-white/90 text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                  </svg>
                  Download on Google Play
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-5 bg-[var(--primary)]">
        <div className="text-center max-w-[800px] mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 text-gradient">
            Two apps. One ecosystem.
          </h2>
          <p className="text-xl text-[var(--text-muted)]">
            A complete booking platform that connects business owners with their customers seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[1200px] mx-auto">
          {/* Large Feature Card - How It Works */}
          <div className="md:col-span-2 glass-card p-12 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center mb-6 shadow-brand">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Set up your shop in minutes</h3>
              <p className="text-[var(--text-muted)] text-lg leading-relaxed">
                Register on happyinline.com, add your services and staff, set your operating hours, and share your unique QR code. Customers scan it to instantly connect with your business.
              </p>
            </div>
            <div className="flex justify-center">
              <svg viewBox="0 0 200 200" fill="none" className="w-48 h-48">
                {/* QR Code illustration */}
                <rect x="40" y="40" width="120" height="120" rx="12" stroke="url(#grad1)" strokeWidth="2" fill="none"/>
                <rect x="55" y="55" width="30" height="30" rx="4" fill="var(--brand)" opacity="0.8"/>
                <rect x="115" y="55" width="30" height="30" rx="4" fill="var(--brand)" opacity="0.8"/>
                <rect x="55" y="115" width="30" height="30" rx="4" fill="var(--brand)" opacity="0.8"/>
                <rect x="95" y="95" width="15" height="15" rx="2" fill="var(--brand)" opacity="0.5"/>
                <rect x="115" y="115" width="15" height="15" rx="2" fill="var(--brand)" opacity="0.5"/>
                <rect x="135" y="95" width="10" height="10" rx="2" fill="var(--brand)" opacity="0.3"/>
                <rect x="95" y="135" width="10" height="10" rx="2" fill="var(--brand)" opacity="0.3"/>
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--brand)"/>
                    <stop offset="100%" stopColor="var(--brand-light)"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Feature Card 1 - QR Connect */}
          <div className="glass-card p-10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center mb-6 shadow-brand">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Scan & connect</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">Customers scan your shop&apos;s QR code to instantly join your business. No searching, no sign-up friction — just scan and book.</p>
          </div>

          {/* Feature Card 2 - Real-time Booking */}
          <div className="glass-card p-10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center mb-6 shadow-brand">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Real-time availability</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">Customers see live availability for each provider. Pick a service, choose a provider, select a time slot — booked in seconds.</p>
          </div>

          {/* Feature Card 3 - Google Calendar */}
          <div className="glass-card p-10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center mb-6 shadow-brand">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Google Calendar sync</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">Every booking automatically syncs to your Google Calendar. Stay organized without any extra effort.</p>
          </div>

          {/* Feature Card 4 - Messaging */}
          <div className="glass-card p-10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center mb-6 shadow-brand">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Built-in messaging</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">Customers and providers can message each other directly in the app. Discuss preferences, send updates, or reschedule with ease.</p>
          </div>

          {/* Feature Card 5 - Push Notifications */}
          <div className="glass-card p-10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center mb-6 shadow-brand">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 01-3.46 0"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Instant notifications</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">Get push notifications for new bookings, cancellations, messages, and reminders. Never miss an appointment again.</p>
          </div>

          {/* Feature Card 6 - Business Management */}
          <div className="glass-card p-10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center mb-6 shadow-brand">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                <path d="M16 3.13a4 4 0 010 7.75"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Manage your team</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">Add staff members, assign services to providers, set individual schedules, and track bookings across your entire team.</p>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-32 px-5 bg-gradient-to-b from-[var(--primary)] to-[var(--primary-dark)]">
        <div className="text-center max-w-[800px] mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 text-gradient">
            Built for every service industry.
          </h2>
          <p className="text-xl text-[var(--text-muted)]">
            Whatever your business, Happy InLine helps you manage bookings and grow your client base.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center max-w-[1000px] mx-auto">
          {['Barbershops', 'Hair Salons', 'Nail Salons', 'Spas & Wellness', 'Beauty Services', 'Massage Therapy', 'Fitness Studios', 'Personal Training', 'Pet Grooming', 'Auto Detailing', 'Home Services', 'Professional Services', 'Healthcare', 'Tutoring', 'And More'].map((industry) => (
            <span
              key={industry}
              className="bg-[var(--surface-card)] border border-[var(--border-light)] rounded-full px-6 py-3 text-sm font-medium hover:bg-[var(--brand)] hover:border-[var(--brand)] transition-all cursor-default"
            >
              {industry}
            </span>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-5 text-center"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(3, 147, 213, 0.3), transparent), linear-gradient(to bottom, var(--primary-dark), var(--primary-dark))'
        }}
      >
        <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gradient">
          Ready to grow your business?
        </h2>
        <p className="text-xl text-[var(--text-muted)] mb-10">
          Register your business, add your team, and start accepting bookings today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-3 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-medium px-8 py-4 rounded-full transition-all hover:scale-105 shadow-brand"
          >
            Register Your Business
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-3 bg-transparent border border-[var(--border-light)] hover:bg-white/10 text-white font-medium px-8 py-4 rounded-full transition-all"
          >
            Sign In
          </Link>
        </div>
        <p className="mt-8 text-sm text-white/60">
          By using Happy InLine, you agree to our{' '}
          <Link href="/privacy" className="text-[#0393d5] underline hover:text-white">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="text-[#0393d5] underline hover:text-white">
            Terms of Service
          </Link>
        </p>
      </section>

      <Footer />
    </div>
  );
}

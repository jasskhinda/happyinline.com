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
            Connect your business directly with your customers. No distractions. No competitors. Just your business and your customers.
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

      {/* For Business Owners */}
      <section className="py-28 px-5 bg-[var(--primary)]">
        <div className="text-center max-w-[800px] mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 text-gradient">
            For Business Owners
          </h2>
          <p className="text-xl text-[var(--text-muted)]">
            Get your business set up and accepting bookings in minutes.
          </p>
        </div>

        <div className="max-w-[900px] mx-auto space-y-5">
          <div className="glass-card p-8 md:p-10 flex gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">Register & set up your store</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Create your account at happyinline.com. Add your business name, location, hours of operation, services with pricing, and your team of providers. Don&apos;t want to set it up yourself? Any account with an active subscription can request our team to set up your business for you.
              </p>
            </div>
          </div>

          <div className="glass-card p-8 md:p-10 flex gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">Submit for review</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Once your store is ready, submit it for review. Our team reviews every new listing within 2-3 business days. Once approved, your business is live and ready to accept bookings.
              </p>
            </div>
          </div>

          <div className="glass-card p-8 md:p-10 flex gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">Share your QR code</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Every verified business gets a unique QR code and business ID. Share it however you want — in your shop, on social media, on business cards, on your website. Customers scan it, download the Happy InLine Customer app, and register with your business.
              </p>
            </div>
          </div>

          <div className="glass-card p-8 md:p-10 flex gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xl">4</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">Manage from the Business app</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Download the Happy InLine Business app. Add or remove providers, view your calendar with all upcoming bookings, message directly with customers, and sync with Google Calendar so you never miss an appointment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Customers */}
      <section className="py-28 px-5 bg-gradient-to-b from-[var(--primary)] to-[var(--primary-dark)]">
        <div className="text-center max-w-[800px] mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 text-gradient">
            For Customers
          </h2>
          <p className="text-xl text-[var(--text-muted)]">
            Scan, book, and show up. It&apos;s that simple.
          </p>
        </div>

        <div className="max-w-[900px] mx-auto space-y-5">
          <div className="glass-card p-8 md:p-10 flex gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">Scan the QR code</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                See a QR code at your favorite shop? Scan it with the Happy InLine Customer app. You&apos;ll instantly connect to that business — no searching, no browsing through listings.
              </p>
            </div>
          </div>

          <div className="glass-card p-8 md:p-10 flex gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">Your business becomes your home shop</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Once connected, you only see that business. No distractions from competitors. Browse their services, pick your favorite provider, and book an appointment — all in seconds.
              </p>
            </div>
          </div>

          <div className="glass-card p-8 md:p-10 flex gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-2xl flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">Book & communicate</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Choose a service, select a time slot, and you&apos;re booked. Message your provider directly through the app to discuss preferences or get updates. Get push notifications so you never forget an appointment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-28 px-5 bg-[var(--primary-dark)]">
        <div className="text-center max-w-[800px] mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 text-gradient">
            What makes Happy InLine different?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1100px] mx-auto">
          {[
            {
              icon: (
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              ),
              title: 'Exclusive connection',
              desc: 'Your customers see only your business. Not a marketplace full of competitors.'
            },
            {
              icon: (
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="8" height="8" rx="1"></rect>
                  <rect x="14" y="2" width="8" height="8" rx="1"></rect>
                  <rect x="2" y="14" width="8" height="8" rx="1"></rect>
                  <rect x="14" y="14" width="8" height="8" rx="1"></rect>
                </svg>
              ),
              title: 'QR code sharing',
              desc: 'The simplest way to onboard customers. Scan and they\u2019re connected to your business.'
            },
            {
              icon: (
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                </svg>
              ),
              title: 'Direct messaging',
              desc: 'Communication between you and your customers stays in one place.'
            },
            {
              icon: (
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ),
              title: 'Google Calendar sync',
              desc: 'Never double-book or miss an appointment. Every booking syncs automatically.'
            },
            {
              icon: (
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 010 7.75"></path>
                </svg>
              ),
              title: 'Works for any industry',
              desc: 'Barbershops, salons, clinics, consultants, fitness studios, and more.'
            },
            {
              icon: (
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 01-3.46 0"></path>
                </svg>
              ),
              title: 'Push notifications',
              desc: 'Instant alerts for new bookings, messages, cancellations, and reminders.'
            },
          ].map((feature) => (
            <div key={feature.title} className="glass-card p-8 hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] rounded-xl flex items-center justify-center mb-4 shadow-brand">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feature.desc}</p>
            </div>
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
          Your customers. Your business. No distractions.
        </h2>
        <p className="text-xl text-[var(--text-muted)] mb-10">
          Get started at happyinline.com today.
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

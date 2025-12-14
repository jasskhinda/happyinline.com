import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-[#F5F5F7] font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex justify-between items-center px-5 md:px-12 h-16 max-w-[1400px] mx-auto">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Happy InLine" width={50} height={50} />
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/login" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
              Login
            </Link>
            <Link
              href="/register"
              className="bg-[#0393d5] hover:bg-[#027bb5] text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              Register Business
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-5 pt-32 pb-20 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(3, 147, 213, 0.3), transparent), radial-gradient(ellipse 60% 40% at 50% 120%, rgba(3, 147, 213, 0.15), transparent), #000'
        }}
      >
        <div className="relative z-10 max-w-[900px]">
          <p className="text-[#0393d5] text-sm md:text-base font-medium tracking-wider uppercase mb-4">
            Introducing
          </p>

          <div className="w-64 md:w-80 mx-auto mb-12 animate-[float_6s_ease-in-out_infinite]">
            <Image
              src="/phone-mockup.png"
              alt="Happy InLine App"
              width={320}
              height={640}
              className="w-full h-auto drop-shadow-2xl"
              priority
            />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-[#A1A1A6] bg-clip-text text-transparent">
            Happy InLine
          </h1>

          <p className="text-xl md:text-2xl text-[#86868B] italic mb-6">
            &quot;The Only Place You&apos;ll Be HAPPY In Line&quot;
          </p>

          <p className="text-lg text-[#86868B] max-w-[650px] mx-auto mb-12">
            Book appointments instantly with local service providers. No more waiting. No more lines. Just show up at your time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-3 bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium px-8 py-4 rounded-full transition-all hover:scale-105"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              Register Your Business
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-3 bg-transparent border border-white/30 hover:bg-white/10 text-white font-medium px-8 py-4 rounded-full transition-all"
            >
              Sign In
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <span className="inline-flex items-center gap-2 bg-white/10 text-[#86868B] px-6 py-3 rounded-full text-sm border border-white/10">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              App Store - Coming Soon
            </span>
            <span className="inline-flex items-center gap-2 bg-white/10 text-[#86868B] px-6 py-3 rounded-full text-sm border border-white/10">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
              </svg>
              Google Play - Coming Soon
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-5 bg-black">
        <div className="text-center max-w-[800px] mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-b from-white to-[#A1A1A6] bg-clip-text text-transparent">
            Built for modern life.
          </h2>
          <p className="text-xl text-[#86868B]">
            Everything you need to book services, all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[1200px] mx-auto">
          {/* Large Feature Card */}
          <div className="md:col-span-2 bg-gradient-to-b from-[#1D1D1F] to-[#161617] rounded-3xl p-12 border border-white/10 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#0393d5] to-[#00D4FF] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#0393d5]/30">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Book in seconds</h3>
              <p className="text-[#86868B] text-lg leading-relaxed">
                Find available slots, pick your time, and confirm your appointment. It&apos;s that simple. No phone calls. No waiting on hold.
              </p>
            </div>
            <div className="flex justify-center">
              <svg viewBox="0 0 200 200" fill="none" className="w-48 h-48">
                <circle cx="100" cy="100" r="80" stroke="url(#grad1)" strokeWidth="2" fill="none"/>
                <circle cx="100" cy="100" r="60" stroke="url(#grad1)" strokeWidth="2" fill="none" opacity="0.5"/>
                <circle cx="100" cy="100" r="40" stroke="url(#grad1)" strokeWidth="2" fill="none" opacity="0.3"/>
                <circle cx="100" cy="100" r="8" fill="#0393d5"/>
                <line x1="100" y1="100" x2="100" y2="50" stroke="#F5F5F7" strokeWidth="3" strokeLinecap="round"/>
                <line x1="100" y1="100" x2="140" y2="100" stroke="#0393d5" strokeWidth="2" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0393d5"/>
                    <stop offset="100%" stopColor="#00D4FF"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Feature Card 1 */}
          <div className="bg-gradient-to-b from-[#1D1D1F] to-[#161617] rounded-3xl p-10 border border-white/10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0393d5] to-[#00D4FF] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#0393d5]/30">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Discover nearby</h3>
            <p className="text-[#86868B] leading-relaxed">Find the best-rated service providers in your area. Read reviews from real customers.</p>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-gradient-to-b from-[#1D1D1F] to-[#161617] rounded-3xl p-10 border border-white/10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0393d5] to-[#00D4FF] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#0393d5]/30">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Skip the wait</h3>
            <p className="text-[#86868B] leading-relaxed">Arrive at your scheduled time and get served immediately. Your time is valuable.</p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-gradient-to-b from-[#1D1D1F] to-[#161617] rounded-3xl p-10 border border-white/10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0393d5] to-[#00D4FF] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#0393d5]/30">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Secure & private</h3>
            <p className="text-[#86868B] leading-relaxed">Your data is encrypted and protected. We never share your information without consent.</p>
          </div>

          {/* Feature Card 4 */}
          <div className="bg-gradient-to-b from-[#1D1D1F] to-[#161617] rounded-3xl p-10 border border-white/10 hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0393d5] to-[#00D4FF] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#0393d5]/30">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Direct messaging</h3>
            <p className="text-[#86868B] leading-relaxed">Chat directly with service providers. Ask questions, share preferences, get updates.</p>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-32 px-5 bg-gradient-to-b from-black to-[#0D0D0D]">
        <div className="text-center max-w-[800px] mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-b from-white to-[#A1A1A6] bg-clip-text text-transparent">
            One app. Every service.
          </h2>
          <p className="text-xl text-[#86868B]">
            From haircuts to home repairs, we&apos;ve got you covered.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center max-w-[1000px] mx-auto">
          {['Barbershops', 'Hair Salons', 'Nail Salons', 'Spas & Wellness', 'Beauty Services', 'Massage Therapy', 'Fitness Studios', 'Personal Training', 'Pet Grooming', 'Auto Detailing', 'Home Services', 'Professional Services', 'Healthcare', 'Tutoring', 'And More'].map((industry) => (
            <span
              key={industry}
              className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-sm font-medium hover:bg-[#0393d5] hover:border-[#0393d5] transition-all cursor-default"
            >
              {industry}
            </span>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-5 text-center"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(3, 147, 213, 0.2), transparent), #000'
        }}
      >
        <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white to-[#A1A1A6] bg-clip-text text-transparent">
          Ready to skip the line?
        </h2>
        <p className="text-xl text-[#86868B] mb-10">
          Register your business or sign in to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-3 bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium px-8 py-4 rounded-full transition-all hover:scale-105"
          >
            Register Your Business
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-3 bg-transparent border border-white/30 hover:bg-white/10 text-white font-medium px-8 py-4 rounded-full transition-all"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12 px-5">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-8">
            <Link href="/" className="text-[#86868B] hover:text-white text-sm transition-colors">Home</Link>
            <Link href="/privacy" className="text-[#86868B] hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <a href="mailto:info@happyinline.com" className="text-[#86868B] hover:text-white text-sm transition-colors">Contact</a>
          </div>
          <p className="text-[#48484A] text-sm">
            Copyright &copy; {new Date().getFullYear()} Happy InLine. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

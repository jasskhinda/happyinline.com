'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b]">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-24">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
          <div className="w-20 h-20 bg-[#0393d5]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#0393d5]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            Registration Closed
          </h1>
          <p className="text-white/70 text-lg mb-6">
            We are not accepting new registrations at the moment. Please check back later or contact us for more information.
          </p>

          <div className="bg-white/5 rounded-xl p-5 mb-6">
            <p className="text-white/60 text-sm mb-3">Have questions? Get in touch with our team:</p>
            <div className="space-y-2">
              <a href="mailto:info@jasskhinda.com" className="text-[#0393d5] hover:text-white font-medium transition-colors block">
                info@jasskhinda.com
              </a>
              <a href="tel:+16473556441" className="text-[#0393d5] hover:text-white font-medium transition-colors block">
                (647) 355-6441
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Back to Home
            </Link>
            <Link
              href="/contact"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all border border-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

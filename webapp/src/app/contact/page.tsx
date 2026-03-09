'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b]">
      <Header />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
        <p className="text-[#0393d5] mb-8">We&apos;d love to hear from you. Reach out anytime.</p>

        <div className="space-y-6">
          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Get in Touch</h2>
            <p className="text-white/80 mb-6">
              Have questions, feedback, or need support? Contact us using the information below
              and we&apos;ll get back to you as soon as possible.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0393d5]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#0393d5]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Email</p>
                  <a href="mailto:info@jasskhinda.com" className="text-white font-medium hover:text-[#0393d5] transition-colors">
                    info@jasskhinda.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0393d5]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#0393d5]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Phone</p>
                  <a href="tel:+16473556441" className="text-white font-medium hover:text-[#0393d5] transition-colors">
                    (647) 355-6441
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">Support Hours</h2>
            <p className="text-white/80">
              Monday &ndash; Friday: 9:00 AM &ndash; 6:00 PM (EST)<br />
              We aim to respond to all inquiries within 24 hours.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

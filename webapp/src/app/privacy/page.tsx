'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b]">
      <Header />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-[#0393d5] mb-8">Last updated: December 2024</p>

        <div className="space-y-8">
          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p className="text-white/80 mb-3">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-1">
              <li>Account information (name, email, phone number)</li>
              <li>Business information (business name, address, services offered)</li>
              <li>Booking information (appointment dates, times, services requested)</li>
              <li>Profile images and photos you upload</li>
              <li>Communications you send to us</li>
            </ul>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p className="text-white/80 mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-1">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process bookings and transactions</li>
              <li>Send appointment confirmations and reminders</li>
              <li>Communicate with you about products, services, and updates</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">3. Information Sharing</h2>
            <p className="text-white/80 mb-3">
              We do not sell your personal information. We may share your information:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-1">
              <li>With service providers who assist in our operations</li>
              <li>Between business owners and customers for booking purposes</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a merger or acquisition</li>
            </ul>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Security</h2>
            <p className="text-white/80">
              We implement appropriate security measures to protect your personal information.
              However, no method of transmission over the Internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p className="text-white/80">
              We retain your information for as long as your account is active or as needed to
              provide services. We may retain certain information as required by law or for
              legitimate business purposes.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p className="text-white/80 mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of marketing communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies and Tracking</h2>
            <p className="text-white/80">
              We use cookies and similar technologies to improve user experience, analyze usage,
              and assist in our marketing efforts. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-white/80">
              Our Service is not intended for children under 13. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p className="text-white/80">
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new Privacy Policy on this page.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact Us</h2>
            <p className="text-white/80">
              If you have questions about this Privacy Policy or our privacy practices,
              please contact us at{' '}
              <a href="mailto:info@jasskhinda.com" className="text-[#0393d5] hover:underline">
                info@jasskhinda.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

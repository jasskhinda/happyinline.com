'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b]">
      <Header />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-[#0393d5] mb-8">Last updated: December 2024</p>

        <div className="space-y-8">
          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-white/80">
              By accessing and using Happy InLine (&quot;Service&quot;), you accept and agree to be bound by the terms
              and provision of this agreement. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="text-white/80">
              Happy InLine provides a booking and queue management platform for service-based businesses
              including barbershops, salons, and similar establishments. Our Service allows business owners
              to manage appointments, customers to book services, and service providers to manage their schedules.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <p className="text-white/80 mb-3">
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-1">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">4. Subscription and Payment</h2>
            <p className="text-white/80">
              Business accounts require a paid subscription. By subscribing, you agree to pay all fees
              associated with your chosen plan. Subscriptions auto-renew unless cancelled.
              Refunds are available within 7 days of initial subscription purchase.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">5. User Conduct</h2>
            <p className="text-white/80 mb-3">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to transmit spam or malicious content</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p className="text-white/80">
              The Service and its original content, features, and functionality are owned by Happy InLine
              and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p className="text-white/80">
              Happy InLine shall not be liable for any indirect, incidental, special, consequential,
              or punitive damages resulting from your use of or inability to use the Service.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">8. Termination</h2>
            <p className="text-white/80">
              We may terminate or suspend your account and access to the Service immediately, without
              prior notice, for conduct that we believe violates these Terms or is harmful to other
              users, us, or third parties.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to Terms</h2>
            <p className="text-white/80">
              We reserve the right to modify these terms at any time. We will notify users of any
              material changes by posting the new Terms on this page.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact Us</h2>
            <p className="text-white/80">
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:info@happyinline.com" className="text-[#0393d5] hover:underline">
                info@happyinline.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

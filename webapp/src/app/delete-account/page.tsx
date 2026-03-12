'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09264b] via-[#0a3a6b] to-[#09264b]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold text-white mb-4">Delete Your Account</h1>
        <p className="text-[#0393d5] mb-8">Request deletion of your account and all associated data.</p>

        <div className="space-y-6">
          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">How to Request Account Deletion</h2>
            <p className="text-white/80 mb-4">
              To request the deletion of your Happy Inline account and all associated data,
              please send an email to the address below with the subject line
              &quot;Account Deletion Request&quot;.
            </p>
            <p className="text-white/80 mb-4">
              Include the following information in your email:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-2 mb-6">
              <li>Your full name</li>
              <li>The email address associated with your account</li>
              <li>Your phone number (if registered with one)</li>
            </ul>
            <a
              href="mailto:info@jasskhinda.com?subject=Account%20Deletion%20Request"
              className="inline-flex items-center gap-2 bg-[#0393d5] hover:bg-[#027bb5] text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Send Deletion Request
            </a>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">What Gets Deleted</h2>
            <p className="text-white/80 mb-3">
              When your account is deleted, the following data will be permanently removed:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>Your profile information (name, email, phone number)</li>
              <li>Your booking history</li>
              <li>Your chat messages</li>
              <li>Any photos or images you uploaded</li>
              <li>Business data (for business owners: shop, services, staff, and customer data)</li>
            </ul>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">Processing Time</h2>
            <p className="text-white/80">
              Account deletion requests are processed within 7 business days. You will receive
              a confirmation email once your account and data have been permanently deleted.
              Please note that this action is irreversible.
            </p>
          </section>

          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
            <p className="text-white/80">
              If you have any questions about account deletion, please contact us:
            </p>
            <div className="mt-3 space-y-2">
              <a href="mailto:info@jasskhinda.com" className="text-[#0393d5] hover:text-white font-medium transition-colors block">
                info@jasskhinda.com
              </a>
              <a href="tel:+16473556441" className="text-[#0393d5] hover:text-white font-medium transition-colors block">
                (647) 355-6441
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

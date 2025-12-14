import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[var(--surface-footer)] backdrop-blur-xl border-t border-[var(--border-light)] shadow-footer">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link href="/" className="flex items-center group">
              <div className="bg-white rounded-xl p-1 shadow-md group-hover:shadow-lg transition-shadow">
                <Image
                  src="/logo.png"
                  alt="Happy InLine"
                  width={50}
                  height={50}
                  className="rounded-lg"
                />
              </div>
            </Link>
            <p className="text-[var(--text-muted)] text-sm">
              Skip the wait. Join the line.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
            <Link
              href="/"
              className="text-white/70 hover:text-[var(--brand-light)] text-sm font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/privacy"
              className="text-white/70 hover:text-[var(--brand-light)] text-sm font-medium transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-white/70 hover:text-[var(--brand-light)] text-sm font-medium transition-colors"
            >
              Terms of Service
            </Link>
            <a
              href="mailto:info@happyinline.com"
              className="text-white/70 hover:text-[var(--brand-light)] text-sm font-medium transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-light)] my-6" />

        {/* Copyright & Social */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Happy InLine. All rights reserved.
          </p>

          {/* App Store Links */}
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-xs">Coming soon to</span>
            <div className="flex gap-2">
              <span className="text-white/70 text-xs font-medium px-2 py-1 bg-white/10 rounded">
                iOS
              </span>
              <span className="text-white/70 text-xs font-medium px-2 py-1 bg-white/10 rounded">
                Android
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { LogOut, User, Menu, X } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      setIsLoggedIn(!!user);
    } catch (err) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--surface-header)] backdrop-blur-xl border-b border-[var(--border-light)] shadow-header">
      <div className="flex justify-between items-center px-4 md:px-8 lg:px-12 py-2 max-w-[1400px] mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <div className="bg-white rounded-2xl p-1 shadow-md group-hover:shadow-lg transition-shadow">
            <Image
              src="/logo.png"
              alt="Happy InLine"
              width={70}
              height={70}
              className="rounded-xl"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {loading ? (
            <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-full" />
          ) : isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all hover:shadow-brand flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-white hover:text-[var(--brand-light)] text-sm font-semibold px-4 py-2.5 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all hover:shadow-brand"
              >
                Register Business
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-white hover:text-[var(--brand-light)] transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--surface-header)] border-t border-[var(--border-light)] px-4 py-4 space-y-3">
          {loading ? (
            <div className="w-full h-10 bg-gray-200 animate-pulse rounded-lg" />
          ) : isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center text-white hover:text-[var(--brand-light)] text-sm font-semibold px-6 py-3 transition-colors border border-[var(--border-light)] rounded-lg"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all"
              >
                Register Business
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

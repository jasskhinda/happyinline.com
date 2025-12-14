'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/10 shadow-lg">
      <div className="flex justify-between items-center px-5 md:px-12 h-24 max-w-[1400px] mx-auto">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Happy InLine" width={80} height={80} />
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          {loading ? (
            <div className="w-20 h-10" />
          ) : isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="bg-[#0393d5] hover:bg-[#027bb5] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-[#0393d5] hover:bg-[#027bb5] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-[#0393d5] hover:bg-[#027bb5] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                Register Business
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

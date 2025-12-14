import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-xl border-t border-black/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] py-12 px-5">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-8">
          <Link href="/" className="text-gray-600 hover:text-[#0393d5] text-sm transition-colors">
            Home
          </Link>
          <Link href="/privacy" className="text-gray-600 hover:text-[#0393d5] text-sm transition-colors">
            Privacy Policy
          </Link>
          <a href="mailto:info@happyinline.com" className="text-gray-600 hover:text-[#0393d5] text-sm transition-colors">
            Contact
          </a>
        </div>
        <p className="text-gray-500 text-sm">
          Copyright &copy; {new Date().getFullYear()} Happy InLine. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

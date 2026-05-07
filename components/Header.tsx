'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Buyer Directory', href: '/buyer-directory' },
  { label: 'Deal Analysis', href: '/property-analysis' },
  { label: 'Messaging', href: '/messaging' },
  { label: 'Funding', href: '/funding-partners' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/sign-in');
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 dark:bg-emerald-950/80 backdrop-blur-md border-b border-emerald-900/10 dark:border-emerald-100/10 shadow-sm flex justify-between items-center px-8 h-16 mx-auto bg-white">
      <div className="text-xl font-black text-primary tracking-tighter flex items-center gap-3 font-['Manrope']">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="LotScout Logo"
          className="h-8 w-8 object-contain"
          src="/logo.png"
        />
        LotScout
      </div>
      <nav className="hidden md:flex items-center gap-8 font-['Manrope'] font-bold tracking-tight h-full">
        {NAV_LINKS.map(({ label, href }) => {
          const isActive = href !== '#' && pathname === href;
          return (
            <a
              key={label}
              className={`h-full flex items-center transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-primary/70 hover:text-primary'
              }`}
              href={href}
            >
              {label}
            </a>
          );
        })}
      </nav>
      <div className="flex items-center gap-4">
        <button className="p-2 text-primary hover:bg-emerald-50 rounded-full transition-all">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            className="p-2 text-primary hover:bg-emerald-50 rounded-full transition-all"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-outline-variant/20 rounded-xl shadow-lg overflow-hidden z-50">
              <a
                href="/profile"
                className="flex items-center gap-3 px-4 py-3 text-sm text-primary font-['Manrope'] font-semibold hover:bg-emerald-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <span className="material-symbols-outlined text-base">person</span>
                My Profile
              </a>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary font-['Manrope'] font-semibold hover:bg-emerald-50 transition-colors border-t border-outline-variant/10"
                onClick={handleSignOut}
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

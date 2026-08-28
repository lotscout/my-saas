'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import NotificationBell from '@/components/NotificationBell';

const NAV_LINKS = [
  { label: 'Scout', href: '/advisor' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Leads', href: '/leads' },
  { label: 'Deal Analysis', href: '/property-analysis' },
  { label: 'Messaging', href: '/messaging' },
  { label: 'Funding', href: '/funding-partners' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prevent the marketplace/map from scrolling underneath the mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed top-0 w-full z-[10000] bg-white border-b border-emerald-900/10 shadow-sm">
        <div className="flex justify-between items-center px-4 sm:px-8 h-16 mx-auto">

          {/* Logo */}
          <div className="text-xl font-black text-primary tracking-tighter flex items-center gap-3 font-headline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="LotScout Logo" className="h-8 w-8 object-contain" src="/logo.png" />
            LotScout
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 font-headline font-bold tracking-tight h-full">
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

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <div className="relative" ref={dropdownRef}>
              <button
                className="p-2 text-primary hover:bg-emerald-50 rounded-full transition-all"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <span className="material-symbols-outlined">account_circle</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-outline-variant/20 rounded-xl shadow-lg overflow-hidden z-[10010]">
                  <a
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-primary font-headline font-semibold hover:bg-emerald-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className="material-symbols-outlined text-base">person</span>
                    My Profile
                  </a>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary font-headline font-semibold hover:bg-emerald-50 transition-colors border-t border-outline-variant/10"
                    onClick={handleSignOut}
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 text-primary hover:bg-emerald-50 rounded-full transition-all"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <span className="material-symbols-outlined">
                {mobileOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="fixed left-0 right-0 bottom-0 top-16 z-[9990] bg-white md:hidden overflow-y-auto overscroll-contain">
          <nav className="flex min-h-full flex-col bg-white px-4 py-4 font-headline font-bold shadow-2xl">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = href !== '#' && pathname === href;
              return (
                <a
                  key={label}
                  href={href}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 text-lg transition-colors ${
                    isActive ? 'text-primary bg-emerald-50' : 'text-primary/75 hover:text-primary hover:bg-emerald-50'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{label}</span>
                  {isActive && <span className="material-symbols-outlined text-xl">check</span>}
                </a>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}

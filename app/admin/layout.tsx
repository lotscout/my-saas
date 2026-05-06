'use client';

// SQL to run in Supabase before using this dashboard:
// ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
// UPDATE profiles SET is_admin = true WHERE email IN ('bobby@lotscout.com', 'bobby.r.oliver@gmail.com');
// ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS is_test_profile boolean DEFAULT false;

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/admin';
import Header from '@/components/Header';

const NAV = [
  { href: '/admin/dashboard', label: 'Overview',         icon: 'dashboard' },
  { href: '/admin/listings',  label: 'Listings Queue',   icon: 'list_alt' },
  { href: '/admin/users',     label: 'User Management',  icon: 'group' },
  { href: '/admin/messaging', label: 'Buyer Messaging',  icon: 'chat' },
  { href: '/admin/analysis',  label: 'Analysis Queue',   icon: 'analytics' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/sign-in'); return; }

        // select('*') so this never fails due to a missing is_admin column
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const isAdmin = profile?.is_admin === true || isAdminEmail(user.email);
        if (!isAdmin) { router.replace('/dashboard'); return; }

        if (profile?.first_name) setAdminName(profile.first_name);
        setAuthorized(true);
      } catch {
        router.replace('/sign-in');
      }
    })();
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#012d1d] flex items-center justify-center">
        <div className="text-white/40 text-sm font-medium flex items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          Verifying admin access…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-surface-container-low overflow-hidden font-body">
      <Header />
      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-none flex flex-col bg-[#012d1d] text-white">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LotScout" className="h-7 w-7 object-contain invert brightness-0 invert" />
            <div>
              <p className="font-headline font-black text-base tracking-tight leading-none">LotScout</p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-0.5">Admin</p>
            </div>
          </div>
        </div>

        {/* Welcome */}
        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-white/50 text-xs font-medium">Signed in as</p>
          <p className="text-white font-bold text-sm truncate">{adminName}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`}
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {icon}
                </span>
                {label}
              </a>
            );
          })}
        </nav>

        {/* Footer nav */}
        <div className="border-t border-white/10 py-3">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-6 py-2.5 text-sm font-semibold text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to LotScout
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      </div>
    </div>
  );
}

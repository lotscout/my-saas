'use client';

import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Buyer Directory', href: '/buyer-directory' },
  { label: 'Deal Analysis', href: '/property-analysis' },
  { label: 'Messaging', href: '#' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 dark:bg-emerald-950/80 backdrop-blur-md border-b border-emerald-900/10 dark:border-emerald-100/10 shadow-sm flex justify-between items-center px-8 h-16 mx-auto bg-white">
      <div className="text-xl font-black text-primary tracking-tighter flex items-center gap-3 font-['Manrope']">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="LotScout Logo"
          className="h-8 w-8 object-contain"
          src="https://lh3.googleusercontent.com/aida/ADBb0uhYBAhgZ_-NuYsbD3CApM8ydUhpttOgnrv0eUhsnJ9QLJo5tG0OMaweilffzmeN-Cm_GJHgSDGgUCy2EwmjDxzN7jgUdCFoVXWn9lWqfga67zPmp-jbdG6xc2QDBXnsTN364cgNt_-jE-l9w805yT7s2WNlamkDRsH4J-XC3yuETVEBCD1T94byjRQMfhgr8UhqzugL5ClZN_7J2MJVJBoE7PTz11yYJgXvc8bRph4wV9fecxQc7fmsK4CAEEdSbZ8eF_h0N-IzsG8"
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
        <button className="hidden md:flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg font-display font-bold text-sm hover:opacity-90 transition-all shadow-sm">
          <span className="material-symbols-outlined text-lg">add</span>
          Create Listing
        </button>
        <button className="p-2 text-primary hover:bg-emerald-50 rounded-full transition-all">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-primary hover:bg-emerald-50 rounded-full transition-all">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}

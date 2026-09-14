'use client';

import { useState } from 'react';

type Props = {
  roles: string[];
  variant: 'desktop' | 'mobile';
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || 'Unknown',
  };
}

export default function LandingSignupForm({ roles, variant }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDesktop = variant === 'desktop';
  const suffix = isDesktop ? '' : '-mobile';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem(`name${suffix}`) as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem(`email${suffix}`) as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem(`password${suffix}`) as HTMLInputElement).value;
    const market = (form.elements.namedItem(`market${suffix}`) as HTMLInputElement).value.trim();
    const dealGoal = (form.elements.namedItem(`goal${suffix}`) as HTMLSelectElement).value;
    const role = ((form.elements.namedItem(`role${suffix}`) as RadioNodeList).value || '').trim();
    const { firstName, lastName } = splitName(name);

    if (!firstName || !email || !password) {
      setError('Please enter your name, email, and password.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        market,
        dealGoal,
        role,
        signupSource: 'landing-acq-mock',
        signupMedium: 'landing_form',
        signupCampaign: 'buyer_seller_match',
      }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = String(json.error || '');
      if (res.status === 409 || /already|registered|exists/i.test(message)) {
        window.location.href = '/landing-acq-mock/youre-in';
        return;
      }

      setError(message || 'Could not create your account. Please try again.');
      setLoading(false);
      return;
    }

    window.location.href = '/landing-acq-mock/youre-in';
  }

  return (
    <>
      {isDesktop && <div className="absolute -inset-6 rounded-[2.5rem] bg-[#86af99]/30 blur-3xl" />}
      <div className="relative rounded-[1.5rem] border border-[#d9d2c3] bg-[#f7f4ec] p-4 shadow-2xl shadow-[#1b4332]/12 sm:rounded-[2rem] lg:p-4">
        <div className={`${isDesktop ? 'mb-3 p-3.5 sm:rounded-[1.4rem] lg:p-4' : 'mb-4 p-4'} rounded-[1.25rem] bg-[#10291e] text-white`}>
          <h2 className="text-2xl font-black uppercase leading-none tracking-[-0.05em] sm:text-2xl">Find your next land deal.</h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
            Tell us whether you are buying, selling, sourcing, or building. We will route you toward the right buyer, seller, or land intelligence workflow.
          </p>
        </div>

        <form className={isDesktop ? 'grid gap-2' : 'grid gap-2.5'} onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="sr-only" htmlFor={`name${suffix}`}>Name</label>
            <input id={`name${suffix}`} name={`name${suffix}`} required autoComplete="name" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Name" />
            <label className="sr-only" htmlFor={`email${suffix}`}>Email</label>
            <input id={`email${suffix}`} name={`email${suffix}`} type="email" required autoComplete="email" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Email" />
          </div>
          <label className="sr-only" htmlFor={`password${suffix}`}>Password</label>
          <input id={`password${suffix}`} name={`password${suffix}`} type="password" required minLength={8} autoComplete="new-password" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Password, 8+ characters" />
          <label className="sr-only" htmlFor={`market${suffix}`}>Market or state</label>
          <input id={`market${suffix}`} name={`market${suffix}`} className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Market or state" />
          <label className="sr-only" htmlFor={`goal${suffix}`}>What side of the land deal are you on?</label>
          <select id={`goal${suffix}`} name={`goal${suffix}`} className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold text-[#52665b] outline-none ring-[#1b4332]/20 focus:ring-4 lg:py-1.5">
            <option>What side of the land deal are you on?</option>
            <option>I have land and need buyers</option>
            <option>I am buying land</option>
            <option>I need seller opportunities</option>
            <option>I want to analyze a lot</option>
            <option>I want to build a buyer or seller pipeline</option>
          </select>
          <div>
            <p className={`${isDesktop ? 'mb-1.5' : 'mb-2'} text-xs font-black uppercase tracking-[0.16em] text-[#607267]`}>I am a</p>
            <div className={`${isDesktop ? 'gap-1.5 sm:grid-cols-3' : 'gap-2'} grid grid-cols-2`}>
              {roles.map((role) => (
                <label key={role} className={`flex cursor-pointer items-center gap-2 rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-3 ${isDesktop ? 'py-1 text-xs' : 'py-1.5 text-sm'} font-black text-[#1b4332]`}>
                  <input type="radio" name={`role${suffix}`} value={role} className="accent-[#1b4332]" />
                  {role}
                </label>
              ))}
            </div>
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className={`${isDesktop ? 'py-3 text-sm' : 'py-3.5 text-base'} mt-1 rounded-2xl bg-[#1b4332] px-6 font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-[#1b4332]/20 transition hover:bg-[#143426] disabled:cursor-not-allowed disabled:opacity-60`}>
            {loading ? 'Creating account...' : 'Find my next land deal'}
          </button>
          <p className={`${isDesktop ? 'text-[11px] leading-4' : 'text-xs leading-5'} text-center font-bold text-[#7c8b82]`}>
            No credit card required to get started.
          </p>
        </form>
      </div>
    </>
  );
}

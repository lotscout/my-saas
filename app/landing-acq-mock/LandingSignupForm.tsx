'use client';

import { useState } from 'react';

type Props = {
  roles: string[];
  variant: 'desktop' | 'mobile';
};

export default function LandingSignupForm({ roles, variant }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isDesktop = variant === 'desktop';
  const suffix = isDesktop ? '' : '-mobile';

  function getFormValues(form: HTMLFormElement) {
    return {
      firstName: (form.elements.namedItem(`firstName${suffix}`) as HTMLInputElement).value.trim(),
      lastName: (form.elements.namedItem(`lastName${suffix}`) as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem(`email${suffix}`) as HTMLInputElement).value.trim(),
      market: (form.elements.namedItem(`market${suffix}`) as HTMLInputElement).value.trim(),
      userType: (form.elements.namedItem(`userType${suffix}`) as HTMLSelectElement).value.trim(),
    };
  }

  function validateRequired(values: ReturnType<typeof getFormValues>) {
    if (!values.firstName || !values.lastName || !values.email || !values.userType) {
      setError('Please enter your first name, last name, email, and user type.');
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const values = getFormValues(e.currentTarget);

    if (!validateRequired(values)) {
      setLoading(false);
      return;
    }

    const { firstName, lastName, email, market, userType } = values;

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        market,
        userType,
        signupSource: 'landing-acq-mock',
        signupMedium: 'landing_form',
        signupCampaign: 'buyer_seller_match',
      }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = String(json.error || '');
      if (res.status === 409 || json.code === 'existing_user' || /already|registered|exists/i.test(message)) {
        setNotice('You already have a LotScout account. We sent you an email with your login link.');
        setLoading(false);
        return;
      }

      setError(message || 'Could not create your account. Please try again.');
      setLoading(false);
      return;
    }

    window.location.href = '/youre-in';
  }

  function handleGoogleSignup(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form;
    if (!form) return;
    setError(null);
    setNotice(null);

    const values = getFormValues(form);
    if (!validateRequired(values)) return;

    const params = new URLSearchParams({
      next: '/edit-profile?setup=password',
      landing_source: 'landing-acq-mock',
      firstName: values.firstName,
      lastName: values.lastName,
      market: values.market,
      userType: values.userType,
    });

    window.location.href = `/api/auth/google?${params.toString()}`;
  }

  return (
    <>
      {isDesktop && <div className="absolute -inset-6 rounded-[2.5rem] bg-[#86af99]/30 blur-3xl" />}
      <div className="relative rounded-[1.5rem] border border-[#d9d2c3] bg-[#f7f4ec] p-4 shadow-2xl shadow-[#1b4332]/12 sm:rounded-[2rem] lg:p-4">
        <div className={`${isDesktop ? 'mb-3 p-3.5 sm:rounded-[1.4rem] lg:p-4' : 'mb-4 p-4'} rounded-[1.25rem] bg-[#10291e] text-white`}>
          <h2 className="text-2xl font-black uppercase leading-none tracking-[-0.05em] sm:text-2xl">Find your next land deal.</h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
            Tell us who you are and where you are looking. We will route you toward the right buyer, seller, or land intelligence workflow.
          </p>
        </div>

        <form className={isDesktop ? 'grid gap-2' : 'grid gap-2.5'} onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="sr-only" htmlFor={`firstName${suffix}`}>First name</label>
            <input id={`firstName${suffix}`} name={`firstName${suffix}`} required autoComplete="given-name" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="First name *" />
            <label className="sr-only" htmlFor={`lastName${suffix}`}>Last name</label>
            <input id={`lastName${suffix}`} name={`lastName${suffix}`} required autoComplete="family-name" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Last name *" />
          </div>
          <label className="sr-only" htmlFor={`email${suffix}`}>Email</label>
          <input id={`email${suffix}`} name={`email${suffix}`} type="email" required autoComplete="email" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Email *" />
          <label className="sr-only" htmlFor={`userType${suffix}`}>User type</label>
          <select id={`userType${suffix}`} name={`userType${suffix}`} required defaultValue="" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold text-[#52665b] outline-none ring-[#1b4332]/20 focus:ring-4 lg:py-1.5">
            <option value="" disabled>User type *</option>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <label className="sr-only" htmlFor={`market${suffix}`}>State or market</label>
          <input id={`market${suffix}`} name={`market${suffix}`} className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="State or market" />
          {notice && <p className="rounded-xl bg-[#e8efe6] px-3 py-2 text-xs font-bold leading-5 text-[#1b4332]">{notice}</p>}
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className={`${isDesktop ? 'py-3 text-sm' : 'py-3.5 text-base'} mt-1 rounded-2xl bg-[#1b4332] px-6 font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-[#1b4332]/20 transition hover:bg-[#143426] disabled:cursor-not-allowed disabled:opacity-60`}>
            {loading ? 'Sending email...' : 'Find my next land deal'}
          </button>
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-[#d9d2c3]" />
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7c8b82]">or</span>
            <div className="h-px flex-1 bg-[#d9d2c3]" />
          </div>
          <button type="button" onClick={handleGoogleSignup} disabled={loading} className={`${isDesktop ? 'py-2.5 text-xs' : 'py-3 text-sm'} rounded-2xl border border-[#d8dece] bg-white px-6 font-black uppercase tracking-[0.08em] text-[#1b4332] transition hover:bg-[#e8efe6] disabled:cursor-not-allowed disabled:opacity-60`}>
            Continue with Google
          </button>
          <p className={`${isDesktop ? 'text-[11px] leading-4' : 'text-xs leading-5'} text-center font-bold text-[#7c8b82]`}>
            No credit card required to get started.
          </p>
        </form>
      </div>
    </>
  );
}

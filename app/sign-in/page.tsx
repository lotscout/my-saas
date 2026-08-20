'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { track } from '@vercel/analytics';

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/marketplace');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    const safeRedirect =
      redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
        ? redirectParam
        : '/marketplace';
    setRedirectPath(safeRedirect);

    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    if (utmSource || utmMedium || utmCampaign) {
      if (utmSource) localStorage.setItem('utm_source', utmSource);
      if (utmMedium) localStorage.setItem('utm_medium', utmMedium);
      if (utmCampaign) localStorage.setItem('utm_campaign', utmCampaign);
      track('email_cta_landing', {
        source: utmSource || 'unknown',
        medium: utmMedium || 'unknown',
        campaign: utmCampaign || 'unknown',
        path: window.location.pathname,
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      const authError = signInError as { status?: number; code?: string; message?: string };
      const isInvalidCredentials =
        authError.status === 400 ||
        authError.code === 'invalid_credentials' ||
        authError.message?.toLowerCase().includes('invalid login credentials');

      setError(
        isInvalidCredentials
          ? 'Invalid email or password.'
          : 'Login service is temporarily unavailable. Please try again in a few minutes.'
      );
      setLoading(false);
      return;
    }

    // Set cookie persistence and UA fingerprint server-side
    await fetch('/api/auth/post-signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rememberMe }),
    });

    // Return the user to the page they were trying to reach (set by the proxy).
    // Only allow internal paths to avoid open-redirect abuse.
    const redirectParam = new URLSearchParams(window.location.search).get('redirect');
    const safeRedirect =
      redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
        ? redirectParam
        : null;

    if (safeRedirect) {
      track('login_completed', {
        destination: safeRedirect,
        source: localStorage.getItem('utm_source') || 'direct',
        medium: localStorage.getItem('utm_medium') || '',
        campaign: localStorage.getItem('utm_campaign') || '',
      });
      window.location.replace(safeRedirect);
      return;
    }

    const { data: { user: signedInUser } } = await supabase.auth.getUser();
    if (signedInUser) {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', signedInUser.id).single();
      if (profile?.is_admin) {
        track('login_completed', { destination: '/admin/dashboard' });
        window.location.replace('/admin/dashboard');
        return;
      }
    }
    track('login_completed', {
      destination: '/marketplace',
      source: localStorage.getItem('utm_source') || 'direct',
      medium: localStorage.getItem('utm_medium') || '',
      campaign: localStorage.getItem('utm_campaign') || '',
    });
    window.location.replace('/marketplace');
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setForgotLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setForgotLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center px-4 py-16 font-body">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/home" className="font-headline text-2xl font-extrabold text-primary tracking-tight">LotScout</Link>
          <p className="text-secondary text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-surface-container-high p-8">
          <h1 className="font-headline text-2xl font-bold text-primary mb-6">Sign In</h1>

          {/* Google Sign In */}
          <a
            href={`/api/auth/google?next=${encodeURIComponent(redirectPath)}`}
            className="w-full flex items-center justify-center gap-3 border border-surface-container-high bg-white text-on-surface py-3 rounded-xl font-semibold text-sm hover:bg-surface-container-low transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-surface-container-high" />
            <span className="text-xs text-on-surface-variant font-medium">or</span>
            <div className="flex-1 h-px bg-surface-container-high" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="jane@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-on-surface">Password</label>
                <button type="button" onClick={() => { setResetSent(false); setError(null); const el = document.getElementById('forgot-section'); el?.classList.toggle('hidden'); }} className="text-xs font-semibold text-primary hover:underline">Forgot Password?</button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-surface-container-high bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-surface-container-high text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-on-surface-variant font-medium">Remember me</span>
            </label>

            {error && (
              <p className="text-sm text-error font-medium bg-error-container/20 px-4 py-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1D9E75] text-white py-3.5 rounded-xl font-bold text-base hover:bg-[#14795A] transition-colors shadow-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Forgot password section */}
          <div id="forgot-section" className="hidden mt-4 pt-4 border-t border-surface-container-high">
            {resetSent ? (
              <p className="text-sm text-center text-secondary">Check your email for a password reset link.</p>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-sm font-semibold text-on-surface">Reset your password</p>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#1D9E75] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#14795A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-secondary mt-6">
          Don&apos;t have an account?{' '}
          <Link href={`/sign-up${redirectPath !== '/marketplace' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`} className="text-primary font-semibold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function safeInternalPath(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/marketplace';
}

export async function GET(request: NextRequest) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    request.nextUrl.origin;

  const next = safeInternalPath(request.nextUrl.searchParams.get('next'));
  const callbackUrl = new URL('/auth/callback', siteUrl);
  callbackUrl.searchParams.set('next', next);

  // Use the SSR client here so Supabase starts a PKCE OAuth flow and stores
  // the code verifier in an HTTP-only cookie. A plain @supabase/supabase-js
  // server client defaults to implicit OAuth, which redirects back with tokens
  // in the URL hash; route handlers cannot read hashes, so /auth/callback saw
  // no `code` and bounced users back to sign-in.
  const pendingCookies: Array<{ name: string; value: string; options: Parameters<ReturnType<typeof NextResponse.redirect>['cookies']['set']>[2] }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error || !data.url) {
    console.error('[auth/google] Failed to start Google OAuth:', error?.message ?? 'missing OAuth URL');
    return NextResponse.redirect(`${siteUrl}/sign-in?error=google_oauth_failed`);
  }

  const response = NextResponse.redirect(data.url);
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

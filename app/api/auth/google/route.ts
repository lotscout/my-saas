import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
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

  return NextResponse.redirect(data.url);
}

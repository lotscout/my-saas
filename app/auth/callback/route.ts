import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Prefer the configured site URL so redirects always land on the canonical domain
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  // Something went wrong — redirect to sign-in with an error indicator
  return NextResponse.redirect(`${siteUrl}/sign-in?error=auth_callback_failed`);
}

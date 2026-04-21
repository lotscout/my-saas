import { type NextRequest, NextResponse } from 'next/server'

// @supabase/ssr createBrowserClient already persists sessions in cookies with
// a 1-year maxAge by default. Rewriting sb-* cookies manually can corrupt the
// chunked token format and cause getUser() to return null in the proxy.
// This endpoint is kept for compatibility but no longer rewrites auth cookies.
export async function POST(_request: NextRequest) {
  return NextResponse.json({ ok: true })
}

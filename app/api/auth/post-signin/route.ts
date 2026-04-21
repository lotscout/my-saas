import { type NextRequest, NextResponse } from 'next/server'

const IS_PROD = process.env.NODE_ENV === 'production'

export async function POST(request: NextRequest) {
  const { rememberMe } = await request.json()
  const response = NextResponse.json({ ok: true })

  // Re-set all Supabase auth cookies with the correct persistence.
  // The browser client already wrote them; we read them back here and
  // rewrite with or without maxAge so the browser respects the choice.
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      const base = {
        name: cookie.name,
        value: cookie.value,
        httpOnly: false, // browser client must be able to read these
        secure: IS_PROD,
        sameSite: 'lax' as const,
        path: '/',
      }
      response.cookies.set(rememberMe ? { ...base, maxAge: 60 * 60 * 24 * 365 } : base)
    }
  }

  // httpOnly UA fingerprint cookie — only middleware reads this, never JS.
  const ua = request.headers.get('user-agent') ?? ''
  const uaBase = {
    name: '_ls_ua',
    value: ua,
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
  }
  response.cookies.set(rememberMe ? { ...uaBase, maxAge: 60 * 60 * 24 * 365 } : uaBase)

  return response
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Default-deny: every page route requires a session EXCEPT these public ones.
// (API routes authenticate themselves and are bypassed below.)
const PUBLIC_ROUTES = [
  '/',
  '/home',
  '/login',
  '/sign-in',
  '/signup',
  '/sign-up',
  '/reset-password',
  '/advisor',         // public AI Land Investment Advisor (logged-out allowed)
  '/scout',           // public Scout Search preview (logged-out allowed)
  '/auth',            // OAuth / email-confirm callbacks
  '/pricing',
  '/market-reports',
  '/market-report',
  '/success',         // post-checkout redirect
  '/terms',
  '/privacy',
]

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // API routes return JSON and enforce their own auth — never redirect them.
  // Keep them out of proxy auth work so public endpoints stay fast.
  if (path.startsWith('/api')) return NextResponse.next({ request })

  // Public pages are always allowed. Do not call Supabase here; marketing/auth
  // pages must not depend on an auth roundtrip just to render.
  if (isPublic(path)) return NextResponse.next({ request })

  // The user dashboard was removed — send any hit to the marketplace.
  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/marketplace'
    url.search = ''
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Forward cookie mutations to both the request and response
          // so the session stays refreshed across the chain.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT server-side — never trust only the cookie value.
  const { data: { user } } = await supabase.auth.getUser()

  // Internal page with no session → send to sign-in, remembering where they wanted to go.
  if (!user) {
    const signIn = request.nextUrl.clone()
    signIn.pathname = '/sign-in'
    signIn.search = ''
    signIn.searchParams.set('redirect', path)
    return NextResponse.redirect(signIn)
  }

  // Admin area requires the admin flag (this app uses profiles.is_admin).
  if (path === '/admin' || path.startsWith('/admin/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) {
      const dashboard = request.nextUrl.clone()
      dashboard.pathname = '/dashboard'
      dashboard.search = ''
      return NextResponse.redirect(dashboard)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

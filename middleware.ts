import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = [
  '/dashboard',
  '/create-listing',
  '/marketplace',
  '/buyer-directory',
  '/messaging',
  '/profile',
  '/edit-profile',
]

function isProtected(pathname: string) {
  return PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
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

  if (isProtected(request.nextUrl.pathname)) {
    if (!user) {
      const signIn = request.nextUrl.clone()
      signIn.pathname = '/sign-in'
      return NextResponse.redirect(signIn)
    }

    // UA fingerprint check: if the stored UA doesn't match the current
    // request's UA, the session is being used from a different device/browser.
    const storedUA = request.cookies.get('_ls_ua')?.value
    const currentUA = request.headers.get('user-agent') ?? ''
    if (storedUA && storedUA !== currentUA) {
      await supabase.auth.signOut()
      const signIn = request.nextUrl.clone()
      signIn.pathname = '/sign-in'
      const res = NextResponse.redirect(signIn)
      // Clear the stale fingerprint cookie
      res.cookies.delete('_ls_ua')
      return res
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

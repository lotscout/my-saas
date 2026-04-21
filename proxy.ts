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
  '/property-analysis',
  '/deal-analysis',
  '/admin',
]

function isProtected(pathname: string) {
  return PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function proxy(request: NextRequest) {
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
  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('[proxy] path:', request.nextUrl.pathname)
  console.log('[proxy] user:', user?.id ?? 'null')
  console.log('[proxy] getUser error:', error?.message ?? 'none')
  console.log('[proxy] cookies:', request.cookies.getAll().map(c => c.name).join(', '))

  if (isProtected(request.nextUrl.pathname) && !user) {
    console.log('[proxy] REDIRECTING to /sign-in — no user on protected route')
    const signIn = request.nextUrl.clone()
    signIn.pathname = '/sign-in'
    return NextResponse.redirect(signIn)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

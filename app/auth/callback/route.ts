import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  // Password reset links carry type=recovery — send to the reset form, not the dashboard.
  // All other flows (email confirmation, OAuth) default to /dashboard or the next param.
  const next = type === 'recovery'
    ? '/reset-password'
    : (searchParams.get('next') ?? '/dashboard')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin

  if (code) {
    // Collect cookies during session exchange, then build the redirect response
    // after determining the correct destination (admin vs regular user).
    const pendingCookies: Array<{ name: string; value: string; options: Parameters<ReturnType<typeof NextResponse.redirect>['cookies']['set']>[2] }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.push({ name, value, options })
            })
          },
        },
      }
    )

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${siteUrl}/sign-in?error=auth_callback_failed`)
    }

    // For password resets, the session is now established — just redirect to the form.
    // Skip the profile upsert; the user already exists and this isn't an OAuth sign-in.
    if (type === 'recovery') {
      const response = NextResponse.redirect(`${siteUrl}${next}`)
      pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      return response
    }

    // Ensure a profile row exists and is populated with OAuth metadata.
    // The handle_new_user trigger fires on INSERT into auth.users (new accounts only).
    // This upsert acts as a safety net for both new and returning OAuth users,
    // filling in name + avatar from Google metadata only when those fields are null.
    const user = sessionData.user
    let destination = next

    if (user) {
      try {
        const meta = (user.user_metadata ?? {}) as Record<string, string>

        // Google provides: full_name, name, picture, avatar_url
        const fullName  = (meta.full_name ?? meta.name ?? '').trim()
        const firstName = (meta.first_name ?? (fullName ? fullName.split(' ')[0] : '')).trim() || null
        const lastName  = (meta.last_name  ?? (fullName && fullName.includes(' ') ? fullName.slice(fullName.indexOf(' ') + 1) : '')).trim() || null
        const avatarUrl = meta.avatar_url ?? meta.picture ?? null

        const service = createServiceClient()

        // Step 1: insert profile if it doesn't exist yet (safety net if trigger hasn't fired)
        await service.from('profiles').upsert(
          {
            id: user.id,
            email: user.email ?? '',
            role: 'buyer',
            is_verified: false,
            is_active: true,
            onboarding_completed: false,
            notification_preferences: { email: true, sms: false, push: true },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )

        // Step 2: fill in name + avatar only when first_name is not yet set.
        // This populates Google users on first sign-in without overwriting
        // profile data that the user may have edited themselves.
        if (firstName || lastName || avatarUrl) {
          await service
            .from('profiles')
            .update({
              first_name: firstName,
              last_name:  lastName,
              full_name:  fullName || null,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .is('first_name', null)
        }

        // Step 3: redirect admins to their dashboard instead of the regular one.
        const { data: profile } = await service.from('profiles').select('is_admin').eq('id', user.id).single()
        if (profile?.is_admin) {
          destination = '/admin/dashboard'
        }
      } catch (profileErr) {
        // Non-fatal: log but don't block the redirect
        console.error('[auth/callback] profile upsert error:', profileErr)
      }
    }

    const response = NextResponse.redirect(`${siteUrl}${destination}`)
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    return response
  }

  return NextResponse.redirect(`${siteUrl}/sign-in?error=auth_callback_failed`)
}

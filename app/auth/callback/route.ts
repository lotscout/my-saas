import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { syncResendContact } from '@/lib/resend-contacts'
import { blockInstantlyColdProspect } from '@/lib/instantly'
import { sendWelcomeEmailOnce } from '@/lib/welcome-email'
import { sendAdminAlert } from '@/lib/admin-alerts'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  // Password reset links carry type=recovery — send to the reset form, not the marketplace.
  // All other flows (email confirmation, OAuth) default to /marketplace or the next param.
  const next = type === 'recovery'
    ? '/reset-password'
    : (searchParams.get('next') ?? searchParams.get('redirect') ?? '/marketplace')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin
  const landingSource = searchParams.get('landing_source')?.trim() || ''
  const landingFirstName = searchParams.get('firstName')?.trim() || ''
  const landingLastName = searchParams.get('lastName')?.trim() || ''
  const landingMarket = searchParams.get('market')?.trim() || ''
  const landingUserType = searchParams.get('userType')?.trim() || ''

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
        const firstName = (landingFirstName || meta.first_name || (fullName ? fullName.split(' ')[0] : '')).trim() || null
        const lastName  = (landingLastName || meta.last_name || (fullName && fullName.includes(' ') ? fullName.slice(fullName.indexOf(' ') + 1) : '')).trim() || null
        const avatarUrl = meta.avatar_url ?? meta.picture ?? null

        const service = createServiceClient()

        // Step 1: insert profile if it doesn't exist yet (safety net if trigger hasn't fired)
        await service.from('profiles').upsert(
          {
            id: user.id,
            email: user.email ?? '',
            role: landingUserType ? landingUserType.toLowerCase() : 'buyer',
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
        if (firstName || lastName || avatarUrl || landingMarket || landingUserType) {
          const profileUpdate: Record<string, string | null> = {
            first_name: firstName,
            last_name: lastName,
            full_name: [firstName, lastName].filter(Boolean).join(' ').trim() || fullName || null,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          }
          if (landingMarket) profileUpdate.state = landingMarket
          if (landingUserType) profileUpdate.role = landingUserType.toLowerCase()

          const updateQuery = service
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user.id)

          if (landingSource) {
            await updateQuery
          } else {
            await updateQuery.is('first_name', null)
          }
        }

        if (landingSource && user.id) {
          try {
            await service.auth.admin.updateUserById(user.id, {
              user_metadata: {
                ...user.user_metadata,
                requires_password_setup: true,
                landing_source: landingSource,
              },
            })
          } catch (metadataErr) {
            console.error('[auth/callback] password setup metadata error:', metadataErr)
          }
        }

        // Step 3: fetch profile for routing + welcome email decisions
        const { data: profile } = await service
          .from('profiles')
          .select('is_admin, is_test_profile, first_name')
          .eq('id', user.id)
          .single()

        if (profile?.is_admin) {
          destination = '/admin/dashboard'
        }

        if (user.email) {
          try {
            await syncResendContact({
              email: user.email,
              firstName: firstName ?? profile?.first_name ?? null,
              lastName,
              audience: 'signed_up',
              properties: { lifecycle_stage: 'free' },
            })
          } catch (contactErr) {
            console.error('[auth/callback] Resend contact sync error:', contactErr)
          }

          try {
            const instantlyResult = await blockInstantlyColdProspect(user.email)
            if (!instantlyResult.ok) console.error('[auth/callback] Instantly blocklist error:', instantlyResult)
          } catch (instantlyErr) {
            console.error('[auth/callback] Instantly suppression error:', instantlyErr)
          }
        }

        // Step 4: send welcome email to new users
        // Triggers on email signup confirmation (type=signup) or new OAuth accounts (< 2 hours old).
        const isEmailSignup = type === 'signup'
        const accountAgeMs = Date.now() - new Date(user.created_at).getTime()
        const isNewOAuthUser = !type && accountAgeMs < 2 * 60 * 60 * 1000

        if ((isEmailSignup || isNewOAuthUser) && !profile?.is_admin && !profile?.is_test_profile && user.email) {
          // Idempotency check — only send once per user
          const { data: existingWelcome } = await service
            .from('email_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('email_type', 'welcome')
            .limit(1)
            .maybeSingle()

          if (!existingWelcome) {
            try {
              const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? siteUrl
              await sendWelcomeEmailOnce({
                userId: user.id,
                email: user.email,
                firstName: profile?.first_name ?? firstName ?? null,
                baseUrl,
              })
              console.log('[auth/callback] welcome email sent to', user.email)
            } catch (welcomeErr) {
              console.error('[auth/callback] welcome email error:', welcomeErr)
            }
          }

          const { data: existingAdminSignupAlert } = await service
            .from('email_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('email_type', 'admin_new_signup')
            .limit(1)
            .maybeSingle()

          if (!existingAdminSignupAlert) {
            await sendAdminAlert({
              subject: 'New LotScout signup',
              title: 'New user signed up',
              rows: [
                ['Name', fullName || [firstName, lastName].filter(Boolean).join(' ').trim() || 'Not provided'],
                ['Email', user.email],
                ['Source', landingSource || (isNewOAuthUser ? 'google_oauth' : 'email_confirmation')],
                ['User type', landingUserType],
                ['Market', landingMarket],
              ],
              ctaHref: '/admin/dashboard/data-center',
              ctaLabel: 'View Data Center',
              emailType: 'admin_new_signup',
              userId: user.id,
            })
          }
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

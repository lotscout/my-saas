import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { logEmail } from '@/lib/email-logger'
import { syncResendContact } from '@/lib/resend-contacts'
import { blockInstantlyColdProspect } from '@/lib/instantly'

function buildWelcomeEmail(firstName: string | null, baseUrl: string): string {
  const greeting = firstName ? `Welcome to LotScout, ${firstName}!` : 'Welcome to LotScout!'
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr>
          <td style="background:#1B4332;border-radius:12px 12px 0 0;padding:28px 40px">
            <p style="margin:0;font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px">LotScout</p>
          </td>
        </tr>
        <tr>
          <td style="background:white;padding:40px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1B4332">${greeting}</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.6">
              The off-market land marketplace built for serious buyers and sellers.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;width:100%">
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Browse off-market listings</p>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Connect with active buyers</p>
              </td></tr>
              <tr><td style="padding:10px 0">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Request property analysis reports</p>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0">
              <tr><td>
                <a href="${baseUrl}/marketplace"
                   style="display:inline-block;background:#1B4332;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px">
                  Explore the Marketplace &rarr;
                </a>
              </td></tr>
            </table>
            <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
              &copy; 2026 LotScout. All rights reserved.<br>
              You received this because you created an account at lotscout.com.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

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
              const resend = new Resend(process.env.RESEND_API_KEY)
              const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? siteUrl
              await resend.emails.send({
                from: 'support@lotscout.com',
                to: user.email,
                subject: 'Welcome to LotScout',
                html: buildWelcomeEmail(profile?.first_name ?? firstName ?? null, baseUrl),
              })
              await logEmail({
                user_id: user.id,
                to_email: user.email,
                from_email: 'support@lotscout.com',
                subject: 'Welcome to LotScout',
                email_type: 'welcome',
              })
              console.log('[auth/callback] welcome email sent to', user.email)
            } catch (welcomeErr) {
              console.error('[auth/callback] welcome email error:', welcomeErr)
            }
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

import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findProfaneField, profanityError } from '@/lib/profanity-validation';
import { syncResendContact } from '@/lib/resend-contacts';
import { sendAdminAlert } from '@/lib/admin-alerts';
import { sendAccountLoginEmail } from '@/lib/account-login-email';
import { sendWelcomeEmailOnce } from '@/lib/welcome-email';

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const firstName = cleanString(body.firstName);
    const lastName = cleanString(body.lastName);
    const email = cleanString(body.email).toLowerCase();
    const providedPassword = typeof body.password === 'string' ? body.password : '';
    const signupSource = cleanString(body.signupSource) || 'direct';
    const signupMedium = cleanString(body.signupMedium);
    const signupCampaign = cleanString(body.signupCampaign);
    const market = cleanString(body.market);
    const role = cleanString(body.userType) || cleanString(body.role);
    const dealGoal = cleanString(body.dealGoal) || (role ? `I am a ${role}` : '');
    const isPasswordlessLanding = signupSource === 'landing-acq-mock' || signupMedium === 'landing_form';
    const password = providedPassword || (isPasswordlessLanding ? `${randomBytes(24).toString('base64url')}aA1!` : '');

    if (!firstName || !lastName || !email || !password || (isPasswordlessLanding && !role)) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!isPasswordlessLanding && password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const profaneField = findProfaneField([
      { label: 'first name', value: firstName },
      { label: 'last name', value: lastName },
    ]);
    if (profaneField) {
      return NextResponse.json({ error: profanityError(profaneField) }, { status: 400 });
    }

    const supabase = adminSupabase();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const fallbackLoginUrl = `${baseUrl}/sign-in?redirect=${encodeURIComponent('/marketplace')}`;

    async function createMagicLoginUrl() {
      if (!isPasswordlessLanding) return fallbackLoginUrl;

      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${baseUrl}/auth/callback?next=/marketplace` },
      });

      if (error) {
        console.error('Signup magic link generation error:', error);
        return fallbackLoginUrl;
      }

      return data.properties?.action_link || fallbackLoginUrl;
    }

    // Supabase Auth confirmation email delivery is currently unreliable for this project.
    // Create the account confirmed so users can sign in immediately after signup.
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        market,
        deal_goal: dealGoal,
        role,
        signup_source: signupSource,
      },
    });

    if (createError || !created.user) {
      const message = createError?.message || 'Could not create account.';
      const isExistingUser = /already|registered|exists/i.test(message);

      if (isExistingUser) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, first_name')
          .eq('email', email)
          .maybeSingle();

        try {
          await sendAccountLoginEmail({
            userId: existingProfile?.id ?? null,
            email,
            firstName: existingProfile?.first_name ?? firstName,
            baseUrl,
            loginUrl: await createMagicLoginUrl(),
          });
        } catch (loginEmailErr) {
          console.error('Existing account login email error:', loginEmailErr);
        }

        return NextResponse.json({
          error: 'You already have a LotScout account. We sent you an email with a login link.',
          code: 'existing_user',
        }, { status: 409 });
      }

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const userId = created.user.id;
    const payload = {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: [firstName, lastName].filter(Boolean).join(' ').trim(),
      signup_source: signupSource,
      signup_medium: signupMedium,
      signup_campaign: signupCampaign,
      updated_at: new Date().toISOString(),
    };

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('id', userId)
      .maybeSingle();

    const { error: profileError } = await supabase.from('profiles').upsert(payload);
    if (profileError) {
      console.error('Signup profile upsert error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    try {
      await syncResendContact({ email, firstName, lastName });
    } catch (resendErr) {
      console.error('Signup Resend contact sync error:', resendErr);
    }

    try {
      if (isPasswordlessLanding) {
        await sendAccountLoginEmail({
          userId,
          email,
          firstName,
          baseUrl,
          loginUrl: await createMagicLoginUrl(),
        });
      } else {
        await sendWelcomeEmailOnce({
          userId,
          email,
          firstName,
          baseUrl,
        });
      }
    } catch (welcomeErr) {
      console.error('Signup welcome email error:', welcomeErr);
    }

    if (!existingProfile) {
      await sendAdminAlert({
        subject: 'New LotScout signup',
        title: 'New user signed up',
        rows: [
          ['Name', [firstName, lastName].filter(Boolean).join(' ').trim() || 'Not provided'],
          ['Email', email],
          ['Source', signupSource || 'direct'],
          ['Campaign', signupCampaign],
          ['Market', market],
          ['Deal goal', dealGoal],
          ['Role', role],
        ],
        ctaHref: '/admin/dashboard/data-center',
        ctaLabel: 'View Data Center',
        emailType: 'admin_new_signup',
        userId,
      });
    }

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    console.error('Signup API error:', err);
    return NextResponse.json({ error: 'Signup service is temporarily unavailable.' }, { status: 500 });
  }
}

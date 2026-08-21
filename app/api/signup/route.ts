import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findProfaneField, profanityError } from '@/lib/profanity-validation';
import { syncResendContact } from '@/lib/resend-contacts';
import { sendAdminAlert } from '@/lib/admin-alerts';

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
    const password = typeof body.password === 'string' ? body.password : '';
    const signupSource = cleanString(body.signupSource) || 'direct';
    const signupMedium = cleanString(body.signupMedium);
    const signupCampaign = cleanString(body.signupCampaign);

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
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

    // Supabase Auth confirmation email delivery is currently unreliable for this project.
    // Create the account confirmed so users can sign in immediately after signup.
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (createError || !created.user) {
      const message = createError?.message || 'Could not create account.';
      const status = /already|registered|exists/i.test(message) ? 409 : 500;
      return NextResponse.json({ error: message }, { status });
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

    if (!existingProfile) {
      await sendAdminAlert({
        subject: 'New LotScout signup',
        title: 'New user signed up',
        rows: [
          ['Name', [firstName, lastName].filter(Boolean).join(' ').trim() || 'Not provided'],
          ['Email', email],
          ['Source', signupSource || 'direct'],
          ['Campaign', signupCampaign],
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

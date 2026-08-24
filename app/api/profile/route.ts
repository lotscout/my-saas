import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { findProfaneField, profanityError } from '@/lib/profanity-validation';
import { syncResendContact } from '@/lib/resend-contacts';
import { sendAdminAlert } from '@/lib/admin-alerts';

export async function POST(request: NextRequest) {
  const {
    firstName,
    lastName,
    phone,
    bio,
    companyName,
    state,
    county,
    contactVisible,
    signupSource,
    signupMedium,
    signupCampaign,
  } = await request.json();

  const serverClient = await createServerClient();
  const { data: { user }, error: authError } = await serverClient.auth.getUser();
  if (authError || !user?.id || !user.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userId = user.id;
  const email = user.email;

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const profaneField = findProfaneField([
    { label: 'first name', value: firstName },
    { label: 'last name', value: lastName },
    { label: 'phone', value: phone },
    { label: 'bio', value: bio },
    { label: 'company name', value: companyName },
    { label: 'state', value: state },
    { label: 'county', value: county },
  ]);
  if (profaneField) {
    return NextResponse.json({ error: profanityError(profaneField) }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    id: userId,
    email,
    first_name: typeof firstName === 'string' ? firstName.trim() || null : null,
    last_name: typeof lastName === 'string' ? lastName.trim() || null : null,
    full_name: [firstName, lastName].filter(Boolean).join(' ').trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (signupSource !== undefined) payload.signup_source = signupSource || 'direct';
  if (signupMedium !== undefined) payload.signup_medium = signupMedium || '';
  if (signupCampaign !== undefined) payload.signup_campaign = signupCampaign || '';

  if (phone !== undefined) payload.phone = typeof phone === 'string' ? phone.trim() || null : null;
  if (bio !== undefined) payload.bio = typeof bio === 'string' ? bio.trim() || null : null;
  if (companyName !== undefined) payload.company_name = typeof companyName === 'string' ? companyName.trim() || null : null;
  if (state !== undefined) payload.state = typeof state === 'string' ? state.trim() || null : null;
  if (county !== undefined) payload.county = typeof county === 'string' ? county.trim() || null : null;
  if (contactVisible !== undefined) payload.contact_visible = contactVisible === true;

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, created_at')
    .eq('id', userId)
    .maybeSingle();

  const { error } = await supabase.from('profiles').upsert(payload);

  if (error) {
    console.error('Profile upsert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await syncResendContact({ email, firstName, lastName });
  } catch (resendErr) {
    console.error('Resend contact sync error:', resendErr);
  }

  if (!existingProfile) {
    await sendAdminAlert({
      subject: 'New LotScout signup',
      title: 'New user signed up',
      rows: [
        ['Name', [firstName, lastName].filter(Boolean).join(' ').trim() || 'Not provided'],
        ['Email', email],
        ['Company', companyName],
        ['Location', [county, state].filter(Boolean).join(', ')],
        ['Source', signupSource || 'direct'],
        ['Campaign', signupCampaign],
      ],
      ctaHref: '/admin/dashboard/data-center',
      ctaLabel: 'View Data Center',
      emailType: 'admin_new_signup',
      userId,
    });
  }

  return NextResponse.json({ ok: true, contactVisible: payload.contact_visible ?? null });
}

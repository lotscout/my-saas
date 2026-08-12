import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findProfaneField, profanityError } from '@/lib/profanity-validation';

export async function POST(request: NextRequest) {
  const {
    userId,
    firstName,
    lastName,
    email,
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

  if (!userId || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the user exists in auth.users and that the email in the request
  // matches their actual auth email. This prevents anyone from writing an
  // arbitrary email into another user's profile row.
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.email !== email) {
    return NextResponse.json({ error: 'Email does not match authenticated user' }, { status: 403 });
  }

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

  let { error } = await supabase.from('profiles').upsert(payload);

  if (error && /contact_visible/i.test(error.message)) {
    delete payload.contact_visible;
    ({ error } = await supabase.from('profiles').upsert(payload));
  }

  if (error) {
    console.error('Profile upsert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

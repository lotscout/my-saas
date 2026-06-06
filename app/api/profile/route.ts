import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { userId, firstName, lastName, email, signupSource, signupMedium, signupCampaign } = await request.json();

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

  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    first_name: firstName ?? null,
    last_name: lastName ?? null,
    full_name: [firstName, lastName].filter(Boolean).join(' ') || null,
    signup_source: signupSource ?? 'direct',
    signup_medium: signupMedium ?? '',
    signup_campaign: signupCampaign ?? '',
  });

  if (error) {
    console.error('Profile upsert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

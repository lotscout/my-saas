import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { userId, firstName, lastName, email } = await request.json();

  if (!userId || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the user actually exists in auth before writing
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    first_name: firstName ?? null,
    last_name: lastName ?? null,
    full_name: [firstName, lastName].filter(Boolean).join(' ') || null,
  });

  if (error) {
    console.error('Profile upsert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

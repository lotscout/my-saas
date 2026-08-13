import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { syncResendContact } from '@/lib/resend-contacts';

export const dynamic = 'force-dynamic';

function isValidEmail(email: string) {
  const [localPart, domain] = email.split('@');
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && Boolean(localPart)
    && Boolean(domain)
    && !localPart.startsWith('.')
    && !localPart.endsWith('.')
    && !localPart.includes('..')
    && !domain.startsWith('.')
    && !domain.endsWith('.')
    && !domain.includes('..');
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const guestQuestions = Math.max(0, Math.min(Number(body.guestQuestions ?? 3) || 3, 50));

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from('scout_leads')
    .upsert({
      email,
      source: 'scout_limit',
      guest_questions: guestQuestions,
      status: 'captured',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

  if (error) {
    console.error('[scout/leads] upsert error:', error);
    return NextResponse.json({ error: 'Could not save email. Please try again.' }, { status: 500 });
  }

  try {
    await syncResendContact({ email });
  } catch (resendErr) {
    console.error('[scout/leads] Resend sync error:', resendErr);
  }

  return NextResponse.json({ ok: true, redirect: `/sign-up?email=${encodeURIComponent(email)}&source=scout` });
}

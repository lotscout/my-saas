import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateMarketUpdate } from '@/lib/market-update-generator';

export const maxDuration = 300;

async function handle(request: NextRequest) {
  // Secret check to prevent public abuse. When CRON_SECRET is set, require it via the
  // x-cron-secret header (or Vercel Cron's Authorization: Bearer <secret>). When it is
  // unset, allow the call (server-side / manual first-run use).
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const headerSecret = request.headers.get('x-cron-secret');
    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (headerSecret !== secret && bearer !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const update = await generateMarketUpdate(new Date());

    const supabase = createServiceClient();
    const { error } = await supabase.from('market_updates').insert({
      month: update.month,
      year: update.year,
      title: update.title,
      preview: update.preview,
      full_content: update.full_content,
    });
    if (error) throw error;

    return NextResponse.json({ success: true, title: update.title });
  } catch (err) {
    console.error('[market-updates/generate] error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Vercel Cron issues GET requests; also accept POST for manual triggering.
export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

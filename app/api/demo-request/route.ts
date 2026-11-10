import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Please submit the form from LotScout.' }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 12000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  if (body.website) return NextResponse.json({ error: 'Could not submit this request.' }, { status: 400 });
  // Accept the streamlined form and preserve compatibility with older clients.
  const compact = typeof body.name === 'string';
  const fields = compact ? ['name', 'email', 'company'] : ['firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle', 'industry', 'market', 'interest'];
  const required = compact ? ['name', 'email'] : fields;
  if (required.some(field => typeof body[field] !== 'string' || !(body[field] as string).trim()) || fields.some(field => body[field] != null && (typeof body[field] !== 'string' || (body[field] as string).length > 200))) return NextResponse.json({ error: 'Please complete your name and email.' }, { status: 400 });
  const email = (body.email as string).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.consent !== 'on' || typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.requestId) || (body.message != null && (typeof body.message !== 'string' || body.message.length > 2000))) return NextResponse.json({ error: 'Check your email and contact consent.' }, { status: 400 });
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.reset < now) attempts.delete(key);
  const identity = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const entry = attempts.get(identity) || { count: 0, reset: now + 600000 };
  if (entry.count >= 5 || attempts.size >= 10000) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  entry.count += 1;
  attempts.set(identity, entry);
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Contact form is temporarily unavailable. Please email hello@lotscout.com.' }, { status: 503 });
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'LotScout <hello@lotscout.com>',
      to: 'support@lotscout.com',
      replyTo: email,
      subject: 'New LotScout Demo Request',
      text: fields.map(field => `${field}: ${typeof body[field] === 'string' ? (body[field] as string).trim() || '(not provided)' : '(not provided)'}`).join('\n') + '\n\nMessage: ' + (body.message || '(none)') + '\n\nContact consent: granted via homepage form.',
    }, { idempotencyKey: 'demo-request/' + body.requestId });
    if (error || !data?.id) throw new Error('Delivery failed');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not send your request. Please try again or email hello@lotscout.com.' }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { syncResendContact } from '@/lib/resend-contacts';
import { FIT_CONSENT_TEXT, FIT_CONSENT_VERSION, recommendFit, validFitAnswers } from '@/lib/fit-quiz';

const attempts = new Map<string, { count: number; reset: number }>();
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Please submit from LotScout.' }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 6000) return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
  let body;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || body.website ||
    typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150 ||
    typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
    typeof body.marketingOptIn !== 'boolean' || !validFitAnswers(body.answers) ||
    typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId) ||
    ['company', 'phone'].some(key => body[key] != null && (typeof body[key] !== 'string' || body[key].length > 200))) {
    return NextResponse.json({ error: 'Please check your name, email, and quiz answers.' }, { status: 400 });
  }
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.reset < now) attempts.delete(key);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const entry = attempts.get(ip) || { count: 0, reset: now + 600000 };
  if (entry.count >= 5 || attempts.size >= 10000) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  entry.count++; attempts.set(ip, entry);
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Unable to save your details right now. Please try again.' }, { status: 503 });
  const recommendation = recommendFit(body.answers);
  const email = body.email.trim().toLowerCase();
  try {
    // The inbox record is the durable lead and consent receipt. Do not report
    // success to the client unless it has been accepted by the email provider.
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'LotScout <hello@lotscout.com>', to: 'support@lotscout.com', replyTo: email,
      subject: `LotScout Find Your Fit: ${recommendation}`,
      text: [
        `Lead ID: ${body.requestId}`, 'Submission/consent time: timestamp of this email receipt.',
        `Name: ${body.name.trim()}`, `Email: ${email}`, `Company: ${body.company?.trim() || '(not provided)'}`, `Phone: ${body.phone?.trim() || '(not provided)'}`,
        `Research need: ${body.answers[0]}`, `Workflow: ${body.answers[1]}`, `Coverage: ${body.answers[2]}`,
        `Recommended plan: ${recommendation}`, `Marketing opt-in: ${body.marketingOptIn ? 'YES' : 'NO'}`,
        `Consent wording: ${FIT_CONSENT_TEXT}`, `Consent version: ${FIT_CONSENT_VERSION}`,
        'Source: Find Your Fit quiz. This is a lead submission, not a purchase or confirmed booking.',
        body.marketingOptIn ? 'Marketing enrollment will be attempted after this record is saved.' : 'Do not enroll this lead in marketing based on this submission.',
      ].join('\n'),
    }, { idempotencyKey: `fit-lead/${body.requestId}` });
    if (error || !data?.id) throw new Error('Lead receipt failed');
    let marketingSync: 'not_requested' | 'synced' | 'pending' = 'not_requested';
    // No marketing contact creation/update at all unless explicitly checked.
    if (body.marketingOptIn) {
      try {
        const result = await syncResendContact({ email, firstName: body.name.trim(), audience: 'general' });
        marketingSync = result.ok ? 'synced' : 'pending';
      } catch { marketingSync = 'pending'; }
      if (marketingSync === 'pending') {
        await resend.emails.send({ from: 'LotScout <hello@lotscout.com>', to: 'support@lotscout.com', subject: 'Find Your Fit: marketing enrollment needs review', text: `Lead ID: ${body.requestId}\nThe lead opted in, but automatic enrollment did not complete. Check the original lead receipt before retrying.` }, { idempotencyKey: `fit-marketing-review/${body.requestId}` }).catch(() => undefined);
      }
    }
    return NextResponse.json({ ok: true, recommendation, marketingSync });
  } catch {
    return NextResponse.json({ error: 'We could not save your details. Please try again.' }, { status: 502 });
  }
}

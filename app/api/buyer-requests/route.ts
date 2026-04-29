// -- Run this in Supabase SQL editor before testing:
// -- create table buyer_requests (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, status text default 'pending_review', target_regions text[], budget_min numeric, budget_max numeric, min_acreage numeric, max_acreage numeric, use_case text, zoning_preference text[], timeline text, additional_notes text, contact_preference text[], created_at timestamptz default now(), updated_at timestamptz default now());
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_state text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_county text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_city text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_zip text;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';
import { containsProfanity } from '@/lib/profanity-filter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const textFields: [string, string][] = [
      ['use_case', body.use_case],
      ['additional_notes', body.additional_notes],
    ];
    for (const [, value] of textFields) {
      if (value && containsProfanity(value)) {
        return NextResponse.json(
          { error: 'Your submission contains inappropriate language. Please review and resubmit.' },
          { status: 400 }
        );
      }
    }

    const service = createServiceClient();

    const { data: buyerRequest, error: insertError } = await service
      .from('buyer_requests')
      .insert({
        user_id: user.id,
        status: 'pending_review',
        target_regions: body.target_regions ?? [],
        target_state: body.target_state ?? null,
        target_county: body.target_county ?? null,
        target_city: body.target_city ?? null,
        target_zip: body.target_zip ?? null,
        budget_min: body.budget_min ? Number(body.budget_min) : null,
        budget_max: body.budget_max ? Number(body.budget_max) : null,
        min_acreage: body.min_acreage ? Number(body.min_acreage) : null,
        max_acreage: body.max_acreage ? Number(body.max_acreage) : null,
        use_case: body.use_case ?? null,
        zoning_preference: body.zoning_preference ?? [],
        timeline: body.timeline ?? null,
        additional_notes: body.additional_notes ?? null,
        contact_preference: body.contact_preference ?? [],
      })
      .select()
      .single();

    if (insertError || !buyerRequest) {
      console.error('[buyer-requests] Insert error:', insertError);
      return NextResponse.json({ error: insertError?.message ?? 'Insert failed' }, { status: 500 });
    }

    const { data: profile } = await service
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    const buyerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'there';
    const buyerEmail = profile?.email || user.email;
    const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

    const regionsList = [body.target_state, body.target_county, body.target_city, body.target_zip]
      .filter(Boolean).join(', ') || (body.target_regions ?? []).join(', ') || '—';
    const budgetRange = body.budget_min || body.budget_max
      ? `$${Number(body.budget_min || 0).toLocaleString()} – $${Number(body.budget_max || 0).toLocaleString()}`
      : '—';
    const acreageRange = body.min_acreage || body.max_acreage
      ? `${body.min_acreage ?? '?'} – ${body.max_acreage ?? '?'} acres`
      : '—';

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'support@lotscout.com',
        to: 'support@lotscout.com',
        subject: 'New Buyer Request Posted',
        html: `
          <h2 style="color:#1B4332">New Buyer Request Posted</h2>
          <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
            <tr><td style="font-weight:bold;color:#666">Buyer Name</td><td>${buyerName}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Email</td><td>${buyerEmail}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Target Regions</td><td>${regionsList}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Budget</td><td>${budgetRange}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Acreage Range</td><td>${acreageRange}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Use Case</td><td>${body.use_case || '—'}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Timeline</td><td>${body.timeline || '—'}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Submitted</td><td>${submittedAt} CT</td></tr>
          </table>
          <p style="color:#d97706;font-weight:bold;margin-top:16px">⚠ Review at <a href="https://lotscout.com/admin/buyer-requests">lotscout.com/admin/buyer-requests</a></p>
        `,
      });

      if (buyerEmail) {
        await resend.emails.send({
          from: 'support@lotscout.com',
          to: buyerEmail,
          subject: 'Your buying criteria has been posted — LotScout',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#1B4332;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#1B4332;margin-top:0">Request Submitted!</h2>
                <p>Hi ${buyerName},</p>
                <p>Your buying criteria has been successfully submitted. Our team will review it and your profile will go live within <strong>24 hours</strong>.</p>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:24px 0">
                  <p style="margin:0 0 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Your Criteria</p>
                  <table cellpadding="4" style="font-size:14px;width:100%">
                    <tr><td style="color:#666;width:40%">Target Regions</td><td style="font-weight:500">${regionsList}</td></tr>
                    <tr><td style="color:#666">Budget</td><td style="font-weight:500">${budgetRange}</td></tr>
                    <tr><td style="color:#666">Acreage</td><td style="font-weight:500">${acreageRange}</td></tr>
                    <tr><td style="color:#666">Use Case</td><td style="font-weight:500">${body.use_case || '—'}</td></tr>
                    <tr><td style="color:#666">Timeline</td><td style="font-weight:500">${body.timeline || '—'}</td></tr>
                  </table>
                </div>
                <p style="color:#6b7280;font-size:13px">Questions? Reply to this email or visit <a href="https://lotscout.com" style="color:#059669">lotscout.com</a>.</p>
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error('[buyer-requests] Email error:', emailErr);
    }

    return NextResponse.json({ success: true, requestId: buyerRequest.id });
  } catch (err) {
    console.error('[buyer-requests] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from('buyer_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests });
  } catch (err) {
    console.error('[buyer-requests GET] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

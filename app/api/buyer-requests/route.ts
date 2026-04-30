// -- Run this in Supabase SQL editor before testing:
// -- create table buyer_requests (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, status text default 'pending_review', target_regions text[], budget_min numeric, budget_max numeric, min_acreage numeric, max_acreage numeric, use_case text, zoning_preference text[], timeline text, additional_notes text, contact_preference text[], created_at timestamptz default now(), updated_at timestamptz default now());
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_state text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_county text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_city text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_zip text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS price_per_acre numeric;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS area_unit text DEFAULT 'acres';
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS road_access text[];
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS utilities text[];
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS financing text[];
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS use_case_description text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS specific_requirements text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS working_with_agent boolean DEFAULT false;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_close_date date;

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

    const textFields: string[] = [
      body.use_case_description,
      body.specific_requirements,
      body.additional_notes,
      body.use_case,
    ];
    for (const value of textFields) {
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
        status: 'active',
        target_regions: body.target_regions ?? [],
        target_state: body.target_state ?? null,
        target_county: body.target_county ?? null,
        target_city: body.target_city ?? null,
        target_zip: body.target_zip ?? null,
        budget_min: body.budget_min ? Number(body.budget_min) : null,
        budget_max: body.budget_max ? Number(body.budget_max) : null,
        price_per_acre: body.price_per_acre ? Number(body.price_per_acre) : null,
        min_acreage: body.min_acreage ? Number(body.min_acreage) : null,
        max_acreage: body.max_acreage ? Number(body.max_acreage) : null,
        area_unit: body.area_unit ?? 'acres',
        zoning_preference: body.zoning_preference ?? [],
        road_access: body.road_access ?? [],
        utilities: body.utilities ?? [],
        financing: body.financing ?? [],
        use_case: body.use_case ?? null,
        use_case_description: body.use_case_description ?? null,
        specific_requirements: body.specific_requirements ?? null,
        timeline: body.timeline ?? null,
        target_close_date: body.target_close_date ?? null,
        working_with_agent: body.working_with_agent ?? false,
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
        subject: 'New Buyer Request (Auto-Published)',
        html: `
          <h2 style="color:#1B4332">New Buyer Request (Auto-Published)</h2>
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
          <p style="color:#6b7280;margin-top:16px">View at <a href="https://lotscout.com/admin/listings">lotscout.com/admin/listings</a></p>
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
                <p>Your buying criteria has been successfully submitted and is <strong>now live</strong> in the buyer directory.</p>
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

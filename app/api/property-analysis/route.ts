/*
SQL — run once in Supabase SQL editor:

create table property_analysis_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  input_type text not null,
  street_address text,
  city text,
  county text not null,
  state text not null,
  zip_code text,
  apn text,
  verified boolean default false,
  status text default 'pending',
  report_url text,
  submitted_at timestamptz default now(),
  completed_at timestamptz,
  user_email text,
  user_name text
);

alter table property_analysis_requests enable row level security;

create policy "Users can view own requests"
  on property_analysis_requests for select
  using (auth.uid() = user_id);

create policy "Users can insert own requests"
  on property_analysis_requests for insert
  with check (auth.uid() = user_id);
*/

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('property_analysis_requests')
    .select('id, input_type, street_address, city, county, state, zip_code, apn, status, report_url, submitted_at')
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, subscription_tier')
    .eq('id', user.id)
    .single();

  // Enforce monthly limits
  const TIER_LIMITS: Record<string, number | null> = { standard: 5, priority: 15, exclusive: null };
  const tierKey = profile?.subscription_tier ?? '';
  const monthlyLimit = TIER_LIMITS[tierKey] ?? 0;

  if (monthlyLimit !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('property_analysis_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('submitted_at', startOfMonth.toISOString());
    if ((count ?? 0) >= monthlyLimit) {
      return NextResponse.json({ error: 'Monthly limit reached', code: 'MONTHLY_LIMIT_REACHED' }, { status: 429 });
    }
  }

  // Duplicate detection
  if (body.inputType === 'address' && body.streetAddress) {
    const { data: dup } = await supabase
      .from('property_analysis_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('street_address', body.streetAddress)
      .limit(1)
      .maybeSingle();
    if (dup) return NextResponse.json({ error: 'Duplicate request', code: 'DUPLICATE_REQUEST' }, { status: 409 });
  } else if (body.inputType === 'apn' && body.apn) {
    const { data: dup } = await supabase
      .from('property_analysis_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('apn', body.apn)
      .limit(1)
      .maybeSingle();
    if (dup) return NextResponse.json({ error: 'Duplicate request', code: 'DUPLICATE_REQUEST' }, { status: 409 });
  }

  const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email || 'LotScout User';

  const { data: req, error } = await supabase
    .from('property_analysis_requests')
    .insert({
      user_id: user.id,
      input_type: body.inputType,
      street_address: body.streetAddress || null,
      city: body.city || null,
      county: body.county,
      state: body.state,
      zip_code: body.zipCode || null,
      apn: body.apn || null,
      verified: true,
      status: 'pending',
      user_email: user.email,
      user_name: userName,
    })
    .select()
    .single();

  if (error) {
    console.error('Analysis request insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

    const propertyDesc = body.inputType === 'address'
      ? `${body.streetAddress}, ${body.city}, ${body.state} ${body.zipCode}${body.county ? ` (${body.county} County)` : ''}`
      : `APN ${body.apn} · ${body.county} County, ${body.state}`;

    const isFastTier = profile?.subscription_tier === 'exclusive';
    const turnaround = isFastTier
      ? 'Your report will be ready within <strong>15 minutes</strong>.'
      : 'Your report will be ready within <strong>24 hours</strong>.';

    await resend.emails.send({
      from: 'support@lotscout.com',
      to: 'support@lotscout.com',
      subject: 'New Property Analysis Request',
      html: `
        <h2 style="color:#1B4332">New Property Analysis Request</h2>
        <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
          <tr><td style="font-weight:bold;color:#666">Name</td><td>${userName}</td></tr>
          <tr><td style="font-weight:bold;color:#666">Email</td><td>${user.email}</td></tr>
          <tr><td style="font-weight:bold;color:#666">Input Type</td><td>${body.inputType === 'address' ? 'Address' : 'APN'}</td></tr>
          <tr><td style="font-weight:bold;color:#666">Property</td><td>${propertyDesc}</td></tr>
          <tr><td style="font-weight:bold;color:#666">Submitted</td><td>${submittedAt} CT</td></tr>
        </table>
      `,
    });

    if (user.email) {
      await resend.emails.send({
        from: 'support@lotscout.com',
        to: user.email,
        subject: 'Your property analysis request has been received — LotScout',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <div style="background:#1B4332;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
            </div>
            <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
              <h2 style="color:#1B4332;margin-top:0">Request Received!</h2>
              <p>Hi ${userName},</p>
              <p>We've received your property analysis request for:</p>
              <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:0;font-weight:bold;color:#1B4332">${propertyDesc}</p>
              </div>
              <p>${turnaround}</p>
              <p style="color:#6b7280;font-size:13px">Questions? Reply to this email or visit <a href="https://lotscout.com" style="color:#059669">lotscout.com</a>.</p>
            </div>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.error('Email error:', emailErr);
  }

  const isFastTier = profile?.subscription_tier === 'exclusive';
  return NextResponse.json({ success: true, requestId: req.id, turnaround: isFastTier ? '15 minutes' : '24 hours' });
}

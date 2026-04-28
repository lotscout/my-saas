// -- Run this in Supabase SQL editor before testing:
// -- create table buyer_requests (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, state text, county text, zip_code text, city text, location_notes text, zoning text[], area_unit text default 'acres', min_acreage numeric, max_acreage numeric, road_access text[], utilities text[], min_budget numeric, max_budget numeric, price_per_acre numeric, financing text[], primary_use_case text, use_case_description text, specific_requirements text, target_close_date date, timeline_urgency text, working_with_agent boolean default false, contact_methods text[], additional_notes text, created_at timestamptz default now());

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
      ['location_notes', body.locationNotes],
      ['use_case_description', body.useCaseDescription],
      ['specific_requirements', body.specificRequirements],
      ['additional_notes', body.additionalNotes],
    ];
    for (const [, value] of textFields) {
      if (value && containsProfanity(value)) {
        return NextResponse.json(
          { error: 'Your submission contains inappropriate language. Please review and resubmit.' },
          { status: 400 }
        );
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    const { error } = await supabase.from('buyer_requests').insert({
      user_id: user.id,
      state: body.state || null,
      county: body.county || null,
      zip_code: body.zipCode || null,
      city: body.city || null,
      location_notes: body.locationNotes || null,
      zoning: body.zoning ?? [],
      area_unit: body.areaUnit ?? 'acres',
      min_acreage: body.minAcreage ? Number(body.minAcreage) : null,
      max_acreage: body.maxAcreage ? Number(body.maxAcreage) : null,
      road_access: body.roadAccess ?? [],
      utilities: body.utilities ?? [],
      min_budget: body.minBudget ? Number(String(body.minBudget).replace(/,/g, '')) : null,
      max_budget: body.maxBudget ? Number(String(body.maxBudget).replace(/,/g, '')) : null,
      price_per_acre: body.pricePerAcre ? Number(String(body.pricePerAcre).replace(/,/g, '')) : null,
      financing: body.financing ?? [],
      primary_use_case: body.primaryUseCase || null,
      use_case_description: body.useCaseDescription || null,
      specific_requirements: body.specificRequirements || null,
      target_close_date: body.targetCloseDate || null,
      timeline_urgency: body.timelineUrgency || null,
      working_with_agent: body.workingWithAgent ?? false,
      contact_methods: body.contactMethods ?? [],
      additional_notes: body.additionalNotes || null,
    });

    if (error) {
      console.error('buyer_requests insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const buyerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown';
      const buyerEmail = profile?.email ?? user.email ?? '';
      const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
      const budgetStr = `$${Number(String(body.minBudget).replace(/,/g, '')).toLocaleString()} – $${Number(String(body.maxBudget).replace(/,/g, '')).toLocaleString()}`;
      const acreageStr = body.maxAcreage
        ? `${body.minAcreage} – ${body.maxAcreage} ${body.areaUnit ?? 'acres'}`
        : `${body.minAcreage}+ ${body.areaUnit ?? 'acres'}`;
      const regions = [body.state, body.county, body.city].filter(Boolean).join(', ') || 'Not specified';

      await resend.emails.send({
        from: 'support@lotscout.com',
        to: 'support@lotscout.com',
        subject: 'New Buyer Request Posted',
        html: `
          <h2 style="color:#1B4332">New Buyer Request Posted</h2>
          <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
            <tr><td style="font-weight:bold;color:#666">Buyer Name</td><td>${buyerName}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Email</td><td>${buyerEmail}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Target Regions</td><td>${regions}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Budget</td><td>${budgetStr}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Acreage</td><td>${acreageStr}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Use Case</td><td>${body.primaryUseCase || 'Not specified'}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Submitted</td><td>${submittedAt} CT</td></tr>
          </table>
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
                <h2 style="color:#1B4332;margin-top:0">Your buying criteria is live!</h2>
                <p>Hi ${buyerName},</p>
                <p>Your buying criteria has been successfully posted to the LotScout marketplace. Sellers who match your requirements can now find and contact you directly.</p>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:24px 0">
                  <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Your Criteria</p>
                  <p style="margin:0;font-weight:bold;color:#1B4332">${body.primaryUseCase || 'Land Purchase'}</p>
                  <p style="margin:4px 0 0;color:#6b7280;font-size:14px">${regions} · ${acreageStr} · ${budgetStr}</p>
                </div>
                <p style="color:#6b7280;font-size:13px">Questions? Reply to this email or visit <a href="https://lotscout.com" style="color:#059669">lotscout.com</a>.</p>
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('buyer-requests route error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

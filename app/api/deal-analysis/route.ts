import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// ── Supabase service role (bypasses RLS) ──────────────────────────────────────
function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── POST /api/deal-analysis ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Authenticate via cookie-based client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse body
  let body: {
    address?: string;
    apn?: string;
    county?: string;
    state?: string;
    notes?: string;
    userEmail?: string;
    tier?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { address, apn, county, state, notes, tier } = body;

  if (!address?.trim() || !state?.trim()) {
    return NextResponse.json(
      { error: 'address and state are required' },
      { status: 400 }
    );
  }

  // 3. Build full address string for the property_reports.address field
  const fullAddress = [address.trim(), county ? `${county} County` : null, state]
    .filter(Boolean)
    .join(', ');

  // 4. Insert into property_reports using service role
  const serviceSupabase = getServiceSupabase();

  const { data: report, error: insertError } = await serviceSupabase
    .from('property_reports')
    .insert({
      user_id: user.id,
      address: fullAddress,
      apn: apn?.trim() || null,
      status: 'pending',
      metadata: {
        source: 'deal-analysis-form',
        raw_address: address.trim(),
        county: county?.trim() || null,
        state: state.trim(),
        notes: notes?.trim() || null,
        tier: tier ?? 'standard',
        submitted_at: new Date().toISOString(),
      },
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[deal-analysis] Supabase insert error:', insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 5. Send email notification via Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const submittedAt = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const isFastTier = tier === 'exclusive';
    const turnaround = isFastTier ? '15 minutes' : '24 hours';

    const supabaseDashboardUrl = `https://supabase.com/dashboard/project/axiockuobpttlwzicldo/editor`;

    await resend.emails.send({
      from: 'LotScout <hello@lotscout.com>',
      to: 'support@lotscout.com',
      subject: `New Deal Analysis Request — ${fullAddress}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1B4332;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:20px">LotScout — New Deal Analysis Request</h1>
          </div>
          <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
            <table cellpadding="10" style="border-collapse:collapse;font-size:14px;width:100%">
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="font-weight:bold;color:#6b7280;width:140px">User Email</td>
                <td>${user.email}</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="font-weight:bold;color:#6b7280">Address</td>
                <td>${address.trim()}</td>
              </tr>
              ${apn?.trim() ? `
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="font-weight:bold;color:#6b7280">APN</td>
                <td>${apn.trim()}</td>
              </tr>` : ''}
              ${county?.trim() ? `
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="font-weight:bold;color:#6b7280">County</td>
                <td>${county.trim()}</td>
              </tr>` : ''}
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="font-weight:bold;color:#6b7280">State</td>
                <td>${state}</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="font-weight:bold;color:#6b7280">Tier</td>
                <td style="text-transform:capitalize">${tier ?? 'standard'}</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="font-weight:bold;color:#6b7280">SLA</td>
                <td>${turnaround}</td>
              </tr>
              ${notes?.trim() ? `
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="font-weight:bold;color:#6b7280;vertical-align:top">Notes</td>
                <td style="white-space:pre-wrap">${notes.trim()}</td>
              </tr>` : ''}
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="font-weight:bold;color:#6b7280">Submitted</td>
                <td>${submittedAt} CT</td>
              </tr>
              <tr>
                <td style="font-weight:bold;color:#6b7280">Report ID</td>
                <td style="font-family:monospace;font-size:12px">${report.id}</td>
              </tr>
            </table>
            <div style="margin-top:24px">
              <a href="${supabaseDashboardUrl}" style="display:inline-block;background:#1B4332;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold">
                View in Supabase →
              </a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    // Non-fatal — log but don't fail the request
    console.error('[deal-analysis] Email error:', emailErr);
  }

  return NextResponse.json({ success: true, reportId: report.id });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logEmail } from '@/lib/email-logger';

function buildUserEmail(firstName: string, county: string, state: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr>
          <td style="background:#1B4332;border-radius:12px 12px 0 0;padding:28px 40px">
            <p style="margin:0;font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px">LotScout</p>
          </td>
        </tr>
        <tr>
          <td style="background:white;padding:40px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1B4332">Your report is on its way</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6">
              Hi ${firstName}, your free land market report for <strong>${county}, ${state}</strong>
              is being prepared. Check your inbox in the next few minutes.
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6">
              Your report includes county zoning activity, price per acre trends, and an
              AI-powered investment outlook for your area.
            </p>
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
              &copy; 2026 LotScout. All rights reserved.<br>
              You received this because you requested a market report at lotscout.com.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAdminEmail(
  firstName: string,
  lastName: string,
  email: string,
  county: string,
  state: string,
  ts: string,
): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px;color:#1f2937">
  <h2 style="margin:0 0 16px;color:#1B4332">New Market Report Request</h2>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr><td style="padding:6px 20px 6px 0;font-weight:600;color:#6b7280;font-size:14px">Name</td>
        <td style="padding:6px 0;font-size:14px">${firstName} ${lastName}</td></tr>
    <tr><td style="padding:6px 20px 6px 0;font-weight:600;color:#6b7280;font-size:14px">Email</td>
        <td style="padding:6px 0;font-size:14px">${email}</td></tr>
    <tr><td style="padding:6px 20px 6px 0;font-weight:600;color:#6b7280;font-size:14px">County</td>
        <td style="padding:6px 0;font-size:14px">${county}</td></tr>
    <tr><td style="padding:6px 20px 6px 0;font-weight:600;color:#6b7280;font-size:14px">State</td>
        <td style="padding:6px 0;font-size:14px">${state}</td></tr>
    <tr><td style="padding:6px 20px 6px 0;font-weight:600;color:#6b7280;font-size:14px">Requested</td>
        <td style="padding:6px 0;font-size:14px">${ts}</td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    first_name?: string;
    last_name?: string;
    email?: string;
    county?: string;
    state?: string;
  };

  const { first_name, last_name, email, county, state } = body;

  if (!first_name || !last_name || !email || !county || !state) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const normalizedEmail = email.toLowerCase().trim();

  // Deduplicate — one free report per email
  const { data: existing } = await supabase
    .from('market_report_requests')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'already_requested' }, { status: 409 });
  }

  // Insert report request
  const { error: insertError } = await supabase.from('market_report_requests').insert({
    first_name: first_name.trim(),
    last_name:  last_name.trim(),
    email:      normalizedEmail,
    county:     county.trim(),
    state:      state.trim(),
    status:     'pending',
    is_paid:    false,
    report_frequency: 'once',
  });

  if (insertError) {
    console.error('[market-reports] insert error:', insertError);
    return NextResponse.json({ error: 'Failed to save request. Please try again.' }, { status: 500 });
  }

  // Upsert into email_subscribers
  await supabase.from('email_subscribers').upsert(
    {
      email:      normalizedEmail,
      first_name: first_name.trim(),
      source:     'market_reports',
      status:     'active',
      subscribed_at: new Date().toISOString(),
    },
    { onConflict: 'email', ignoreDuplicates: false },
  );

  const ts = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Chicago',
  });

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Confirmation email to user
  try {
    await resend.emails.send({
      from:    'support@lotscout.com',
      to:      email.trim(),
      subject: `Your LotScout Market Report for ${county}, ${state} is being prepared`,
      html:    buildUserEmail(first_name.trim(), county.trim(), state.trim()),
    });
    await logEmail({
      to_email:   email.trim(),
      from_email: 'support@lotscout.com',
      subject:    `Your LotScout Market Report for ${county}, ${state} is being prepared`,
      email_type: 'market_report_request',
    });
  } catch (err) {
    console.error('[market-reports] user email error:', err);
  }

  // Notification to admin
  try {
    await resend.emails.send({
      from:    'support@lotscout.com',
      to:      'support@lotscout.com',
      subject: `New market report request: ${county}, ${state}`,
      html:    buildAdminEmail(first_name.trim(), last_name.trim(), email.trim(), county.trim(), state.trim(), ts),
    });
    await logEmail({
      to_email:   'support@lotscout.com',
      from_email: 'support@lotscout.com',
      subject:    `New market report request: ${county}, ${state}`,
      email_type: 'market_report_request_admin',
    });
  } catch (err) {
    console.error('[market-reports] admin email error:', err);
  }

  // Fire-and-forget: trigger report generation in the background
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const reportMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  fetch(`${siteUrl}/api/market-reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      county:       county.trim(),
      state:        state.trim(),
      email:        normalizedEmail,
      first_name:   first_name.trim(),
      report_month: reportMonth,
    }),
  }).catch(err => console.error('[market-reports/request] trigger generate error:', err));

  return NextResponse.json({ success: true, county: county.trim(), state: state.trim() });
}

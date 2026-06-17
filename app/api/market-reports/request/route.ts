import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logEmail } from '@/lib/email-logger';
import { STATE_MAP } from '@/lib/stateMap';
import { COUNTY_VALIDATION } from '@/lib/countyValidation';

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

  // Validate county against static county list
  // STATE_MAP maps full names ("Colorado" → "CO"); fall back to direct lookup if abbr was sent
  const stateAbbr = STATE_MAP[state.trim()] ?? state.trim().toUpperCase();
  const validCounties = COUNTY_VALIDATION[stateAbbr] ?? [];
  console.log(`[market-reports/request] county validation: stateAbbr=${stateAbbr} validCounties.length=${validCounties.length} county="${county.trim()}"`);
  if (validCounties.length > 0) {
    const strip = (s: string) =>
      s.toLowerCase()
        .replace(/\s+county$/i, '')
        .replace(/\s+parish$/i, '')
        .replace(/\s+borough$/i, '')
        .replace(/\s+census area$/i, '')
        .trim();
    const inputBase = strip(county.trim());
    const isValid = validCounties.some(n => strip(n) === inputBase || n.toLowerCase() === county.trim().toLowerCase());
    console.log(`[market-reports/request] inputBase="${inputBase}" isValid=${isValid}`);
    if (!isValid) {
      return NextResponse.json(
        {
          error: 'invalid_county',
          message: `We could not find "${county.trim()}" in ${state.trim()}. Please check the spelling and include the word "County" (e.g. Denver County).`,
        },
        { status: 422 },
      );
    }
  }

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
      last_name:    last_name.trim(),
      report_month: reportMonth,
    }),
  }).catch(err => console.error('[market-reports/request] trigger generate error:', err));

  return NextResponse.json({ success: true, county: county.trim(), state: state.trim() });
}

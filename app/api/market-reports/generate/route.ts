import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateReportData } from '@/lib/report-generator';
import { fillTemplate, getTemplatePath } from '@/lib/fill-template';
import { generatePDF } from '@/lib/generate-pdf';
import { logEmail } from '@/lib/email-logger';

// Allow long-running PDF + AI generation
export const maxDuration = 300;

function buildDeliveryEmail(
  firstName: string,
  county: string,
  state: string,
  reportUrl: string,
  siteUrl: string,
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr><td style="background:#1B4332;border-radius:12px 12px 0 0;padding:28px 40px">
          <p style="margin:0;font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px">LotScout</p>
        </td></tr>
        <tr><td style="background:white;padding:40px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1B4332">Your report is ready</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6">
            Hi ${firstName}, your land market report for <strong>${county}, ${state}</strong> is ready to download.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
            <tr><td>
              <a href="${reportUrl}"
                 style="display:inline-block;background:#1B4332;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px">
                Download Your Report &rarr;
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6">
            This report is powered by LotScout, The #1 Platform for Land Data and Off-Market Deals.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
            <tr><td>
              <a href="${siteUrl}"
                 style="display:inline-block;background:#F0FDF4;color:#1B4332;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;border:1px solid #BBF7D0">
                Visit LotScout
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
            &copy; 2026 LotScout. All rights reserved.<br>
            You received this because you requested a market report at lotscout.com.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    county?: string;
    state?: string;
    email?: string;
    first_name?: string;
    report_month?: string;
  };

  const { county, state, email, first_name, report_month } = body;

  if (!county || !state || !email || !first_name || !report_month) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lotscout.com';

  try {
    // Mark as generating
    await supabase
      .from('market_report_requests')
      .update({ status: 'generating' })
      .eq('email', email.toLowerCase().trim());

    // Step 1: AI generates data
    const reportData = await generateReportData(county, state, report_month);

    // Step 2: Fill templates
    const filledPages = ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map(n =>
      fillTemplate(getTemplatePath(n), reportData),
    );

    // Step 3: Render PDF
    const pdfBuffer = await generatePDF(filledPages);

    // Step 4: Upload to Supabase Storage
    const fileName = `${county.replace(/\s+/g, '-')}-${state.replace(/\s+/g, '-')}-${report_month.replace(/\s+/g, '-')}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('market-reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('market-reports')
      .getPublicUrl(fileName);

    const reportUrl = urlData.publicUrl;

    // Step 5: Update request row
    await supabase
      .from('market_report_requests')
      .update({ status: 'delivered', report_url: reportUrl })
      .eq('email', email.toLowerCase().trim());

    // Step 6: Send delivery email
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: 'LotScout <hello@lotscout.com>',
        to: email.trim(),
        subject: `Your LotScout Market Report for ${county} County, ${state} is here`,
        html: buildDeliveryEmail(first_name.trim(), county, state, reportUrl, siteUrl),
      });
      await logEmail({
        to_email:   email.trim(),
        from_email: 'reports@lotscout.com',
        subject:    `Your LotScout Market Report for ${county} County, ${state} is here`,
        email_type: 'market_report_delivery',
      });
    } catch (emailErr) {
      console.error('[generate] delivery email error:', emailErr);
    }

    return NextResponse.json({ success: true, report_url: reportUrl });
  } catch (err) {
    console.error('[market-reports/generate] error:', err);
    await supabase
      .from('market_report_requests')
      .update({ status: 'error' })
      .eq('email', email.toLowerCase().trim());
    return NextResponse.json({ error: 'Report generation failed.' }, { status: 500 });
  }
}

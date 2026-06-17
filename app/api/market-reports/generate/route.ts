import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateReportData } from '@/lib/report-generator';
import { fillTemplate, getReportTemplatePath } from '@/lib/fill-template';
import { generatePDF } from '@/lib/generate-pdf';
import { logEmail } from '@/lib/email-logger';
import type { AIReportData, TemplateData } from '@/lib/report-schema';

// Allow long-running PDF + AI generation
export const maxDuration = 300;

// ── URL builders ─────────────────────────────────────────────────────────────

function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const STATE_ABBR: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA',
  michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
};

// ── Land-use acre computation ─────────────────────────────────────────────────

function computeAcres(pctStr: string, sqmiStr: string): string {
  const pct = parseFloat(pctStr) / 100;
  const sqmi = parseFloat(sqmiStr.replace(/,/g, ''));
  if (!isFinite(pct) || !isFinite(sqmi) || sqmi === 0) return '—';
  return Math.round(pct * sqmi * 640).toLocaleString() + ' ac';
}

// ── HTML row builders ─────────────────────────────────────────────────────────

function buildCompSalesRows(d: AIReportData): string {
  const rows: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const loc = d[`comp_${i}_location` as keyof AIReportData];
    if (!loc) break;
    rows.push(
      `<tr class="hover:bg-[#f4faf7] transition-colors">` +
      `<td class="px-6 py-4 cell text-on-surface">${loc}</td>` +
      `<td class="px-6 py-4 cell text-on-surface">${d[`comp_${i}_acres` as keyof AIReportData]}</td>` +
      `<td class="px-6 py-4 cell text-on-surface text-right font-semibold">${d[`comp_${i}_price` as keyof AIReportData]}</td>` +
      `<td class="px-6 py-4 cell text-on-surface text-right">${d[`comp_${i}_price_per_acre` as keyof AIReportData]}</td>` +
      `<td class="px-6 py-4 cell text-on-surface-variant">${d[`comp_${i}_date` as keyof AIReportData]}</td>` +
      `</tr>`,
    );
  }
  if (rows.length === 0) {
    return `<tr><td colspan="5" class="px-6 py-8 text-center text-on-surface-variant" style="font-size:14.6px;">No verified sold land records found for this county in the last 90 days.</td></tr>`;
  }
  return rows.join('\n');
}

function buildActiveListingRows(d: AIReportData): string {
  if (d.listing_no_data_note) {
    return `<tr><td colspan="5" class="px-6 py-8 text-center text-on-surface-variant" style="font-size:14.6px;">${d.listing_no_data_note}</td></tr>`;
  }
  const rows: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const loc = d[`listing_${i}_location` as keyof AIReportData];
    if (!loc) break;
    const status = d[`listing_${i}_status` as keyof AIReportData] ?? 'Active';
    const statusColor = status.toLowerCase().includes('reduced') ? '#F59E0B' : '#10B981';
    rows.push(
      `<tr class="hover:bg-[#f4faf7] transition-colors">` +
      `<td class="px-6 py-4 cell text-on-surface">${loc}</td>` +
      `<td class="px-6 py-4 cell text-on-surface">${d[`listing_${i}_acres` as keyof AIReportData]}</td>` +
      `<td class="px-6 py-4 cell text-on-surface text-right font-semibold">${d[`listing_${i}_price` as keyof AIReportData]}</td>` +
      `<td class="px-6 py-4 cell text-on-surface text-right">${d[`listing_${i}_price_per_acre` as keyof AIReportData]}</td>` +
      `<td class="px-6 py-4 cell"><span style="color:${statusColor};font-weight:600;">${status}</span></td>` +
      `</tr>`,
    );
  }
  if (rows.length === 0) {
    return `<tr><td colspan="5" class="px-6 py-8 text-center text-on-surface-variant" style="font-size:14.6px;">No active land listings found for this county at this time.</td></tr>`;
  }
  return rows.join('\n');
}

function buildDataSourcesHtml(d: AIReportData): string {
  const cards: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const name = d[`source_${i}_name` as keyof AIReportData];
    const url  = d[`source_${i}_url`  as keyof AIReportData];
    const date = d[`source_${i}_date` as keyof AIReportData];
    if (!name) continue;
    cards.push(
      `<div class="data-card p-5">` +
      `<div class="flex items-start gap-3">` +
      `<span class="material-symbols-outlined text-[#1D9E75] mt-0.5" style="font-size:20px;font-variation-settings:'FILL' 1;">language</span>` +
      `<div style="min-width:0;">` +
      `<p class="font-bold text-on-surface" style="font-size:14.6px;margin:0 0 2px;">${name}</p>` +
      `<a href="${url}" class="text-[#1D9E75] break-all" style="font-size:12px;">${url}</a>` +
      `<p class="text-on-surface-variant mt-1" style="font-size:12px;margin:4px 0 0;">Accessed ${date}</p>` +
      `</div></div></div>`,
    );
  }
  if (cards.length === 0) {
    return `<p class="text-on-surface-variant" style="font-size:14.6px;">No sources recorded for this report.</p>`;
  }
  return cards.join('\n');
}

// ── Delivery email ────────────────────────────────────────────────────────────

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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    county?: string;
    state?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    report_month?: string;
  };

  const { county, state, email, first_name, last_name, report_month } = body;

  if (!county || !state || !email || !first_name || !report_month) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lotscout.com';

  try {
    await supabase
      .from('market_report_requests')
      .update({ status: 'generating' })
      .eq('email', email.toLowerCase().trim());

    // Step 1: AI research
    const aiData = await generateReportData(county, state, report_month);

    // Step 2: Build template data
    const countyBase = county.replace(/\s+county$/i, '').trim();
    const stateAbbr  = STATE_ABBR[state.toLowerCase()] ?? state;
    const recipientName = [first_name, last_name].filter(Boolean).join(' ').trim();

    const pctStr = (s: string) => s?.includes('%') ? s : `${s}%`;

    const templateData: TemplateData = {
      COUNTY_NAME:    countyBase,
      STATE:          state,
      REPORT_DATE:    report_month,

      MEDIAN_PRICE_ACRE: aiData.median_price_acre,
      ACTIVE_LISTINGS:   aiData.active_listings,
      AVG_DOM:           aiData.avg_dom,
      YOY_CHANGE:        aiData.yoy_change,

      COUNTY_OVERVIEW_PROSE: aiData.county_overview_prose,

      COMP_SALES_ROWS:    buildCompSalesRows(aiData),
      ACTIVE_LISTING_ROWS: buildActiveListingRows(aiData),

      ZILLOW_URL:    `https://www.zillow.com/homes/for_sale/${slug(countyBase)}-county-${slug(state)}_rb/?homeType=lot%2Cland`,
      REDFIN_URL:    `https://www.redfin.com/county/land-for-sale/${slug(state)}/${slug(countyBase)}-county`,
      LANDWATCH_URL: `https://www.landwatch.com/${slug(state)}-land-for-sale/${slug(countyBase)}-county/`,

      LAND_USE_RES_PCT: pctStr(aiData.land_use_res_pct),
      LAND_USE_AG_PCT:  pctStr(aiData.land_use_ag_pct),
      LAND_USE_COM_PCT: pctStr(aiData.land_use_com_pct),

      LAND_USE_RES_AC: computeAcres(aiData.land_use_res_pct, aiData.land_area_sqmi),
      LAND_USE_AG_AC:  computeAcres(aiData.land_use_ag_pct,  aiData.land_area_sqmi),
      LAND_USE_COM_AC: computeAcres(aiData.land_use_com_pct, aiData.land_area_sqmi),

      REZONING_PROSE: aiData.rezoning_prose,
      PERMITS_PROSE:  aiData.permits_prose,
      POLICY_PROSE:   aiData.policy_prose,
      RISK_PROSE:     aiData.risk_prose,
      INSIGHT_PROSE:  aiData.insight_prose,
      WATCH_PROSE:    aiData.watch_prose,

      DATA_SOURCES: buildDataSourcesHtml(aiData),

      RECIPIENT_NAME: recipientName,
      LOTSCOUT_URL:   `https://lotscout.com/marketplace?state=${stateAbbr}`,
    };

    // Step 3: Fill template
    const filledHtml = fillTemplate(getReportTemplatePath(), templateData);

    // Step 4: Render PDF
    const pdfBuffer = await generatePDF(filledHtml);

    // Step 5: Upload to Supabase Storage
    const fileName = `${slug(countyBase)}-${slug(state)}-${report_month.replace(/\s+/g, '-')}.pdf`;

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

    // Step 6: Update request row
    await supabase
      .from('market_report_requests')
      .update({ status: 'delivered', report_url: reportUrl })
      .eq('email', email.toLowerCase().trim());

    // Step 7: Send delivery email
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: 'LotScout <hello@lotscout.com>',
        to: email.trim(),
        subject: `Your LotScout Market Report for ${county}, ${state} is here`,
        html: buildDeliveryEmail(first_name.trim(), county, state, reportUrl, siteUrl),
      });
      await logEmail({
        to_email:   email.trim(),
        from_email: 'hello@lotscout.com',
        subject:    `Your LotScout Market Report for ${county}, ${state} is here`,
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

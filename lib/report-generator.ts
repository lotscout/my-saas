import Anthropic from '@anthropic-ai/sdk';
import type { AIReportData } from './report-schema';

const SYSTEM_PROMPT = `You are a professional real estate market research analyst preparing a factual, data-driven county land market report for a general investor audience. Your role is to compile publicly available information and present it objectively in the style of an institutional market research document. All analysis must be neutral, factual, and based on publicly available data sources. Write at the county and market level — never as a single-parcel appraisal.`;

// ── OUTPUT SCHEMA ─────────────────────────────────────────────────────────────
const OUTPUT_SCHEMA = `{
  "median_price_acre": "formatted dollar amount e.g. $85,000 — median price per acre for vacant land in this county",
  "active_listings": "integer count of currently active vacant land listings as a string",
  "avg_dom": "average days on market for vacant land listings as a string",
  "yoy_change": "year-over-year price change e.g. +4.2% or -1.8%",

  "county_overview_prose": "2–4 paragraphs of HTML prose (<p> tags only) covering: county geography and demographics, key economic drivers, land market context, and what makes this county notable for land investors. Write at the county/market level. Do not describe individual parcels.",

  "land_area_sqmi": "total county land area in square miles, numeric as a plain string e.g. 1250",
  "land_use_res_pct": "residential zoning percentage as a string including percent sign e.g. 45%",
  "land_use_ag_pct": "agricultural zoning percentage as a string including percent sign e.g. 35%",
  "land_use_com_pct": "commercial/industrial/other zoning percentage as a string including percent sign e.g. 20% — this value must make res+ag+com total exactly 100%",

  "comp_1_location": "address or nearest intersection of the sold parcel",
  "comp_1_acres": "acreage as a decimal string e.g. 2.5",
  "comp_1_price": "recorded sale price e.g. $187,500",
  "comp_1_price_per_acre": "price per acre for parcels 0.25 acres and above e.g. $75,000/acre; price per sq ft for smaller parcels e.g. $1.72/sq ft",
  "comp_1_date": "month and year of sale e.g. May 2026",

  "comp_2_location": "string — empty string if fewer than 2 verified comps found",
  "comp_2_acres": "string",
  "comp_2_price": "string",
  "comp_2_price_per_acre": "string",
  "comp_2_date": "string",

  "comp_3_location": "string — empty string if fewer than 3 verified comps found",
  "comp_3_acres": "string",
  "comp_3_price": "string",
  "comp_3_price_per_acre": "string",
  "comp_3_date": "string",

  "comp_4_location": "string",
  "comp_4_acres": "string",
  "comp_4_price": "string",
  "comp_4_price_per_acre": "string",
  "comp_4_date": "string",

  "comp_5_location": "string",
  "comp_5_acres": "string",
  "comp_5_price": "string",
  "comp_5_price_per_acre": "string",
  "comp_5_date": "string",

  "comp_6_location": "string",
  "comp_6_acres": "string",
  "comp_6_price": "string",
  "comp_6_price_per_acre": "string",
  "comp_6_date": "string",

  "listing_no_data_note": "if NO real active listings were found, write a brief honest note e.g. 'No active vacant land listings found for this county at this time. Check Zillow and LandWatch directly for the latest inventory.' — if listings ARE found below, set this to empty string",

  "listing_1_location": "address or area description of real active listing — empty string if not found",
  "listing_1_acres": "acreage string",
  "listing_1_price": "asking price e.g. $275,000",
  "listing_1_price_per_acre": "asking price per acre e.g. $55,000/acre",
  "listing_1_status": "listing status e.g. Active or Price Reduced",

  "listing_2_location": "string — empty string if fewer than 2 real listings found",
  "listing_2_acres": "string",
  "listing_2_price": "string",
  "listing_2_price_per_acre": "string",
  "listing_2_status": "string",

  "listing_3_location": "string",
  "listing_3_acres": "string",
  "listing_3_price": "string",
  "listing_3_price_per_acre": "string",
  "listing_3_status": "string",

  "listing_4_location": "string",
  "listing_4_acres": "string",
  "listing_4_price": "string",
  "listing_4_price_per_acre": "string",
  "listing_4_status": "string",

  "listing_5_location": "string",
  "listing_5_acres": "string",
  "listing_5_price": "string",
  "listing_5_price_per_acre": "string",
  "listing_5_status": "string",

  "listing_6_location": "string",
  "listing_6_acres": "string",
  "listing_6_price": "string",
  "listing_6_price_per_acre": "string",
  "listing_6_status": "string",

  "rezoning_prose": "HTML prose (<p> and <ul><li> allowed) covering recent rezoning activity in this county. Describe 2–3 specific recent approvals or pending decisions with addresses, zoning changes, and investor relevance. If data is unavailable, note that clearly rather than fabricating examples.",

  "permits_prose": "HTML prose (<p> tags) covering building permit activity this period. Include residential count, commercial count, aggregate value, and what the permit volume signals for land demand. Write at county scale.",

  "policy_prose": "HTML prose (<p> and <ul><li> allowed) covering: recent or pending legislation affecting land use, election items relevant to land investors, and available financial incentives (opportunity zones, tax abatements, TIF districts, etc.) for this county. Be specific to this county and state.",

  "risk_prose": "HTML prose (<p> tags) assessing market risk factors for land investors in this county. Cover entitlement difficulty, price volatility, supply/demand balance, and policy uncertainty. Write 2–3 paragraphs at the market level.",

  "insight_prose": "HTML prose (<p> tags) synthesizing the market outlook: what the data signals for the next 12–24 months, where the opportunity is, and what the overall investment signal is (BUY / BUY Selective / NEUTRAL / CAUTIOUS / HOLD). 2–3 paragraphs.",

  "watch_prose": "HTML unordered list (<ul><li> format) of 4–6 specific events, decisions, or data points that land investors should monitor in this county over the next 6–12 months. Each item should be concrete and actionable.",

  "source_1_name": "name of a source ACTUALLY USED in this report",
  "source_1_url": "URL of that source",
  "source_1_date": "date accessed e.g. June 2026",

  "source_2_name": "empty string if fewer than 2 sources used",
  "source_2_url": "string",
  "source_2_date": "string",

  "source_3_name": "string",
  "source_3_url": "string",
  "source_3_date": "string",

  "source_4_name": "string",
  "source_4_url": "string",
  "source_4_date": "string",

  "source_5_name": "string",
  "source_5_url": "string",
  "source_5_date": "string",

  "source_6_name": "string",
  "source_6_url": "string",
  "source_6_date": "string",

  "source_7_name": "string",
  "source_7_url": "string",
  "source_7_date": "string",

  "source_8_name": "string",
  "source_8_url": "string",
  "source_8_date": "string"
}`;

function buildUserPrompt(county: string, state: string, reportMonth: string): string {
  return `Research and compile a complete land market report for ${county}, ${state} for the period ${reportMonth}.

TASK 1 — COMPARABLE LAND SALES (search in this order):

1a. LandWatch (landwatch.com): Search for recently sold vacant land in ${county}, ${state} in the last 90 days. Look for the sold/recently sold section. Record each result: location, acreage, sale price, price per acre, and date.

1b. Zillow (zillow.com): Filter by property type "lots and land" and sold in last 90 days for ${county}, ${state}. Record sold listings with the same fields.

1c. Redfin (redfin.com): Filter by property type "land" and sold in last 90 days for ${county}, ${state}. Record results.

1d. ${county} Assessor or Recorder website: Search for deed transfers for vacant land parcels recorded in the last 60 days. This is the most authoritative source — prioritize these if available.

From all sources: compile the 6 most recent verified sold land parcels in ${county}, ${state}. For each parcel record location, acreage, sale price, price per acre (or price per sq ft for parcels under 0.25 acres), sale date, and source URL.

HONESTY RULE — COMPARABLE SALES: Only include sales you can verify from a real public source. Do not estimate or fabricate sale prices. If fewer than 6 verified sales are found, leave the remaining comp fields empty. If no verified sales are found at all, state this clearly in the rezoning_prose section and leave all comp fields empty.

TASK 2 — ACTIVE LISTINGS (search all three sources):

Search Zillow, Redfin, and LandWatch for currently active vacant land listings in ${county}, ${state}. Find 4–6 specific real listings. For each record: location/address, acreage, asking price, price per acre, and listing status (Active or Price Reduced).

HONESTY RULE — ACTIVE LISTINGS: These must be real listings you found, not invented. If the county has sparse inventory and you cannot find 4 real listings, return only what you actually found (even 1–2 is fine). If you find none at all, leave all listing fields empty and set listing_no_data_note to an honest explanation. Never fabricate a listing.

TASK 3 — MARKET STATS: Research current active listing count, average days on market, year-over-year price change, and median price per acre for vacant land in ${county}, ${state}. Use Zillow, Redfin, LandWatch, or county assessor data.

TASK 4 — LAND AREA AND ZONING: Find the total land area of ${county} in square miles (from Census Bureau, county website, or similar). Find the zoning breakdown (residential %, agricultural %, commercial/industrial/other %). The three percentages must sum to exactly 100.

TASK 5 — COUNTY OVERVIEW: Research the county's geography, population, key economic drivers, and land market context. Write 2–4 paragraphs suitable for an investor-facing market report. County/market level — not a parcel description.

TASK 6 — DEVELOPMENT INTELLIGENCE:
- Recent rezoning approvals or pending applications (last 60 days)
- Building permit volume this period (residential count, commercial count, aggregate value)
- Elections, policies, or legislation affecting land use in ${county} or ${state}
- Financial incentives available to land developers or buyers (opportunity zones, TIF, enterprise zones, tax credits)

TASK 7 — RISK AND OUTLOOK:
- Assess market risk factors: entitlement difficulty, price volatility, supply/demand balance, policy uncertainty
- Write a market outlook synthesizing what the data signals for the next 12–24 months
- Identify 4–6 specific events or decisions for investors to monitor

TASK 8 — SOURCES:
Record every source you actually retrieved data from. Include the website name, URL, and the date accessed. Only include sources where you actually found and used data from — do not list sources you searched but found nothing useful from.

DATA ACCURACY REQUIREMENTS:
- Only use verified public sources: county assessor, Zillow, Redfin, LandWatch, Land.com, Census Bureau, BLS, county government websites
- Do not fabricate prices, addresses, or listing details
- If a metric is unavailable, say so clearly in the relevant prose section — do not invent a number
- Every statistic must be traceable to a real source listed in your sources section

Return ONLY a valid JSON object. No preamble, no explanation, no markdown code fences. The JSON must match this schema exactly:
${OUTPUT_SCHEMA}`;
}

export async function generateReportData(
  county: string,
  state: string,
  reportMonth: string,
): Promise<AIReportData> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [{ type: 'web_search_20250305', name: 'web_search' }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: 'user', content: buildUserPrompt(county, state, reportMonth) }];

  try {
    let response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    let iterations = 0;
    while (response.stop_reason === 'tool_use' && iterations < 10) {
      iterations++;
      messages.push({ role: 'assistant', content: response.content });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolResults = (response.content as any[])
        .filter((block: any) => block.type === 'tool_use')
        .map((block: any) => ({
          type: 'tool_result',
          tool_use_id: block.id,
          content: block.content ?? '',
        }));

      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }

      response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks = (response.content as any[]).filter((b: any) => b.type === 'text');
    const rawText = textBlocks.map((b: any) => b.text).join('');

    let jsonStr = rawText.trim();
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) jsonStr = match[0];

    return JSON.parse(jsonStr) as AIReportData;

  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; error?: { type?: string; message?: string } };

    console.error('[report-generator] Anthropic API error:', {
      status:  error?.status,
      message: error?.message,
      type:    error?.error?.type,
      detail:  error?.error?.message,
    });

    if (error?.status === 400) {
      throw new Error('Report generation temporarily unavailable. Please try again in a few minutes.');
    }
    if (error?.status === 429) {
      throw new Error('Our report system is busy. Please try again in 5 minutes.');
    }

    throw new Error(`Report generation failed: ${error?.message ?? 'Unknown error'}`);
  }
}

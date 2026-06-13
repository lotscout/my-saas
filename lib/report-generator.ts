import Anthropic from '@anthropic-ai/sdk';
import type { ReportData } from './report-schema';

const SYSTEM_PROMPT = `You are a professional real estate market research analyst preparing a factual, data-driven county land market report. Your role is to compile publicly available information and present it objectively in the style of an institutional market research document. All analysis must be neutral, factual, and based on publicly available data sources.`;

const OUTPUT_SCHEMA = `{
  "county_name": "e.g. Denver County, Colorado",
  "metro_area": "e.g. Denver-Aurora-Lakewood, CO Metro",
  "report_period": "e.g. May/June 2026",
  "report_month": "e.g. June 2026",
  "median_price_per_acre": "formatted dollar amount, e.g. $85,000",
  "median_price_trend": "e.g. +4.2% year-over-year",
  "active_listings": "integer count as string",
  "active_listings_note": "e.g. Up 8% from prior month",
  "avg_days_on_market": "integer as string",
  "dom_trend_note": "e.g. Down 5 days from Q1 average",
  "dom_trend_direction": "up or down",
  "closed_sales": "integer as string",
  "closed_sales_note": "e.g. Highest month since October 2024",
  "executive_summary": "2-3 sentence market summary",

  "population": "e.g. 715,522",
  "land_area": "e.g. 153 sq mi",
  "population_growth": "e.g. +1.4% annually",
  "total_households": "e.g. 310,800",
  "median_household_income": "e.g. $72,100",
  "unemployment_rate": "e.g. 3.4%",
  "zoning_authority": "e.g. County Planning and Development Department",

  "comp_1_location": "neighborhood or intersection",
  "comp_1_acres": "e.g. 2.5",
  "comp_1_zoning": "e.g. A-1 (Agricultural)",
  "comp_1_price": "e.g. $150,000",
  "comp_1_price_display": "price per acre for parcels 0.25 acres and above (e.g. $60,000/acre); price per sq ft for parcels under 0.25 acres (e.g. $1.38/sq ft)",
  "comp_1_date": "e.g. May 2026",
  "comp_2_location": "string",
  "comp_2_acres": "string",
  "comp_2_zoning": "string",
  "comp_2_price": "string",
  "comp_2_price_display": "string",
  "comp_2_date": "string",
  "comp_3_location": "string",
  "comp_3_acres": "string",
  "comp_3_zoning": "string",
  "comp_3_price": "string",
  "comp_3_price_display": "string",
  "comp_3_date": "string",
  "comp_4_location": "string",
  "comp_4_acres": "string",
  "comp_4_zoning": "string",
  "comp_4_price": "string",
  "comp_4_price_display": "string",
  "comp_4_date": "string",
  "comp_5_location": "string",
  "comp_5_acres": "string",
  "comp_5_zoning": "string",
  "comp_5_price": "string",
  "comp_5_price_display": "string",
  "comp_5_date": "string",
  "comp_6_location": "string",
  "comp_6_acres": "string",
  "comp_6_zoning": "string",
  "comp_6_price": "string",
  "comp_6_price_display": "string",
  "comp_6_date": "string",

  "rezoning_1_title": "short descriptive title for the rezoning",
  "rezoning_1_address": "full street address of the parcel",
  "rezoning_1_prev_zoning": "e.g. A-2 (Agricultural)",
  "rezoning_1_new_zoning": "e.g. R-3 (Multi-Family Residential)",
  "rezoning_1_acreage": "numeric as string, e.g. 4.5",
  "rezoning_1_approving_body": "e.g. County Planning Board",
  "rezoning_1_date_approved": "e.g. May 15, 2026",
  "rezoning_1_description": "1-2 sentence description of what was approved and why it matters",
  "rezoning_1_note": "short vote or outcome, e.g. Approved 7-1",
  "rezoning_2_title": "string",
  "rezoning_2_address": "string",
  "rezoning_2_prev_zoning": "string",
  "rezoning_2_new_zoning": "string",
  "rezoning_2_acreage": "string",
  "rezoning_2_approving_body": "string",
  "rezoning_2_date_approved": "string",
  "rezoning_2_description": "string",
  "rezoning_2_note": "short note, e.g. Under appeal or Approved unanimously",
  "rezoning_3_title": "string",
  "rezoning_3_address": "string",
  "rezoning_3_prev_zoning": "string",
  "rezoning_3_new_zoning": "string",
  "rezoning_3_acreage": "string",
  "rezoning_3_approving_body": "string",
  "rezoning_3_date_approved": "string",
  "rezoning_3_description": "string",
  "rezoning_3_status": "short effective date or status, e.g. Effective August 2026",

  "permits_residential": "integer count as string",
  "permits_commercial": "integer count as string",
  "permits_aggregate_value": "total value of all permits issued, e.g. $48.2M",
  "permits_avg_sqft": "average square footage per residential permit, e.g. 2,400 sq ft",

  "infra_1_title": "project name",
  "infra_1_agency": "responsible agency name",
  "infra_1_budget": "e.g. $42M",
  "infra_1_timeline": "e.g. Completion Q2 2027",
  "infra_1_affected_area": "neighborhoods or geographic description",
  "infra_1_impact": "1-2 sentences on land market impact",
  "infra_2_title": "string",
  "infra_2_agency": "string",
  "infra_2_budget": "string",
  "infra_2_timeline": "string",
  "infra_2_affected_area": "string",
  "infra_2_impact": "string",
  "infra_3_title": "string",
  "infra_3_agency": "string",
  "infra_3_budget": "string",
  "infra_3_timeline": "string",
  "infra_3_affected_area": "string",
  "infra_3_impact": "string",

  "board_meeting_date": "e.g. July 22, 2026",
  "board_meeting_title": "meeting name and agenda focus",
  "board_meeting_warning": "key agenda items relevant to land investors, 1-2 sentences",

  "listings_under_1_acre": "integer count",
  "listings_1_to_5_acres": "integer count",
  "listings_5_to_20_acres": "integer count",
  "listings_over_20_acres": "integer count",
  "median_price_under_1_acre": "e.g. $410,000",
  "median_price_1_to_5_acres": "e.g. $285,000",
  "median_price_5_to_20_acres": "e.g. $198,000",
  "median_price_over_20_acres": "e.g. $145,000",
  "price_trend_current": "current median price per acre, e.g. $85,000",
  "price_trend_prior_month": "prior month median, e.g. $81,000",
  "price_trend_6_months": "six months ago median, e.g. $74,000",
  "price_trend_direction": "up or down",
  "new_listings_this_month": "integer count",
  "listings_under_contract": "integer count",
  "zoning_residential_pct": "integer percentage, e.g. 45",
  "zoning_agricultural_pct": "integer percentage",
  "zoning_commercial_pct": "integer percentage",
  "zoning_industrial_pct": "integer percentage",
  "zoning_mixed_use_pct": "integer percentage",

  "job_1_title": "announcement headline, e.g. Amazon Distribution Center Expansion",
  "job_1_company": "company name",
  "job_1_industry": "industry sector, e.g. Technology / E-Commerce",
  "job_1_job_count": "e.g. 500 jobs",
  "job_1_role_types": "types of roles, e.g. warehouse associates, logistics managers",
  "job_1_timeline": "e.g. Hiring begins Q3 2026",
  "job_1_land_impact": "1-2 sentences on how this affects land demand in the county",
  "job_2_title": "string",
  "job_2_company": "string",
  "job_2_industry": "string",
  "job_2_job_count": "string",
  "job_2_role_types": "string",
  "job_2_timeline": "string",
  "job_2_land_impact": "string",
  "job_3_title": "string",
  "job_3_company": "string",
  "job_3_industry": "string",
  "job_3_job_count": "string",
  "job_3_role_types": "string",
  "job_3_timeline": "string",
  "job_3_land_impact": "string",

  "policy_1_title": "policy or legislation name",
  "policy_1_date_badge": "e.g. Signed June 2026 or Nov 2026 Ballot",
  "policy_1_description": "2-3 sentences explaining the policy and its land market impact",
  "policy_2_title": "string",
  "policy_2_date_badge": "string",
  "policy_2_description": "string",

  "incentive_1_label": "incentive program name",
  "incentive_1_value": "e.g. Up to $10,000 per acre or Capital gains deferral + 15% reduction",
  "incentive_1_zone": "applicable zone or area, e.g. Opportunity Zone Census Tract 12",
  "incentive_1_expiry": "e.g. December 2026 or Ongoing or Annual allocation cycle",
  "incentive_1_explanation": "plain-English explanation of how a landowner or developer benefits, 1-2 sentences",
  "incentive_2_label": "string",
  "incentive_2_value": "string",
  "incentive_2_zone": "string",
  "incentive_2_expiry": "string",
  "incentive_2_explanation": "string",
  "incentive_3_label": "string",
  "incentive_3_value": "string",
  "incentive_3_zone": "string",
  "incentive_3_expiry": "string",
  "incentive_3_explanation": "string",
  "incentive_4_label": "string",
  "incentive_4_value": "string",
  "incentive_4_zone": "string",
  "incentive_4_expiry": "string",
  "incentive_4_explanation": "string",

  "comp_county_1_name": "county name",
  "comp_county_1_growth": "e.g. +2.8%",
  "comp_county_1_relevance": "1-2 sentences on how this county compares to the target county",
  "comp_county_2_name": "string",
  "comp_county_2_growth": "string",
  "comp_county_2_relevance": "string",
  "comp_county_3_name": "string",
  "comp_county_3_growth": "string",
  "comp_county_3_relevance": "string",
  "comp_county_4_name": "string",
  "comp_county_4_growth": "string",
  "comp_county_4_relevance": "string",

  "risk_1_label": "Entitlement Difficulty",
  "risk_1_pct": "integer 1-100",
  "risk_1_color": "#10B981 for low, #F59E0B for moderate, #EF4444 for high",
  "risk_1_display": "Low, Low-Moderate, Moderate, High-Moderate, or High",
  "risk_2_label": "Price Variability",
  "risk_2_pct": "integer 1-100",
  "risk_2_color": "string",
  "risk_2_display": "string",
  "risk_3_label": "Supply Availability",
  "risk_3_pct": "integer 1-100",
  "risk_3_color": "string",
  "risk_3_display": "string",
  "risk_4_label": "Demand Level",
  "risk_4_pct": "integer 1-100",
  "risk_4_color": "string",
  "risk_4_display": "string",
  "risk_5_label": "Policy Uncertainty",
  "risk_5_pct": "integer 1-100",
  "risk_5_color": "string",
  "risk_5_display": "string",

  "insight_paragraph": "3-4 sentence market outlook paragraph synthesizing key findings",
  "watch_1": "specific item for analysts to monitor in coming months",
  "watch_2": "string",
  "watch_3": "string",
  "watch_4": "string",
  "watch_5": "string",
  "recommendation_signal": "one of: BUY, BUY — Selective, NEUTRAL, CAUTIOUS, or HOLD",
  "recommendation_body": "2-3 sentences with specific actionable guidance for land investors",

  "source_1_name": "string",
  "source_1_url": "string",
  "source_1_date": "string",
  "source_2_name": "string",
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
  "source_8_date": "string",

  "disclaimer_para_1": "string",
  "disclaimer_para_2": "string"
}`;

function buildUserPrompt(county: string, state: string, reportMonth: string): string {
  return `Research and compile a complete land market report for ${county}, ${state} for the period ${reportMonth}.

Gather publicly available data on the following topics:
1. Recent vacant land sales in ${county} — find at least 6 comparable sales with location, acreage, zoning, total sale price, and date. For each comp, calculate price_display as: price per acre for parcels 0.25 acres and above (e.g. "$60,000/acre"); price per sq ft for parcels under 0.25 acres (e.g. "$1.38/sq ft").
2. Median price per acre for vacant land parcels, plus median prices broken down by size range: under 1 acre, 1-5 acres, 5-20 acres, over 20 acres.
3. Number of active vacant land listings (broken down by size range) and average days on market.
4. Recent rezoning approvals from county planning records — for each rezoning include: parcel address, previous zoning code and type, new zoning code and type, acreage, approving body, date approved, a 1-2 sentence description, and a short note on vote outcome (rezonings 1 and 2) or effective date (rezoning 3).
5. Building permits issued this period — residential count, commercial count, aggregate total value of all permits, and average square footage per residential permit.
6. Three infrastructure projects underway or announced — for each include: agency responsible, budget, timeline, affected geographic area, and land market impact.
7. Upcoming planning board or zoning board meeting — date, meeting title/agenda, and key items relevant to land investors.
8. Three major employer announcements affecting land demand — for each include: company name, industry, job count, role types, timeline, and land market impact in 1-2 sentences.
9. Two pending or recently passed policies or legislation affecting land use — for each include title, a date badge (e.g. "Signed June 2026" or "Nov 2026 Ballot"), and a 2-3 sentence description of land market impact.
10. Four local financial incentives available to landowners or developers — for each include: program name, value, applicable zone or geographic area, expiry date, and a plain-English explanation of how a landowner benefits.
11. Population, income, unemployment, and household data from public sources.
12. Four comparable neighboring counties with their growth rate and a 1-2 sentence comparison to ${county}.
13. Active listing count broken down by acreage range.
14. Price per acre trend compared to prior month and six months ago.
15. Land use breakdown by zoning category as a percentage.

DATA ACCURACY REQUIREMENTS — YOU MUST FOLLOW THESE:

Price per acre and comparable sales: Only use data from verified public sources including county assessor records, MLS public data, Zillow land listings, LandWatch, Land.com, or Realtor.com. Do not estimate or interpolate prices. If you cannot find verified recent land sale prices for this specific county, state that data is limited and provide the best available public estimate with a clear note that it is an estimate. Never fabricate sale prices. Always cite the source for each comparable sale.

Market velocity data (days on market, new listings count, listings under contract): Only use data from publicly available real estate sources for vacant land specifically. If exact figures are not available for this county, provide a range based on regional data and note it is a regional estimate. Never fabricate specific numbers.

Sources: For every statistic, price, permit count, or market figure you include in the report, add the corresponding source to the sources array (source_1 through source_8). Include the website URL and the date you accessed it. If a figure comes from a regional estimate rather than county-specific data, note this clearly in the relevant section.

Based on this research, provide:
- A 2-3 sentence executive summary of market conditions
- Risk assessment scores from 1 to 100 for: entitlement difficulty, price variability, supply availability, demand level, and policy uncertainty. Include a color (#10B981 green for low, #F59E0B amber for moderate, #EF4444 red for high) and a display label (Low, Low-Moderate, Moderate, High-Moderate, High).
- A market outlook paragraph (3-4 sentences) synthesizing key findings
- Five specific items for analysts to monitor in the coming months
- A market recommendation using one of: BUY, BUY — Selective, NEUTRAL, CAUTIOUS, or HOLD, with 2-3 sentences of specific actionable guidance
- Eight sources with name, URL, and access date
- Two disclaimer paragraphs (standard real estate research disclaimers)

Return ONLY a valid JSON object. No preamble, no explanation, no markdown formatting. The JSON must match this schema exactly:
${OUTPUT_SCHEMA}`;
}

export async function generateReportData(
  county: string,
  state: string,
  reportMonth: string,
): Promise<ReportData> {
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

    return JSON.parse(jsonStr) as ReportData;

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

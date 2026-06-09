import Anthropic from '@anthropic-ai/sdk';
import type { ReportData } from './report-schema';

const SYSTEM_PROMPT = `You are a professional real estate market research analyst preparing a factual, data-driven county land market report. Your role is to compile publicly available information and present it objectively in the style of an institutional market research document. All analysis must be neutral, factual, and based on publicly available data sources.`;

const OUTPUT_SCHEMA = `{
  "county_name": "string",
  "metro_area": "string",
  "report_period": "string",
  "report_month": "string",
  "median_price_per_acre": "string",
  "median_price_trend": "string",
  "active_listings": "string",
  "active_listings_note": "string",
  "avg_days_on_market": "string",
  "dom_trend_note": "string",
  "closed_sales": "string",
  "closed_sales_note": "string",
  "population": "string",
  "land_area": "string",
  "population_growth": "string",
  "total_households": "string",
  "median_household_income": "string",
  "zoning_authority": "string",
  "executive_summary": "string",
  "comp_1_location": "string",
  "comp_1_acres": "string",
  "comp_1_zoning": "string",
  "comp_1_price": "string",
  "comp_1_price_per_unit": "string",
  "comp_1_date": "string",
  "comp_2_location": "string",
  "comp_2_acres": "string",
  "comp_2_zoning": "string",
  "comp_2_price": "string",
  "comp_2_price_per_unit": "string",
  "comp_2_date": "string",
  "comp_3_location": "string",
  "comp_3_acres": "string",
  "comp_3_zoning": "string",
  "comp_3_price": "string",
  "comp_3_price_per_unit": "string",
  "comp_3_date": "string",
  "comp_4_location": "string",
  "comp_4_acres": "string",
  "comp_4_zoning": "string",
  "comp_4_price": "string",
  "comp_4_price_per_unit": "string",
  "comp_4_date": "string",
  "comp_5_location": "string",
  "comp_5_acres": "string",
  "comp_5_zoning": "string",
  "comp_5_price": "string",
  "comp_5_price_per_unit": "string",
  "comp_5_date": "string",
  "comp_6_location": "string",
  "comp_6_acres": "string",
  "comp_6_zoning": "string",
  "comp_6_price": "string",
  "comp_6_price_per_unit": "string",
  "comp_6_date": "string",
  "rezoning_1_title": "string",
  "rezoning_1_description": "string",
  "rezoning_1_note": "string",
  "rezoning_2_title": "string",
  "rezoning_2_description": "string",
  "rezoning_2_note": "string",
  "rezoning_3_title": "string",
  "rezoning_3_description": "string",
  "rezoning_3_note": "string",
  "permits_residential": "string",
  "permits_commercial": "string",
  "permits_industrial": "string",
  "permits_total_value": "string",
  "infra_1_title": "string",
  "infra_1_detail": "string",
  "infra_2_title": "string",
  "infra_2_detail": "string",
  "board_meeting_date": "string",
  "board_meeting_title": "string",
  "board_meeting_detail": "string",
  "job_1_title": "string",
  "job_1_description": "string",
  "job_1_note": "string",
  "job_2_title": "string",
  "job_2_description": "string",
  "job_2_note": "string",
  "job_3_title": "string",
  "job_3_description": "string",
  "job_3_note": "string",
  "policy_1_title": "string",
  "policy_1_description": "string",
  "policy_1_impact": "string",
  "policy_2_title": "string",
  "policy_2_description": "string",
  "policy_2_impact": "string",
  "incentive_1_label": "string",
  "incentive_1_plain_english": "string",
  "incentive_1_value": "string",
  "incentive_2_label": "string",
  "incentive_2_plain_english": "string",
  "incentive_2_value": "string",
  "incentive_3_label": "string",
  "incentive_3_plain_english": "string",
  "incentive_3_value": "string",
  "incentive_4_label": "string",
  "incentive_4_plain_english": "string",
  "incentive_4_value": "string",
  "comp_county_1_name": "string",
  "comp_county_1_signal": "string",
  "comp_county_2_name": "string",
  "comp_county_2_signal": "string",
  "comp_county_3_name": "string",
  "comp_county_3_signal": "string",
  "comp_county_4_name": "string",
  "comp_county_4_signal": "string",
  "listings_under_1_acre": "string",
  "listings_1_to_5_acres": "string",
  "listings_5_to_20_acres": "string",
  "listings_over_20_acres": "string",
  "price_trend_current": "string",
  "price_trend_prior_month": "string",
  "price_trend_6_months": "string",
  "price_trend_direction": "string",
  "new_listings_this_month": "string",
  "listings_under_contract": "string",
  "zoning_residential_pct": "string",
  "zoning_agricultural_pct": "string",
  "zoning_commercial_pct": "string",
  "zoning_industrial_pct": "string",
  "zoning_mixed_use_pct": "string",
  "risk_1_label": "Entitlement Difficulty",
  "risk_1_pct": "string",
  "risk_1_color": "string",
  "risk_1_display": "string",
  "risk_2_label": "Price Variability",
  "risk_2_pct": "string",
  "risk_2_color": "string",
  "risk_2_display": "string",
  "risk_3_label": "Supply Availability",
  "risk_3_pct": "string",
  "risk_3_color": "string",
  "risk_3_display": "string",
  "risk_4_label": "Demand Level",
  "risk_4_pct": "string",
  "risk_4_color": "string",
  "risk_4_display": "string",
  "risk_5_label": "Policy Uncertainty",
  "risk_5_pct": "string",
  "risk_5_color": "string",
  "risk_5_display": "string",
  "insight_paragraph": "string",
  "watch_1": "string",
  "watch_2": "string",
  "watch_3": "string",
  "watch_4": "string",
  "watch_5": "string",
  "recommendation_signal": "string",
  "recommendation_body": "string",
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
1. Recent vacant land sales in ${county} — find at least 6 comparable sales with location, acreage, zoning, sale price, and date
2. Median price per acre for vacant land parcels
3. Number of active vacant land listings and average days on market
4. Recent rezoning approvals from county planning records — include parcel address, previous zoning, new zoning, acreage, approving body, and date
5. Building permits issued — residential, commercial, and industrial counts and total value
6. Infrastructure projects underway or announced — agency, budget, timeline, and affected area
7. Upcoming planning board or zoning board meetings and agenda items
8. Major employer announcements affecting the county — company, industry, job count, and timeline
9. Pending or recently passed legislation affecting land use or development
10. Local financial incentives available to landowners or developers — explain each in plain English
11. Population, income, and employment data from public sources
12. Comparable neighboring counties and their growth indicators
13. Active listing count broken down by acreage range
14. Price per acre trend compared to prior month and six months ago
15. Land use breakdown by zoning category as a percentage

Based on this research, provide:
- A 2 to 3 sentence executive summary of market conditions
- Risk assessment scores from 1 to 100 for: entitlement difficulty, price variability, supply availability, demand level, and election-related policy uncertainty
- A market outlook paragraph summarizing key findings
- Five specific items for analysts to monitor in the coming months
- A market assessment conclusion using one of these ratings: Favorable, Neutral, or Cautious

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
      max_tokens: 12000,
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
        max_tokens: 12000,
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

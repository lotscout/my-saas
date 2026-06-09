import Anthropic from '@anthropic-ai/sdk';
import type { ReportData } from './report-schema';
import { reportSchemaExample } from './report-schema';

export async function generateReportData(
  county: string,
  state: string,
  reportMonth: string,
): Promise<ReportData> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a land market intelligence analyst. Research and generate a complete 7-page land market report for ${county}, ${state} for ${reportMonth}.

Search for real, current data on:
1. Vacant land sale prices per acre in ${county}, ${state} — find at least 6 recent comparable sales with location, acreage, zoning, price, and date. For parcels under 0.25 acres show price per sq ft in price_display. For 0.25 acres and above show price per acre in price_display.
2. Active land listings count, days on market, and closed sales — broken down by acreage range (under 1 acre, 1-5 acres, 5-20 acres, over 20 acres)
3. Price trends: current median $/acre, prior month median $/acre, and 6-months-ago median $/acre
4. Market velocity: new listings this month, listings under contract
5. Land use snapshot: percentage of active listings by zoning type (residential, agricultural, commercial, industrial, mixed use) — percentages must sum to 100
6. Recent rezoning approvals in the last 60 days — include parcel address, previous zoning code, new zoning code, acreage, approving body, date approved, and one sentence on investor impact
7. Building permits issued (residential count, commercial count, aggregate value, average sq ft)
8. Infrastructure projects — include agency, budget, timeline, affected area, and development impact
9. Upcoming zoning board meetings with dates and agenda items affecting land development
10. Major employer changes (company name, industry, job count, role types, timeline, direct impact on land demand)
11. Elections and policy changes affecting land development (specific candidates, bills, proposals)
12. Local incentives (TIF, opportunity zones, enterprise zones) — include zone name, specific benefit value, expiration date, and plain English explanation
13. Comparable counties with growth signals and one sentence on why each is relevant
14. Population, income, unemployment rate from Census and BLS
15. Write a 2-3 sentence executive summary of the key investment takeaway for this county this month
16. Risk assessment: score each of 5 risk factors (Entitlement Risk, Price Volatility, Supply Pressure, Demand Strength, Election Risk) as a percentage 0-100. For Demand Strength, higher is better. For all others, lower is better.
17. Write a full AI insight paragraph (4-6 sentences) analyzing the investment thesis
18. List 5 specific things to watch in the next 60-90 days
19. Provide a recommendation signal (BUY, HOLD, or WAIT) with a full paragraph explaining the reasoning and specific parcel characteristics to target or avoid

Return ONLY a valid JSON object matching this exact schema. No preamble, no markdown fences, no backticks. Every field must be populated with real researched data. No double hyphens (--) in any string value. All monetary values must include $ sign. All percentages must include % sign. risk_N_pct values must be plain numbers like "65" with no % sign. zoning_*_pct values must be plain numbers that sum to 100.

Schema:
${JSON.stringify(reportSchemaExample, null, 2)}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [{ type: 'web_search_20250305', name: 'web_search' }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: 'user', content: prompt }];

  let response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 12000,
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
}

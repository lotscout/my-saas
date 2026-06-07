import Anthropic from '@anthropic-ai/sdk';
import type { ReportData } from './report-schema';
import { reportSchemaExample } from './report-schema';

export async function generateReportData(
  county: string,
  state: string,
  reportMonth: string,
): Promise<ReportData> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a land market intelligence analyst. Research and generate a complete land market report for ${county}, ${state} for ${reportMonth}.

Search for real, current data on:
1. Land sale prices per acre in ${county}, ${state}
2. Active land listings count and days on market
3. Recent rezoning approvals in the last 60 days
4. Building permits issued
5. Infrastructure projects underway or announced
6. Major employer announcements or job market data
7. Upcoming elections that could affect land development policy
8. Local incentives, opportunity zones, TIF districts
9. Comparable counties with growth signals
10. Population, income, and unemployment data from Census and BLS

Return ONLY a valid JSON object matching this exact schema. No preamble, no markdown fences, no backticks. Every field must be populated with real researched data. No double hyphens in any string value. All monetary values must include $ sign. All percentages must include % sign.

Schema:
${JSON.stringify(reportSchemaExample, null, 2)}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [{ type: 'web_search_20250305', name: 'web_search' }];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: 'user', content: prompt }];

  let response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8000,
    tools,
    messages,
  });

  // Agentic loop — handles tool_use stop reason if needed
  let iterations = 0;
  while (response.stop_reason === 'tool_use' && iterations < 8) {
    iterations++;
    messages.push({ role: 'assistant', content: response.content });

    // Build tool_result blocks for any tool_use blocks in the response
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
      max_tokens: 8000,
      tools,
      messages,
    });
  }

  // Extract text from the final response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textBlocks = (response.content as any[]).filter((b: any) => b.type === 'text');
  const rawText = textBlocks.map((b: any) => b.text).join('');

  // Strip any markdown fences the model might have added
  let jsonStr = rawText.trim();
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();

  // Pull out the JSON object if there's any surrounding text
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (match) jsonStr = match[0];

  const data = JSON.parse(jsonStr) as ReportData;
  return data;
}

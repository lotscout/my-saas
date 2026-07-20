import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT =
  'You are a professional real estate market research analyst writing a factual monthly market summary using neutral, analytical language.';

export interface GeneratedMarketUpdate {
  month: string;
  year: number;
  title: string;
  preview: string;
  full_content: string;
}

function buildUserPrompt(month: string, year: number): string {
  return `Write a monthly US vacant land market update for ${month} ${year}. Cover national land price trends, regional demand differences, notable market shifts, how current interest rates affect land buyers, and emerging opportunities. Write 4 to 6 clear paragraphs in a professional but readable tone. Use neutral, factual, research-oriented language. Base it on current publicly available data. Return ONLY valid JSON with two fields: preview (just the first paragraph, 2 to 3 sentences) and full_content (all paragraphs separated by double newlines). No markdown, no preamble.`;
}

// Generates a monthly market update via the Anthropic API with web search enabled.
// `now` is injected so callers (route / script) control the month/year deterministically.
export async function generateMarketUpdate(now: Date): Promise<GeneratedMarketUpdate> {
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [{ type: 'web_search_20250305', name: 'web_search' }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: 'user', content: buildUserPrompt(month, year) }];

  let response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8000,
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
      .map((block: any) => ({ type: 'tool_result', tool_use_id: block.id, content: block.content ?? '' }));

    if (toolResults.length > 0) messages.push({ role: 'user', content: toolResults });

    response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawText = (response.content as any[])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');

  let jsonStr = rawText.trim().replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (match) jsonStr = match[0];

  const parsed = JSON.parse(jsonStr) as { preview?: string; full_content?: string };
  if (!parsed.preview || !parsed.full_content) {
    throw new Error('Model response missing preview or full_content');
  }

  return {
    month,
    year,
    title: `${month} ${year} Land Market Update`,
    preview: parsed.preview,
    full_content: parsed.full_content,
  };
}

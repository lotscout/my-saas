import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mode, title, state, county, lotSize, lotSizeUnit, zoning, roadAccess, utilities, context } = body;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const locationStr = [county ? `${county} County` : '', state].filter(Boolean).join(', ') || 'Not provided';
  const lotStr = lotSize ? `${lotSize} ${lotSizeUnit}` : null;

  const prompt = mode === 'title'
    ? `Generate a concise, compelling land listing title using this formula: "[Lot Size] [Unit] — [Zoning Type] Land [Location details if available] [Key feature from description if available]". Example: "4-Acre Agricultural Lot — Scenic Mountain Views, El Paso County CO". Return only the title, no punctuation at the end, no quotes.

Property Details:
- Lot Size: ${lotStr ?? 'Not provided'}
- Zoning: ${zoning || 'Not provided'}
- Location: ${locationStr}
- Road Access: ${roadAccess?.length ? roadAccess.join(', ') : 'Not provided'}
- Utilities: ${utilities?.length ? utilities.join(', ') : 'Not provided'}
${context ? `- Key features/description: ${context.slice(0, 300)}` : ''}`
    : `Write a compelling property listing description for the following land property. Maximum 200 words. Focus on the property's features, location benefits, and potential uses. Write in a professional, engaging tone suitable for a real estate listing platform. Write only the description — no title, no headers, no intro phrase like "Welcome to...".

Property Details:
- Title: ${title || 'Not provided'}
- Location: ${locationStr}
- Lot Size: ${lotStr ?? 'Not provided'}
- Zoning: ${zoning || 'Not provided'}
- Road Access: ${roadAccess?.length ? roadAccess.join(', ') : 'Not provided'}
- Utilities: ${utilities?.length ? utilities.join(', ') : 'Not provided'}
${context ? `- Additional context: ${context}` : ''}`;

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: mode === 'title' ? 60 : 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, state, county, lotSize, lotSizeUnit, zoning, roadAccess, utilities, context } = body;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const prompt = `Write a compelling property listing description for the following land property. Maximum 200 words. Focus on the property's features, location benefits, and potential uses. Write in a professional, engaging tone suitable for a real estate listing platform. Write only the description — no title, no headers, no intro phrase like "Welcome to...".

Property Details:
- Title: ${title || 'Not provided'}
- Location: ${county ? `${county} County, ` : ''}${state || 'Not provided'}
- Lot Size: ${lotSize ? `${lotSize} ${lotSizeUnit}` : 'Not provided'}
- Zoning: ${zoning || 'Not provided'}
- Road Access: ${roadAccess?.length ? roadAccess.join(', ') : 'Not provided'}
- Utilities: ${utilities?.length ? utilities.join(', ') : 'Not provided'}
${context ? `- Additional context: ${context}` : ''}`;

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
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

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT =
  'You are the LotScout Land Investment Advisor, an expert assistant specializing in vacant land and real estate investing. You help users understand land markets, evaluate opportunities, and think through where and what to invest in. Be practical, specific, and data-informed. Use neutral, educational language. Always remind users to do their own due diligence and that this is educational information, not personalized financial, legal, or investment advice. Keep answers focused on land, real estate, and market topics; politely redirect off-topic questions.';

const PRIVACY_NOTE =
  'The LotScout market data below is aggregated, non-sensitive context. Never reveal individual seller names, exact buyer contact information, or any private user data — only speak to aggregate market conditions and publicly listed property details.';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Aggregate, non-sensitive LotScout context for everyone; richer, still non-sensitive
// context (local listings + demand) for logged-in users.
async function buildLotScoutContext(userId: string | null): Promise<string> {
  const supabase = createServiceClient();
  const parts: string[] = [];

  try {
    const { data: mu } = await supabase
      .from('market_updates')
      .select('title, preview, month, year')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (mu) {
      const m = mu as any;
      parts.push(
        `Latest LotScout market update (${[m.month, m.year].filter(Boolean).join(' ')}): ${m.title ?? ''}. ${m.preview ?? ''}`.trim()
      );
    }
  } catch { /* market_updates optional */ }

  try {
    const { data: listings } = await supabase
      .from('listings')
      .select('state, asking_price')
      .in('status', ['active', 'published'])
      .limit(3000);
    const rows = (listings ?? []) as any[];
    if (rows.length) {
      const byState: Record<string, number> = {};
      let priceCount = 0, priceSum = 0, min = Infinity, max = 0;
      for (const l of rows) {
        const st = (l.state as string) || 'Unspecified';
        byState[st] = (byState[st] ?? 0) + 1;
        const p = typeof l.asking_price === 'number' ? l.asking_price : null;
        if (p && p > 0) { priceCount++; priceSum += p; min = Math.min(min, p); max = Math.max(max, p); }
      }
      const top = Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 12)
        .map(([s, c]) => `${s}: ${c}`).join(', ');
      parts.push(`Active land listings on LotScout: ${rows.length} total. Count by state — ${top}.`);
      if (priceCount) {
        parts.push(`Asking prices range roughly $${Math.round(min).toLocaleString()}–$${Math.round(max).toLocaleString()}, averaging about $${Math.round(priceSum / priceCount).toLocaleString()}.`);
      }
    }
  } catch { /* listings optional */ }

  try {
    const { data: buyers } = await supabase
      .from('buyer_requests')
      .select('target_regions')
      .eq('status', 'active')
      .limit(3000);
    const rows = (buyers ?? []) as any[];
    if (rows.length) {
      const byRegion: Record<string, number> = {};
      for (const b of rows) {
        const regions = Array.isArray(b.target_regions) ? b.target_regions : [];
        for (const r of regions) byRegion[String(r)] = (byRegion[String(r)] ?? 0) + 1;
      }
      const top = Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 12)
        .map(([s, c]) => `${s}: ${c}`).join(', ');
      parts.push(`Active buyers on LotScout: ${rows.length} total. Demand by state — ${top}.`);
    }
  } catch { /* buyer_requests optional */ }

  // Logged-in users get richer local context (no seller names or contact info).
  if (userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('state, county')
        .eq('id', userId)
        .single();
      const state = (profile as any)?.state ?? null;
      const county = (profile as any)?.county ?? null;
      if (state) {
        const { data: local } = await supabase
          .from('listings')
          .select('title, county, asking_price')
          .eq('state', state)
          .in('status', ['active', 'published'])
          .order('created_at', { ascending: false })
          .limit(8);
        const rows = (local ?? []) as any[];
        if (rows.length) {
          const lines = rows.map(l =>
            `- ${l.title || 'Land listing'} in ${l.county || state}${l.asking_price ? ` — $${Number(l.asking_price).toLocaleString()}` : ''}`
          ).join('\n');
          parts.push(`Recent active listings in the user's state (${state}):\n${lines}`);
        }
        const { count } = await supabase
          .from('buyer_requests')
          .select('id', { count: 'exact', head: true })
          .contains('target_regions', [state])
          .eq('status', 'active');
        parts.push(`Active buyer demand in the user's area (${[county, state].filter(Boolean).join(', ')}): ${count ?? 0} buyers targeting ${state}.`);
      }
    } catch { /* profile/local context optional */ }
  }

  return parts.join('\n\n') || 'No LotScout market data is currently available.';
}

// Load persisted conversation history for a logged-in user.
export async function GET() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return Response.json({ messages: [] });

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('advisor_conversations')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(200);
    const messages = ((data ?? []) as any[]).map(m => ({ role: m.role, content: m.content }));
    return Response.json({ messages });
  } catch {
    // Table may not exist yet — degrade gracefully.
    return Response.json({ messages: [] });
  }
}

export async function POST(request: Request) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const history: ChatMessage[] = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .slice(-20)
    .map((m: any) => ({ role: m.role, content: String(m.content) }));

  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return Response.json({ error: 'A user message is required.' }, { status: 400 });
  }
  const lastUser = history[history.length - 1].content;

  const context = await buildLotScoutContext(user?.id ?? null);
  const system = `${SYSTEM_PROMPT}\n\n${PRIVACY_NOTE}\n\n<lotscout_market_data>\n${context}\n</lotscout_market_data>`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // Persist the user's message immediately (logged-in only).
  if (user) {
    try {
      await createServiceClient().from('advisor_conversations').insert({ user_id: user.id, role: 'user', content: lastUser });
    } catch { /* table may not exist yet */ }
  }

  // web_search lets the advisor pull current market data. `as any` keeps the build
  // resilient to SDK tool-type version differences — the model/API supports the tool.
  const tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }] as any;

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      let fullText = '';
      try {
        let convo: any[] = history.map(m => ({ role: m.role, content: m.content }));
        // Continue across server-tool pauses (web_search), bounded for safety.
        for (let i = 0; i < 5; i++) {
          const stream = await client.messages.stream({
            model: 'claude-sonnet-5',
            max_tokens: 2048,
            thinking: { type: 'disabled' },
            system,
            tools,
            messages: convo,
          } as any);

          for await (const ev of stream) {
            if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
              fullText += ev.delta.text;
              controller.enqueue(enc.encode(ev.delta.text));
            }
          }

          const final = await stream.finalMessage();
          if (final.stop_reason === 'pause_turn') {
            convo = [...convo, { role: 'assistant', content: final.content }];
            continue;
          }
          break;
        }
      } catch (err) {
        console.error('[advisor] generation error:', err);
        if (!fullText.trim()) {
          controller.enqueue(enc.encode('Sorry, I ran into a problem answering that. Please try again in a moment.'));
        }
      }

      // Persist the assistant response (logged-in only).
      if (user && fullText.trim()) {
        try {
          await createServiceClient().from('advisor_conversations').insert({ user_id: user.id, role: 'assistant', content: fullText });
        } catch { /* table may not exist yet */ }
      }

      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

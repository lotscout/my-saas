import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GUEST_LIMIT = 3;          // total questions for logged-out guests
const FREE_DAILY_LIMIT = 5;     // questions per calendar day for free accounts
const GUEST_COOKIE = 'ls_guest_searches';
const PAID_TIERS = new Set(['standard', 'priority', 'exclusive']);

const SYSTEM_PROMPT =
  'You are the LotScout Land Investment Advisor, an expert assistant specializing in vacant land and real estate investing. You help users understand land markets, evaluate opportunities, and think through where and what to invest in. Be practical, specific, and data-informed. Use neutral, educational language. Always remind users to do their own due diligence and that this is educational information, not personalized financial, legal, or investment advice. Keep answers focused on land, real estate, and market topics; politely redirect off-topic questions.';

const PRIVACY_NOTE =
  'The LotScout market data below is aggregated, non-sensitive context. Never reveal individual seller names, exact buyer contact information, or any private user data — only speak to aggregate market conditions and publicly listed property details.';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Access {
  status: 'guest' | 'free' | 'pro';
  unlimited: boolean;
  canSave: boolean;
}

// Unlimited access = admin, standalone Search Pro, or any active LotScout paid plan.
async function getUserAccess(userId: string): Promise<Access> {
  const supabase = createServiceClient();
  let isAdmin = false, hasPro = false;

  const r1 = await supabase.from('profiles').select('is_admin, has_search_pro').eq('id', userId).single();
  if (!r1.error && r1.data) {
    isAdmin = !!(r1.data as any).is_admin;
    hasPro = !!(r1.data as any).has_search_pro;
  } else {
    // has_search_pro column may not exist yet — fall back to just is_admin.
    const r2 = await supabase.from('profiles').select('is_admin').eq('id', userId).single();
    isAdmin = !!(r2.data as any)?.is_admin;
  }

  if (isAdmin || hasPro) return { status: 'pro', unlimited: true, canSave: true };

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .maybeSingle();
  if (sub && (sub as any).status === 'active' && PAID_TIERS.has((sub as any).tier)) {
    return { status: 'pro', unlimited: true, canSave: true };
  }

  return { status: 'free', unlimited: false, canSave: false };
}

async function getFreeUsedToday(userId: string): Promise<number> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('search_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('usage_date', today())
      .maybeSingle();
    return (data as any)?.count ?? 0;
  } catch {
    return 0; // table may not exist yet — don't hard-block
  }
}

async function incrementFree(userId: string, current: number): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase
      .from('search_usage')
      .upsert({ user_id: userId, usage_date: today(), count: current + 1 }, { onConflict: 'user_id,usage_date' });
  } catch { /* table may not exist yet */ }
}

function guestCount(request: NextRequest): number {
  const raw = request.cookies.get(GUEST_COOKIE)?.value;
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function guestCookie(n: number): string {
  return `${GUEST_COOKIE}=${n}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
}

// Aggregate, non-sensitive LotScout context for everyone; richer (still non-sensitive)
// context for logged-in users.
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
      parts.push(`Latest LotScout market update (${[m.month, m.year].filter(Boolean).join(' ')}): ${m.title ?? ''}. ${m.preview ?? ''}`.trim());
    }
  } catch { /* optional */ }

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
      const top = Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([s, c]) => `${s}: ${c}`).join(', ');
      parts.push(`Active land listings on LotScout: ${rows.length} total. Count by state — ${top}.`);
      if (priceCount) parts.push(`Asking prices range roughly $${Math.round(min).toLocaleString()}–$${Math.round(max).toLocaleString()}, averaging about $${Math.round(priceSum / priceCount).toLocaleString()}.`);
    }
  } catch { /* optional */ }

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
      const top = Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([s, c]) => `${s}: ${c}`).join(', ');
      parts.push(`Active buyers on LotScout: ${rows.length} total. Demand by state — ${top}.`);
    }
  } catch { /* optional */ }

  if (userId) {
    try {
      const { data: profile } = await supabase.from('profiles').select('state, county').eq('id', userId).single();
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
          const lines = rows.map(l => `- ${l.title || 'Land listing'} in ${l.county || state}${l.asking_price ? ` — $${Number(l.asking_price).toLocaleString()}` : ''}`).join('\n');
          parts.push(`Recent active listings in the user's state (${state}):\n${lines}`);
        }
        const { count } = await supabase
          .from('buyer_requests')
          .select('id', { count: 'exact', head: true })
          .contains('target_regions', [state])
          .eq('status', 'active');
        parts.push(`Active buyer demand in the user's area (${[county, state].filter(Boolean).join(', ')}): ${count ?? 0} buyers targeting ${state}.`);
      }
    } catch { /* optional */ }
  }

  return parts.join('\n\n') || 'No LotScout market data is currently available.';
}

// Access status + persisted history for the client to render.
export async function GET(request: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();

  if (!user) {
    const used = guestCount(request);
    return Response.json({
      messages: [],
      access: { status: 'guest', unlimited: false, remaining: Math.max(0, GUEST_LIMIT - used), limit: GUEST_LIMIT, canSave: false },
    });
  }

  const access = await getUserAccess(user.id);

  let messages: any[] = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('advisor_conversations')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(200);
    messages = ((data ?? []) as any[]).map(m => ({ role: m.role, content: m.content }));
  } catch { /* table may not exist yet */ }

  let remaining: number | null = null, limit: number | null = null;
  if (!access.unlimited) {
    const used = await getFreeUsedToday(user.id);
    limit = FREE_DAILY_LIMIT;
    remaining = Math.max(0, FREE_DAILY_LIMIT - used);
  }

  return Response.json({ messages, access: { ...access, remaining, limit } });
}

export async function POST(request: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  // --- Save a report (Search Pro / paid only) ---
  if (body?.action === 'save') {
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const access = await getUserAccess(user.id);
    if (!access.canSave) return Response.json({ error: 'Upgrade to Search Pro to save reports.' }, { status: 403 });
    const content = String(body.content ?? '').trim().slice(0, 20000);
    if (!content) return Response.json({ error: 'Nothing to save' }, { status: 400 });
    try {
      await createServiceClient().from('saved_reports').insert({ user_id: user.id, content });
    } catch {
      return Response.json({ error: 'Could not save report (saved_reports table may not exist yet).' }, { status: 500 });
    }
    return Response.json({ ok: true });
  }

  // --- Chat ---
  const history = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .slice(-20)
    .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }));

  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return Response.json({ error: 'A user message is required.' }, { status: 400 });
  }
  const lastUser = history[history.length - 1].content;

  // --- Enforce access limits BEFORE calling the model ---
  let statusLabel: Access['status'] = 'guest';
  let unlimited = false;
  let canSave = false;
  let remainingAfter: number | null = null;
  let setCookie: string | null = null;

  if (user) {
    const access = await getUserAccess(user.id);
    statusLabel = access.status;
    unlimited = access.unlimited;
    canSave = access.canSave;
    if (!unlimited) {
      const used = await getFreeUsedToday(user.id);
      if (used >= FREE_DAILY_LIMIT) {
        return Response.json(
          { error: "You have reached today's free limit. Upgrade to Search Pro for unlimited questions and saved reports.", reason: 'free_limit' },
          { status: 429 }
        );
      }
      await incrementFree(user.id, used);
      remainingAfter = Math.max(0, FREE_DAILY_LIMIT - (used + 1));
    }
  } else {
    const used = guestCount(request);
    if (used >= GUEST_LIMIT) {
      return Response.json(
        { error: 'You have reached the guest limit. Sign up free to continue.', reason: 'guest_limit' },
        { status: 429 }
      );
    }
    const next = used + 1;
    setCookie = guestCookie(next);
    remainingAfter = Math.max(0, GUEST_LIMIT - next);
  }

  const context = await buildLotScoutContext(user?.id ?? null);
  const system = `${SYSTEM_PROMPT}\n\n${PRIVACY_NOTE}\n\n<lotscout_market_data>\n${context}\n</lotscout_market_data>`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // Persist the user's message for conversation history (logged-in only).
  if (user) {
    try {
      await createServiceClient().from('advisor_conversations').insert({ user_id: user.id, role: 'user', content: lastUser });
    } catch { /* table may not exist yet */ }
  }

  const tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }] as any;

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      let fullText = '';
      try {
        let convo: any[] = history.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));
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

      if (user && fullText.trim()) {
        try {
          await createServiceClient().from('advisor_conversations').insert({ user_id: user.id, role: 'assistant', content: fullText });
        } catch { /* table may not exist yet */ }
      }

      controller.close();
    },
  });

  const headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Advisor-Status': statusLabel,
    'X-Advisor-Unlimited': unlimited ? 'true' : 'false',
    'X-Advisor-Can-Save': canSave ? 'true' : 'false',
  };
  if (remainingAfter !== null) headers['X-Advisor-Remaining'] = String(remainingAfter);
  if (setCookie) headers['Set-Cookie'] = setCookie;

  return new Response(readable, { headers });
}

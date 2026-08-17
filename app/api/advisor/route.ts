import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
// Web search + analysis + streaming can exceed 60s; 300s is the Vercel Pro ceiling.
export const maxDuration = 300;

const GUEST_LIMIT = 3;          // total questions for logged-out guests
const FREE_DAILY_LIMIT = 5;     // questions per calendar day for free accounts
const GUEST_COOKIE = 'ls_guest_searches';
const PAID_TIERS = new Set(['standard', 'priority', 'exclusive']);

const SYSTEM_PROMPT =
  'You are Scout Search, LotScout\'s land intelligence and real estate advisor tool. You help builders, developers, land acquisition teams, investors, realtors, buyers, sellers, and landowners with real estate questions, including off-market land, market trends, zoning and policy changes, pricing, where and what to invest in, buying and selling strategy, financing, development, residential, and commercial real estate. If the user asks who you are, what your name is, or what Scout Search is, say you are Scout Search, LotScout\'s land intelligence tool for researching markets, acquisitions, zoning, policy changes, and land opportunities faster. Give practical, specific, current guidance. Provide market updates and make clear recommendations when asked. Keep responses short and conversational, usually 2 to 4 short paragraphs. For broad questions, ask one or two clarifying questions first before giving detailed guidance. Use neutral, educational framing and include a brief one line reminder that this is educational information and not personalized financial, legal, or investment advice, only when giving specific guidance. Never use em dashes. If a question is outside your reliable knowledge or needs authoritative or local data you do not have, say so honestly and point the user to reliable sources such as a licensed local agent, appraiser, attorney, lender, county records, or established sites like the MLS, county assessor, or reputable market data providers. Stay focused on real estate topics and politely redirect clearly unrelated questions. When a user asks for a market update, market analysis, or current conditions for any city, county, metro, or region, use web search to gather real current data: median home or land prices, price trends, inventory levels, days on market, recent sales activity, new construction, population and job growth, and notable local market news. Do not limit yourself to LotScout internal listings. Combine web-sourced market data with any relevant LotScout listing data to give a complete, specific market analysis for the exact area requested. If the user asks about a city like Denver, give Denver-specific data, not just statewide. Never refuse a market analysis by saying you only have statewide or limited data. Use web search to find the specific local data requested. If after searching some specific figure is genuinely unavailable, note that briefly and provide everything else you did find. When giving a market update, structure it with short bold section headers such as Price Trends, Inventory and Demand, Notable Activity, and a short Outlook or Takeaway. Keep each section tight and readable, and cite the general sources or timeframes where relevant. After delivering a market analysis, end by asking if the user would like to save it as a report. A direct request such as give me a market update for Denver is specific enough to answer directly with web search and does not need a clarifying question first.';

const PRIVACY_NOTE =
  'The LotScout market data below is aggregated, non-sensitive context. Never reveal individual seller names, exact buyer contact information, or any private user data — only speak to aggregate market conditions and publicly listed property details.';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Robustly pull the final answer text out of a message: join all text blocks rather
// than assuming content[0] (web search adds server_tool_use / tool_result blocks).
function extractText(msg: any): string {
  try {
    const blocks = Array.isArray(msg?.content) ? msg.content : [];
    return blocks
      .filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
      .map((b: any) => b.text)
      .join('');
  } catch {
    return '';
  }
}

function buildFallbackReport(history: { role: 'user' | 'assistant'; content: string }[]): string {
  const userQuestions = history.filter(m => m.role === 'user').map(m => m.content.trim()).filter(Boolean);
  const assistantAnswers = history.filter(m => m.role === 'assistant').map(m => m.content.trim()).filter(Boolean);
  const titleSeed = userQuestions[0] || 'Scout conversation';
  const latestAnswer = assistantAnswers.at(-1) || '';
  return [
    `# Scout Report: ${titleSeed.slice(0, 80)}`,
    '',
    '## Summary',
    latestAnswer || 'This report summarizes the Scout conversation and key real estate considerations discussed.',
    '',
    '## Questions Covered',
    ...userQuestions.map(q => `- ${q}`),
  ].join('\n');
}

async function summarizeConversationAsReport(history: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const transcript = history
    .map(m => `${m.role === 'user' ? 'User' : 'Scout'}: ${m.content.trim()}`)
    .join('\n\n')
    .slice(0, 30000);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1400,
    temperature: 0.2,
    system: 'You turn Scout real estate chat transcripts into concise saved reports. Summarize the whole conversation, not just the final answer. Do not include raw chat formatting. Keep it practical, polished, and easy to scan. Use short markdown sections. Never use em dashes.',
    messages: [{
      role: 'user',
      content: `Create a saved LotScout report from this full Scout conversation. Include: a clear title, executive summary, key takeaways, market/property considerations, recommended next steps, and any caveats or data limitations mentioned.\n\n${transcript}`,
    }],
  });
  const report = extractText(msg).trim();
  return report || buildFallbackReport(history);
}

// Classify an error into a non-sensitive category for logs and debugging output.
function classifyError(err: unknown): string {
  const anyErr = err as any;
  const status = anyErr?.status ?? anyErr?.statusCode;
  const msg = String(anyErr?.message ?? anyErr ?? '').toLowerCase();
  if (status === 401 || /api key|unauthor|authentication/.test(msg)) return 'auth';
  if (status === 429 || /rate limit|overloaded/.test(msg)) return 'rate_limit';
  if (/timeout|timed out|etimedout|aborted|aborterror/.test(msg)) return 'timeout';
  if (/tool|web_search|web search/.test(msg)) return 'tool';
  if (status === 404 || /model|not found/.test(msg)) return 'model';
  if (typeof status === 'number') return `api_${status}`;
  return 'unknown';
}

interface Access {
  status: 'guest' | 'free' | 'pro';
  unlimited: boolean;
  canSave: boolean;
}

// Unlimited access = admin, standalone Scout Pro, or any active LotScout paid plan.
async function getUserAccess(userId: string): Promise<Access> {
  const supabase = createServiceClient();
  let isAdmin = false, hasPro = false, profileTier: string | null = null;

  const r1 = await supabase.from('profiles').select('is_admin, has_search_pro, subscription_tier').eq('id', userId).single();
  if (!r1.error && r1.data) {
    isAdmin = !!(r1.data as any).is_admin;
    hasPro = !!(r1.data as any).has_search_pro;
    profileTier = (r1.data as any).subscription_tier ?? null;
  } else {
    // Optional columns may not exist yet — fall back to the stable fields.
    const r2 = await supabase.from('profiles').select('is_admin, subscription_tier').eq('id', userId).single();
    isAdmin = !!(r2.data as any)?.is_admin;
    profileTier = (r2.data as any)?.subscription_tier ?? null;
  }

  if (isAdmin || hasPro || PAID_TIERS.has(profileTier ?? '')) return { status: 'pro', unlimited: true, canSave: true };

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

async function insertMessage(userId: string, role: string, content: string, conversationId: string | null) {
  const svc = createServiceClient();
  try {
    const payload: Record<string, any> = { user_id: userId, role, content };
    if (conversationId) payload.conversation_id = conversationId;
    const { error } = await svc.from('advisor_conversations').insert(payload);
    if (error && conversationId) {
      // conversation_id column may not exist yet — retry without it so history still persists.
      await svc.from('advisor_conversations').insert({ user_id: userId, role, content });
    }
  } catch { /* table may not exist yet */ }
}

// Access status + persisted history (grouped into conversations) for the client to render.
export async function GET(request: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();

  if (!user) {
    const used = guestCount(request);
    return Response.json({
      conversations: [],
      access: { status: 'guest', unlimited: false, remaining: Math.max(0, GUEST_LIMIT - used), limit: GUEST_LIMIT, canSave: false },
    });
  }

  const access = await getUserAccess(user.id);

  let conversations: any[] = [];
  try {
    const supabase = createServiceClient();
    let rows: any[] = [];
    const r = await supabase
      .from('advisor_conversations')
      .select('role, content, created_at, conversation_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1000);
    if (r.error) {
      // conversation_id column may not exist yet — fall back to one group.
      const r2 = await supabase
        .from('advisor_conversations')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1000);
      rows = ((r2.data ?? []) as any[]).map(m => ({ ...m, conversation_id: null }));
    } else {
      rows = (r.data ?? []) as any[];
    }
    const groups = new Map<string, { messages: any[]; updated: string }>();
    for (const row of rows) {
      const cid = (row.conversation_id as string) || 'legacy';
      if (!groups.has(cid)) groups.set(cid, { messages: [], updated: row.created_at });
      const g = groups.get(cid)!;
      g.messages.push({ role: row.role, content: row.content });
      g.updated = row.created_at;
    }
    conversations = [...groups.entries()].map(([id, g]) => ({
      id,
      title: (g.messages.find(m => m.role === 'user')?.content ?? 'New chat').slice(0, 80),
      messages: g.messages,
      updatedAt: g.updated,
    })).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch { /* table may not exist yet */ }

  let remaining: number | null = null, limit: number | null = null;
  if (!access.unlimited) {
    const used = await getFreeUsedToday(user.id);
    limit = FREE_DAILY_LIMIT;
    remaining = Math.max(0, FREE_DAILY_LIMIT - used);
  }

  return Response.json({ conversations, access: { ...access, remaining, limit } });
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

  // --- Save a report (Scout Pro / paid only) ---
  if (body?.action === 'save') {
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const access = await getUserAccess(user.id);
    if (!access.canSave) return Response.json({ error: 'Upgrade to any LotScout plan to save reports.' }, { status: 403 });
    const saveHistory = Array.isArray(body?.messages)
      ? body.messages
          .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
          .slice(-30)
          .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content).slice(0, 8000) }))
      : [];
    let content = '';
    if (saveHistory.length > 0) {
      try {
        content = (await summarizeConversationAsReport(saveHistory)).trim().slice(0, 20000);
      } catch (err) {
        console.error('[advisor] report summary error:', err instanceof Error ? err.message : err);
        content = buildFallbackReport(saveHistory).slice(0, 20000);
      }
    } else {
      content = String(body.content ?? '').trim().slice(0, 20000);
    }
    if (!content) return Response.json({ error: 'Nothing to save' }, { status: 400 });
    try {
      await createServiceClient().from('saved_reports').insert({ user_id: user.id, content });
    } catch {
      return Response.json({ error: 'Could not save report (saved_reports table may not exist yet).' }, { status: 500 });
    }
    return Response.json({ ok: true, content });
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
  const conversationId = typeof body.conversationId === 'string' && body.conversationId ? body.conversationId : null;

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
          { error: "You have reached today's free limit. Upgrade to any LotScout plan for unlimited Scout and saved reports.", reason: 'free_limit' },
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

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[advisor] Missing ANTHROPIC_API_KEY env var');
    return Response.json({ error: 'Search is not configured on the server.', type: 'config' }, { status: 500 });
  }

  // Context is best-effort — a Supabase hiccup must not crash the whole answer.
  let context = 'No LotScout market data is currently available.';
  try {
    context = await buildLotScoutContext(user?.id ?? null);
  } catch (err) {
    console.error('[advisor] context build error (non-fatal):', err);
  }
  const system = `${SYSTEM_PROMPT}\n\n${PRIVACY_NOTE}\n\n<lotscout_market_data>\n${context}\n</lotscout_market_data>`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Persist the user's message for conversation history (logged-in only).
  if (user) {
    await insertMessage(user.id, 'user', lastUser, conversationId);
  }

  // web_search server tool (Sonnet 5 supports the _20260209 variant). Passed via `as any`
  // to stay resilient to SDK tool-type version differences.
  const tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }] as any;

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      let fullText = '';
      let lastErr: unknown = null;
      const stripDashes = (s: string) => s.replace(/\s*[—–―]\s*/g, ', ');

      // One full completion, looping over server-tool pauses. Streams text as it
      // arrives; if no deltas were emitted, extracts text blocks from the final
      // message (robust to text / tool_use / tool_result content blocks).
      const attempt = async (useTools: boolean) => {
        let convo: any[] = history.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));
        for (let i = 0; i < 5; i++) {
          const stream = await client.messages.stream({
            model: 'claude-sonnet-5',
            max_tokens: 2048,
            thinking: { type: 'disabled' },
            system,
            ...(useTools ? { tools } : {}),
            messages: convo,
          } as any);

          for await (const ev of stream) {
            if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
              const clean = stripDashes(ev.delta.text);
              fullText += clean;
              controller.enqueue(enc.encode(clean));
            }
          }

          const final = await stream.finalMessage();
          if (final.stop_reason === 'pause_turn') {
            convo = [...convo, { role: 'assistant', content: final.content }];
            continue;
          }
          if (!fullText.trim()) {
            const txt = extractText(final);
            if (txt) { const clean = stripDashes(txt); fullText += clean; controller.enqueue(enc.encode(clean)); }
          }
          break;
        }
      };

      try {
        await attempt(true);
      } catch (err) {
        lastErr = err;
        console.error('[advisor] generation error (with web_search):', err instanceof Error ? (err.stack ?? err.message) : err);
        // Graceful fallback: if web search / tool use failed before producing any
        // answer, retry once WITHOUT tools so the model still answers from knowledge.
        if (!fullText.trim()) {
          try {
            await attempt(false);
            lastErr = null;
          } catch (err2) {
            lastErr = err2;
            console.error('[advisor] generation error (no-tools fallback):', err2 instanceof Error ? (err2.stack ?? err2.message) : err2);
          }
        }
      }

      if (!fullText.trim()) {
        const type = classifyError(lastErr);
        controller.enqueue(enc.encode(`Sorry, I could not complete that request right now (${type}). Please try again in a moment.`));
      }

      if (user && fullText.trim()) {
        await insertMessage(user.id, 'assistant', fullText, conversationId);
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

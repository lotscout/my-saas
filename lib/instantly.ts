const INSTANTLY_API_BASE = 'https://api.instantly.ai';

type InstantlyResult =
  | { ok: true; action: 'blocked' | 'skipped'; status?: number; skipped?: boolean; reason?: string }
  | { ok: false; action: 'error'; status?: number; error: string };

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? '';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function instantlyFetch(path: string, init: RequestInit = {}) {
  const apiKey = process.env.INSTANTLY_API_KEY;
  if (!apiKey) throw new Error('Missing INSTANTLY_API_KEY');

  return fetch(`${INSTANTLY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

// Use the workspace blocklist as the hard stop for cold outreach. This is safer
// than trying to remove a lead from every current/future campaign, because a
// signed-up user should never re-enter Instantly cold sequences.
export async function blockInstantlyColdProspect(emailInput: string | null | undefined): Promise<InstantlyResult> {
  const email = normalizeEmail(emailInput);
  if (!email || !isValidEmail(email)) return { ok: true, action: 'skipped', skipped: true, reason: 'invalid_email' };
  if (!process.env.INSTANTLY_API_KEY) return { ok: true, action: 'skipped', skipped: true, reason: 'missing_instantly_api_key' };

  try {
    const res = await instantlyFetch('/api/v2/block-lists-entries', {
      method: 'POST',
      body: JSON.stringify({ bl_value: email }),
    });

    // If it already exists, the desired state is already true.
    if (res.ok || res.status === 409 || res.status === 422) {
      return { ok: true, action: 'blocked', status: res.status };
    }

    const text = await res.text().catch(() => '');
    return { ok: false, action: 'error', status: res.status, error: text || `Instantly blocklist failed: ${res.status}` };
  } catch (err) {
    return { ok: false, action: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}

const RESEND_API_BASE = 'https://api.resend.com';
const DEFAULT_AUDIENCE_NAME = 'General';
const DEFAULT_SIGNED_UP_AUDIENCE_NAME = 'LotScout Signed Up Users';
const DEFAULT_PAID_AUDIENCE_NAME = 'LotScout Paid Users';

type ResendAudienceKey = 'general' | 'signed_up' | 'paid';

type SyncContactInput = {
  email: string | null | undefined;
  firstName?: string | null;
  lastName?: string | null;
  unsubscribed?: boolean;
  audience?: ResendAudienceKey;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

type ResendAudience = { id: string; name: string };
type ResendContact = { id: string; email: string };

async function resendFetch(path: string, init: RequestInit = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');

  return fetch(`${RESEND_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

function audienceEnv(audience: ResendAudienceKey) {
  switch (audience) {
    case 'signed_up':
      return {
        id: process.env.RESEND_SIGNED_UP_AUDIENCE_ID,
        name: process.env.RESEND_SIGNED_UP_AUDIENCE_NAME || DEFAULT_SIGNED_UP_AUDIENCE_NAME,
      };
    case 'paid':
      return {
        id: process.env.RESEND_PAID_AUDIENCE_ID,
        name: process.env.RESEND_PAID_AUDIENCE_NAME || DEFAULT_PAID_AUDIENCE_NAME,
      };
    case 'general':
    default:
      return {
        id: process.env.RESEND_AUDIENCE_ID,
        name: process.env.RESEND_AUDIENCE_NAME || DEFAULT_AUDIENCE_NAME,
      };
  }
}

async function getAudienceId(audience: ResendAudienceKey = 'general') {
  const configured = audienceEnv(audience);
  if (configured.id) return configured.id;

  const res = await resendFetch('/audiences');
  if (!res.ok) throw new Error(`Resend audience lookup failed: ${res.status}`);

  const json = await res.json();
  const found = (json?.data ?? []).find((item: ResendAudience) => item.name === configured.name);
  if (!found?.id) throw new Error(`Resend audience not found: ${configured.name}`);
  return found.id as string;
}

async function findContactId(audienceId: string, email: string) {
  const res = await resendFetch(`/audiences/${audienceId}/contacts`);
  if (!res.ok) return null;
  const json = await res.json();
  const contact = (json?.data ?? []).find((item: ResendContact) => item.email?.toLowerCase() === email.toLowerCase());
  return contact?.id ?? null;
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? '';
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function syncResendContact(input: SyncContactInput) {
  const email = normalizeEmail(input.email);
  if (!email || !validEmail(email)) return { ok: false, skipped: true, reason: 'invalid_email' };

  const audienceId = await getAudienceId(input.audience ?? 'general');
  const payload = {
    email,
    first_name: input.firstName?.trim() || undefined,
    last_name: input.lastName?.trim() || undefined,
    unsubscribed: input.unsubscribed === true,
    properties: input.properties
      ? Object.fromEntries(Object.entries(input.properties).filter(([, value]) => value !== undefined && value !== null))
      : undefined,
  };

  const createRes = await resendFetch(`/audiences/${audienceId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (createRes.ok) return { ok: true, action: 'created', audience: input.audience ?? 'general' };

  // Resend returns a conflict when the contact already exists. Update in place when possible.
  if (createRes.status === 409 || createRes.status === 422) {
    const contactId = await findContactId(audienceId, email);
    if (!contactId) return { ok: true, action: 'exists', audience: input.audience ?? 'general' };

    const updateRes = await resendFetch(`/audiences/${audienceId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (updateRes.ok) return { ok: true, action: 'updated', audience: input.audience ?? 'general' };
    throw new Error(`Resend contact update failed: ${updateRes.status}`);
  }

  throw new Error(`Resend contact create failed: ${createRes.status}`);
}

export async function removeResendContact(emailInput: string | null | undefined, audience: ResendAudienceKey) {
  const email = normalizeEmail(emailInput);
  if (!email || !validEmail(email)) return { ok: true, skipped: true, reason: 'invalid_email' };

  const audienceId = await getAudienceId(audience);
  const contactId = await findContactId(audienceId, email);
  if (!contactId) return { ok: true, action: 'not_found', audience };

  const res = await resendFetch(`/audiences/${audienceId}/contacts/${contactId}`, { method: 'DELETE' });
  if (res.ok || res.status === 404) return { ok: true, action: 'removed', audience };
  throw new Error(`Resend contact delete failed: ${res.status}`);
}

export async function moveResendContactToPaid(input: Omit<SyncContactInput, 'audience'>) {
  // Keep paid users in the signed-up audience so they still receive broad
  // marketplace/new-listing/new-buyer-request updates. Paid-only/account-specific
  // messages are transactional and should be sent directly from app events.
  await syncResendContact({
    ...input,
    audience: 'signed_up',
    properties: {
      ...(input.properties ?? {}),
      lifecycle_stage: 'paid',
    },
  });
  return { ok: true, action: 'marked_paid_in_signed_up_audience' };
}

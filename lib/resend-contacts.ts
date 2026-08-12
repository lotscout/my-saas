const RESEND_API_BASE = 'https://api.resend.com';
const DEFAULT_AUDIENCE_NAME = 'General';

type SyncContactInput = {
  email: string | null | undefined;
  firstName?: string | null;
  lastName?: string | null;
  unsubscribed?: boolean;
};

type ResendAudience = { id: string; name: string };
type ResendContact = { id: string; email: string };

function isValidEmail(email: string) {
  const [localPart, domain] = email.split('@');
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && Boolean(localPart)
    && Boolean(domain)
    && !localPart.startsWith('.')
    && !localPart.endsWith('.')
    && !localPart.includes('..')
    && !domain.startsWith('.')
    && !domain.endsWith('.')
    && !domain.includes('..');
}

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

async function getAudienceId() {
  if (process.env.RESEND_AUDIENCE_ID) return process.env.RESEND_AUDIENCE_ID;

  const audienceName = process.env.RESEND_AUDIENCE_NAME || DEFAULT_AUDIENCE_NAME;
  const res = await resendFetch('/audiences');
  if (!res.ok) throw new Error(`Resend audience lookup failed: ${res.status}`);

  const json = await res.json();
  const audience = (json?.data ?? []).find((item: ResendAudience) => item.name === audienceName);
  if (!audience?.id) throw new Error(`Resend audience not found: ${audienceName}`);
  return audience.id as string;
}

async function findContactId(audienceId: string, email: string) {
  const res = await resendFetch(`/audiences/${audienceId}/contacts`);
  if (!res.ok) return null;
  const json = await res.json();
  const contact = (json?.data ?? []).find((item: ResendContact) => item.email?.toLowerCase() === email.toLowerCase());
  return contact?.id ?? null;
}

export async function syncResendContact(input: SyncContactInput) {
  const email = input.email?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) return { ok: false, skipped: true, reason: 'invalid_email' };

  const audienceId = await getAudienceId();
  const payload = {
    email,
    first_name: input.firstName?.trim() || undefined,
    last_name: input.lastName?.trim() || undefined,
    unsubscribed: input.unsubscribed === true,
  };

  const createRes = await resendFetch(`/audiences/${audienceId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (createRes.ok) return { ok: true, action: 'created' };

  // Resend returns a conflict when the contact already exists. Update in place when possible.
  if (createRes.status === 409 || createRes.status === 422) {
    const contactId = await findContactId(audienceId, email);
    if (!contactId) return { ok: true, action: 'exists' };

    const updateRes = await resendFetch(`/audiences/${audienceId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (updateRes.ok) return { ok: true, action: 'updated' };
    throw new Error(`Resend contact update failed: ${updateRes.status}`);
  }

  throw new Error(`Resend contact create failed: ${createRes.status}`);
}

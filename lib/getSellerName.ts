// Values that indicate the uploader account or seed/test data — never display these.
// Kept lowercase; matching is case-insensitive substring.
const BAD_TOKENS = ['bobby oliver', 'lotscout seller', 'seed', 'sample', '@lotscout.com', 'test'];

// True when a candidate name is empty or looks like an uploader / seed / test value.
export function isBadName(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.toLowerCase();
  return BAD_TOKENS.some(t => v.includes(t));
}

// Format a full name as "First L." (first name + last initial). A single word or
// empty string is returned trimmed / as-is.
export function formatName(name: string | null | undefined): string {
  const raw = (name ?? '').trim();
  if (!raw) return '';
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// Single source of truth for a listing's seller display name. Priority:
//   1. listing.owner_name
//   2. listing.digital_signature
//   3. a real profile name (first + last, full_name, or company_name)
//   4. fallback "Seller"
// Any candidate matching a bad token (uploader / seed / test) is skipped.
export function getSellerName(listing: Record<string, any> | null | undefined): string {
  if (!listing) return 'Seller';
  const profile = listing.profiles ?? null;
  const candidates: (string | null | undefined)[] = [
    listing.owner_name,
    listing.digital_signature,
    profile ? ([profile.first_name, profile.last_name].filter(Boolean).join(' ') || null) : null,
    profile?.full_name,
    profile?.company_name,
    listing.full_name,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && !isBadName(c)) {
      const formatted = formatName(c);
      if (formatted) return formatted;
    }
  }
  return 'Seller';
}

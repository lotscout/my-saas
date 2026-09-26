export const LAND_MATCHER_COOKIE = 'ls_land_matcher_access';

export function getLandMatcherToken() {
  return process.env.INTERNAL_LAND_MATCHER_TOKEN || '';
}

export function hasValidLandMatcherToken(value: string | null | undefined) {
  const expected = getLandMatcherToken();
  return Boolean(expected && value && value === expected);
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map(part => part.trim());
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx);
    const value = decodeURIComponent(part.slice(idx + 1));
    if (key === name) return value;
  }
  return null;
}

export function requestHasLandMatcherAccess(request: Request) {
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get('token');
  const headerToken = request.headers.get('x-land-matcher-token');
  const cookieToken = getCookieValue(request.headers.get('cookie'), LAND_MATCHER_COOKIE);
  return hasValidLandMatcherToken(tokenParam) || hasValidLandMatcherToken(headerToken) || hasValidLandMatcherToken(cookieToken);
}

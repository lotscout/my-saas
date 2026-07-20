import { isBadName } from './getSellerName';

// Single source of truth for a buyer's display name. Priority:
//   1. first name + last initial
//   2. display_company
//   3. a real display_name
//   4. fallback "Buyer"
// Any candidate matching a bad token (seed / sample / seed-buyers / @lotscout.com /
// test) is skipped so the wrong-name problem cannot recur.
export function getBuyerName(req: Record<string, any>): string {
  if (req.first_name && req.last_name) {
    const full = `${req.first_name} ${req.last_name}`;
    if (!isBadName(full)) return `${req.first_name} ${req.last_name.charAt(0)}.`;
  }
  if (req.display_company && !isBadName(req.display_company)) {
    return req.display_company;
  }
  if (req.display_name && !isBadName(req.display_name)) {
    return req.display_name;
  }
  if (req.first_name && !isBadName(req.first_name)) {
    return req.first_name;
  }
  const profileName = [req.profiles?.first_name, req.profiles?.last_name].filter(Boolean).join(' ');
  if (profileName && !isBadName(profileName)) {
    return profileName;
  }
  if (req.profiles?.company_name && !isBadName(req.profiles.company_name)) {
    return req.profiles.company_name;
  }
  return 'Buyer';
}

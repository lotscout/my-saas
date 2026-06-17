export function getBuyerName(req: Record<string, any>): string {
  if (req.first_name && req.last_name) {
    return req.first_name + ' ' + req.last_name.charAt(0) + '.';
  }
  if (req.display_company) {
    return req.display_company;
  }
  if (req.display_name && !req.display_name.toLowerCase().includes('sample')) {
    return req.display_name;
  }
  if (req.first_name) {
    return req.first_name;
  }
  const profileName = [req.profiles?.first_name, req.profiles?.last_name].filter(Boolean).join(' ');
  if (profileName && !profileName.toLowerCase().includes('sample')) {
    return profileName;
  }
  if (req.profiles?.company_name && !req.profiles.company_name.toLowerCase().includes('sample')) {
    return req.profiles.company_name;
  }
  return 'Anonymous Buyer';
}

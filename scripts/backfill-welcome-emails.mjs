import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const send = process.argv.includes('--send');
const includeTest = process.argv.includes('--include-test');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://axiockuobpttlwzicldo.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://lotscout.com';

if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
if (send && !resendKey) throw new Error('Missing RESEND_API_KEY');

const supabase = createClient(supabaseUrl, serviceKey);
const resend = resendKey ? new Resend(resendKey) : null;

function isValidEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const [localPart, domain] = normalized.split('@');
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    && Boolean(localPart)
    && Boolean(domain)
    && !localPart.startsWith('.')
    && !localPart.endsWith('.')
    && !localPart.includes('..')
    && !domain.startsWith('.')
    && !domain.endsWith('.')
    && !domain.includes('..');
}

function isInternalPlaceholderEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized.endsWith('@import.lotscout.com')
    || normalized === 'seed-buyers@lotscout.com'
    || normalized === 'sellers@lotscout.com'
    || normalized === 'samples@lotscout.com';
}

function buildWelcomeEmail(firstName) {
  const greeting = firstName ? `Welcome to LotScout, ${firstName}!` : 'Welcome to LotScout!';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:40px 0">
    <tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
      <tr><td style="background:#1B4332;border-radius:12px 12px 0 0;padding:28px 40px"><p style="margin:0;font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px">LotScout</p></td></tr>
      <tr><td style="background:white;padding:40px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1B4332">${greeting}</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6">LotScout helps land buyers, sellers, and developers find opportunities faster — without digging through scattered listings, stale contacts, and market noise.</p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:30px;width:100%">
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6"><p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Browse off-market and hard-to-find land listings</p></td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6"><p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Post buying criteria so sellers know what you want</p></td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6"><p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Use Scout AI to research land, markets, and deal questions</p></td></tr>
          <tr><td style="padding:10px 0"><p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Connect directly through LotScout messaging</p></td></tr>
        </table>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:22px"><tr><td><a href="${baseUrl}/scout" style="display:inline-block;background:#1D9E75;color:white;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px">Try Scout AI &rarr;</a></td></tr></table>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6">If you are looking for land, start with Scout or post a buyer request. If you have land to sell, create a listing and get in front of active buyers.</p>
        <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">&copy; 2026 LotScout. All rights reserved.<br>You received this because you created an account at lotscout.com.</p>
      </td></tr>
    </table></td></tr>
  </table>
</body>
</html>`;
}

const { data: profiles, error } = await supabase
  .from('profiles')
  .select('id,email,first_name,is_admin,is_test_profile,created_at')
  .not('email', 'is', null)
  .order('created_at', { ascending: true });
if (error) throw error;

const { data: welcomes, error: welcomeError } = await supabase
  .from('email_logs')
  .select('user_id,to_email')
  .eq('email_type', 'welcome');
if (welcomeError) throw welcomeError;

const welcomedUsers = new Set((welcomes || []).map((row) => row.user_id).filter(Boolean));
const welcomedEmails = new Set((welcomes || []).map((row) => String(row.to_email || '').toLowerCase()).filter(Boolean));

let candidates = (profiles || []).filter((profile) => {
  const email = String(profile.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) return false;
  if (isInternalPlaceholderEmail(email)) return false;
  if (profile.is_admin) return false;
  if (!includeTest && profile.is_test_profile) return false;
  if (welcomedUsers.has(profile.id) || welcomedEmails.has(email)) return false;
  return true;
});

if (Number.isFinite(limit) && limit > 0) candidates = candidates.slice(0, limit);

console.log(`${send ? 'SEND' : 'DRY RUN'}: ${candidates.length} welcome email candidate(s)`);
for (const profile of candidates) {
  const email = String(profile.email).trim().toLowerCase();
  console.log(`- ${email} (${profile.created_at})`);
  if (!send) continue;

  await resend.emails.send({
    from: 'LotScout <support@lotscout.com>',
    to: email,
    subject: 'Welcome to LotScout',
    html: buildWelcomeEmail(profile.first_name?.trim() || null),
  });

  await supabase.from('email_logs').insert({
    user_id: profile.id,
    to_email: email,
    from_email: 'LotScout <support@lotscout.com>',
    subject: 'Welcome to LotScout',
    email_type: 'welcome',
    status: 'sent',
  });

  await new Promise((resolve) => setTimeout(resolve, 250));
}

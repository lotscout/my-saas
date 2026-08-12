import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logEmail } from '@/lib/email-logger';

export function buildWelcomeEmail(firstName: string | null, baseUrl: string): string {
  const greeting = firstName ? `Welcome to LotScout, ${firstName}!` : 'Welcome to LotScout!';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr>
          <td style="background:#1B4332;border-radius:12px 12px 0 0;padding:28px 40px">
            <p style="margin:0;font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px">LotScout</p>
          </td>
        </tr>
        <tr>
          <td style="background:white;padding:40px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1B4332">${greeting}</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6">
              LotScout helps land buyers, sellers, and developers find opportunities faster — without digging through scattered listings, stale contacts, and market noise.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:30px;width:100%">
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Browse off-market and hard-to-find land listings</p>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Post buying criteria so sellers know what you want</p>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Use Scout AI to research land, markets, and deal questions</p>
              </td></tr>
              <tr><td style="padding:10px 0">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Connect directly through LotScout messaging</p>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:22px">
              <tr><td>
                <a href="${baseUrl}/scout"
                   style="display:inline-block;background:#1D9E75;color:white;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px">
                  Try Scout AI &rarr;
                </a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6">
              If you are looking for land, start with Scout or post a buyer request. If you have land to sell, create a listing and get in front of active buyers.
            </p>
            <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
              &copy; 2026 LotScout. All rights reserved.<br>
              You received this because you created an account at lotscout.com.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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

export async function sendWelcomeEmailIfNeeded({
  supabase,
  userId,
  email,
  firstName,
  includeTestUsers = false,
}: {
  supabase: SupabaseClient;
  userId: string;
  email: string;
  firstName?: string | null;
  includeTestUsers?: boolean;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    return { sent: false, skipped: true, reason: 'invalid_email' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_test_profile')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.is_admin || (!includeTestUsers && profile?.is_test_profile)) {
    return { sent: false, skipped: true, reason: 'internal_or_test_user' };
  }

  const { data: existingWelcome } = await supabase
    .from('email_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('email_type', 'welcome')
    .limit(1)
    .maybeSingle();

  if (existingWelcome) return { sent: false, skipped: true, reason: 'already_sent' };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lotscout.com';

  await resend.emails.send({
    from: 'LotScout <support@lotscout.com>',
    to: normalizedEmail,
    subject: 'Welcome to LotScout',
    html: buildWelcomeEmail(firstName?.trim() || null, baseUrl),
  });

  await logEmail({
    user_id: userId,
    to_email: normalizedEmail,
    from_email: 'LotScout <support@lotscout.com>',
    subject: 'Welcome to LotScout',
    email_type: 'welcome',
  });

  return { sent: true, skipped: false, reason: null };
}

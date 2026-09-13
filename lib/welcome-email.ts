import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/service';
import { logEmail } from '@/lib/email-logger';

function buildWelcomeEmail(firstName: string | null, baseUrl: string): string {
  const greeting = firstName ? `Welcome to LotScout, ${firstName}!` : 'Welcome to LotScout!';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;font-size:1px">
    Hi, welcome to LotScout. Your account is ready and the marketplace is waiting.
  </div>
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
            <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.6">
              The off-market land marketplace built for serious buyers and sellers.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;width:100%">
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Browse off-market listings</p>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Connect with active buyers</p>
              </td></tr>
              <tr><td style="padding:10px 0">
                <p style="margin:0;font-size:14px;color:#1B4332;font-weight:700">&#10003;&nbsp; Request property analysis reports</p>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0">
              <tr><td>
                <a href="${baseUrl}/marketplace"
                   style="display:inline-block;background:#1B4332;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px">
                  Explore the Marketplace &rarr;
                </a>
              </td></tr>
            </table>
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

export async function sendWelcomeEmailOnce({
  userId,
  email,
  firstName = null,
  baseUrl,
}: {
  userId: string;
  email: string;
  firstName?: string | null;
  baseUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[welcome-email] RESEND_API_KEY is not configured');
    return { ok: false, skipped: true, reason: 'missing_resend_api_key' };
  }

  const service = createServiceClient();
  const { data: existingWelcome } = await service
    .from('email_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('email_type', 'welcome')
    .limit(1)
    .maybeSingle();

  if (existingWelcome) {
    return { ok: true, skipped: true, reason: 'already_sent' };
  }

  const resolvedBaseUrl = baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lotscout.com';
  const fromEmail = 'LotScout <hello@lotscout.com>';
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Welcome to LotScout',
    html: buildWelcomeEmail(firstName, resolvedBaseUrl),
    text: `Hi, welcome to LotScout. Your account is ready. Explore the marketplace: ${resolvedBaseUrl}/marketplace`,
  });

  await logEmail({
    user_id: userId,
    to_email: email,
    from_email: fromEmail,
    subject: 'Welcome to LotScout',
    email_type: 'welcome',
  });

  return { ok: true, skipped: false };
}

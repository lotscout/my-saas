import { Resend } from 'resend';
import { logEmail } from '@/lib/email-logger';

function buildAccountLoginEmail(firstName: string | null, baseUrl: string): string {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const loginUrl = `${baseUrl}/sign-in?redirect=${encodeURIComponent('/marketplace')}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;font-size:1px">
    Your LotScout account is ready. Log in to continue to the marketplace.
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
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#1B4332">Your LotScout account is ready</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6">
              ${greeting} we found an existing LotScout account for this email. Log in to continue to the marketplace.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr><td>
                <a href="${loginUrl}"
                   style="display:inline-block;background:#1B4332;color:white;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px">
                  Log in to Marketplace &rarr;
                </a>
              </td></tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6">
              If you forgot your password, use the forgot password link on the sign-in page.
            </p>
            <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
              &copy; 2026 LotScout. All rights reserved.<br>
              You received this because someone requested access using this email at lotscout.com.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendAccountLoginEmail({
  userId = null,
  email,
  firstName = null,
  baseUrl,
}: {
  userId?: string | null;
  email: string;
  firstName?: string | null;
  baseUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[account-login-email] RESEND_API_KEY is not configured');
    return { ok: false, skipped: true, reason: 'missing_resend_api_key' };
  }

  const resolvedBaseUrl = baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lotscout.com';
  const loginUrl = `${resolvedBaseUrl}/sign-in?redirect=${encodeURIComponent('/marketplace')}`;
  const fromEmail = 'LotScout <hello@lotscout.com>';
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Log in to your LotScout account',
    html: buildAccountLoginEmail(firstName, resolvedBaseUrl),
    text: `Your LotScout account is ready. Log in to continue to the marketplace: ${loginUrl}`,
  });

  await logEmail({
    user_id: userId,
    to_email: email,
    from_email: fromEmail,
    subject: 'Log in to your LotScout account',
    email_type: 'account_login_prompt',
  });

  return { ok: true, skipped: false };
}

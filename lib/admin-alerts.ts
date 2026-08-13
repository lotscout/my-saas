import { Resend } from 'resend';
import { logEmail } from '@/lib/email-logger';

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'bobby@lotscout.com';
const FROM_EMAIL = 'LotScout <support@lotscout.com>';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendAdminAlert({
  subject,
  title,
  rows,
  ctaHref,
  ctaLabel = 'Open admin dashboard',
  emailType,
  userId = null,
}: {
  subject: string;
  title: string;
  rows: Array<[string, unknown]>;
  ctaHref?: string;
  ctaLabel?: string;
  emailType: string;
  userId?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://lotscout.com';
  const href = ctaHref?.startsWith('http') ? ctaHref : `${baseUrl}${ctaHref || '/admin/dashboard/data-center'}`;
  const resend = new Resend(process.env.RESEND_API_KEY);

  const tableRows = rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([label, value]) => `
      <tr>
        <td style="padding:8px 10px;color:#6b7280;font-weight:700;vertical-align:top;border-bottom:1px solid #f3f4f6">${escapeHtml(label)}</td>
        <td style="padding:8px 10px;color:#111827;vertical-align:top;border-bottom:1px solid #f3f4f6">${escapeHtml(value)}</td>
      </tr>`)
    .join('');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_ALERT_EMAIL,
      subject,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f5;padding:28px">
          <div style="max-width:620px;margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
            <div style="background:#1B4332;padding:22px 26px">
              <p style="margin:0;color:white;font-size:20px;font-weight:900;letter-spacing:-0.4px">LotScout</p>
            </div>
            <div style="padding:26px">
              <h1 style="margin:0 0 14px;color:#1B4332;font-size:22px;line-height:1.2">${escapeHtml(title)}</h1>
              <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0 22px">
                ${tableRows}
              </table>
              <a href="${escapeHtml(href)}" style="display:inline-block;background:#1D9E75;color:white;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:800;font-size:14px">${escapeHtml(ctaLabel)} →</a>
            </div>
          </div>
        </div>`,
    });

    await logEmail({
      user_id: userId,
      to_email: ADMIN_ALERT_EMAIL,
      from_email: FROM_EMAIL,
      subject,
      email_type: emailType,
    });
  } catch (err) {
    console.error('[admin-alerts] Failed to send alert:', err);
  }
}

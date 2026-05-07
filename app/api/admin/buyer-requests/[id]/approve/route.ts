import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';
import { isAdminEmail } from '@/lib/admin';
import { logEmail } from '@/lib/email-logger';

async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('*').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await checkIsAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const service = createServiceClient();

    // Fetch buyer request details before updating
    const { data: buyerRequest, error: fetchError } = await service
      .from('buyer_requests')
      .select('id, user_id, target_regions, budget_min, budget_max, min_acreage, max_acreage, use_case, timeline')
      .eq('id', id)
      .single();

    if (fetchError || !buyerRequest) {
      return NextResponse.json({ error: 'Buyer request not found' }, { status: 404 });
    }

    // Update status to active
    const { error: updateError } = await service
      .from('buyer_requests')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Look up buyer profile
    const { data: profile } = await service
      .from('profiles')
      .select('email, full_name, first_name')
      .eq('id', buyerRequest.user_id)
      .single();

    const buyerEmail = profile?.email;
    const buyerName = profile?.full_name || profile?.first_name || 'there';

    // Send approval email to buyer
    if (buyerEmail) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const regionsList = (buyerRequest.target_regions ?? []).join(', ') || '—';
        const budgetRange = buyerRequest.budget_min || buyerRequest.budget_max
          ? `$${Number(buyerRequest.budget_min || 0).toLocaleString()} – $${Number(buyerRequest.budget_max || 0).toLocaleString()}`
          : '—';
        const acreageRange = buyerRequest.min_acreage || buyerRequest.max_acreage
          ? `${buyerRequest.min_acreage ?? '?'} – ${buyerRequest.max_acreage ?? '?'} acres`
          : '—';

        await resend.emails.send({
          from: 'LotScout <hello@lotscout.com>',
          to: buyerEmail,
          subject: 'Your buyer profile is now live on LotScout 🎉',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#1B4332;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#1B4332;margin-top:0">🎉 Your Buyer Profile is Live!</h2>
                <p>Hi ${buyerName},</p>
                <p>Great news — your buyer profile has been reviewed and approved. It's now <strong>live in the LotScout buyer directory</strong>!</p>
                <p>Sellers with matching land can now see your profile and reach out directly based on your criteria.</p>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:24px 0">
                  <p style="margin:0 0 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Your Active Criteria</p>
                  <table cellpadding="4" style="font-size:14px;width:100%">
                    <tr><td style="color:#666;width:40%">Target Regions</td><td style="font-weight:500">${regionsList}</td></tr>
                    <tr><td style="color:#666">Budget</td><td style="font-weight:500">${budgetRange}</td></tr>
                    <tr><td style="color:#666">Acreage</td><td style="font-weight:500">${acreageRange}</td></tr>
                    <tr><td style="color:#666">Use Case</td><td style="font-weight:500">${buyerRequest.use_case || '—'}</td></tr>
                    <tr><td style="color:#666">Timeline</td><td style="font-weight:500">${buyerRequest.timeline || '—'}</td></tr>
                  </table>
                </div>
                <a href="https://lotscout.com/buyer-directory"
                   style="display:inline-block;background:#1B4332;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px">
                  View Buyer Directory →
                </a>
                <p style="color:#6b7280;font-size:13px">Questions? Reply to this email or visit <a href="https://lotscout.com" style="color:#059669">lotscout.com</a>.</p>
              </div>
            </div>
          `,
        });
        await logEmail({ user_id: buyerRequest.user_id, to_email: buyerEmail, from_email: 'hello@lotscout.com', subject: 'Your buyer profile is now live on LotScout 🎉', email_type: 'buyer_request_approved' });
      } catch (emailErr) {
        console.error('[buyer-requests/approve] Email error:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[buyer-requests/approve] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

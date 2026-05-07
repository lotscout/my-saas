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
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as { status: string; report_url?: string; notes?: string };
  const { status, report_url, notes } = body;

  const VALID = ['pending', 'in_progress', 'completed', 'rejected'];
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: req, error: fetchError } = await service
    .from('property_analysis_requests')
    .select('id, input_type, street_address, city, state, apn, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = { status };
  if (report_url) updates.report_url = report_url;

  const { error: updateError } = await service
    .from('property_analysis_requests')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: profile } = await service
    .from('profiles')
    .select('email, full_name, first_name')
    .eq('id', req.user_id)
    .single();

  const userEmail = profile?.email;
  const userName = profile?.full_name || profile?.first_name || 'there';
  const location = [req.street_address, req.city, req.state].filter(Boolean).join(', ') || req.apn || 'your property';

  if (userEmail && (status === 'completed' || status === 'rejected')) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (status === 'completed') {
        await resend.emails.send({
          from: 'LotScout <support@lotscout.com>',
          to: userEmail,
          subject: 'Your property analysis is ready — LotScout',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#012d1d;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#012d1d;margin-top:0">Your Analysis Report is Ready</h2>
                <p>Hi ${userName},</p>
                <p>Your property analysis for <strong>${location}</strong> has been completed and your report is ready to view.</p>
                ${report_url ? `
                <a href="${report_url}"
                   style="display:inline-block;background:#012d1d;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0 24px">
                  View Your Report →
                </a>` : ''}
                ${notes ? `<p style="color:#374151">${notes}</p>` : ''}
                <p style="color:#6b7280;font-size:13px">Questions? Contact <a href="mailto:support@lotscout.com" style="color:#059669">support@lotscout.com</a></p>
              </div>
            </div>
          `,
        });
        await logEmail({ user_id: req.user_id, to_email: userEmail, from_email: 'support@lotscout.com', subject: 'Your property analysis is ready — LotScout', email_type: 'analysis_completed' });
      } else if (status === 'rejected') {
        await resend.emails.send({
          from: 'LotScout <support@lotscout.com>',
          to: userEmail,
          subject: 'Update on your property analysis request — LotScout',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#012d1d;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#012d1d;margin-top:0">Analysis Request Update</h2>
                <p>Hi ${userName},</p>
                <p>We were unable to complete the analysis for <strong>${location}</strong> at this time.</p>
                ${notes ? `
                <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:16px 0 24px">
                  <p style="margin:0;color:#7f1d1d">${notes}</p>
                </div>` : ''}
                <p>Please feel free to submit a new request or contact us if you need assistance.</p>
                <p style="color:#6b7280;font-size:13px">Questions? Contact <a href="mailto:support@lotscout.com" style="color:#059669">support@lotscout.com</a></p>
              </div>
            </div>
          `,
        });
        await logEmail({ user_id: req.user_id, to_email: userEmail, from_email: 'support@lotscout.com', subject: 'Update on your property analysis request — LotScout', email_type: 'analysis_rejected' });
      }
    } catch (emailErr) {
      console.error('[analysis/status] Email error:', emailErr);
    }
  }

  return NextResponse.json({ success: true });
}

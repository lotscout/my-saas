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
  const body = await request.json() as { status: string; reason?: string };
  const { status, reason } = body;

  const VALID = ['active', 'revision_needed', 'rejected'];
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: listing, error: fetchError } = await service
    .from('listings')
    .select('id, title, user_id, state, county')
    .eq('id', id)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  const { error: updateError } = await service
    .from('listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: profile } = await service
    .from('profiles')
    .select('email, full_name, first_name')
    .eq('id', listing.user_id)
    .single();

  const sellerEmail = profile?.email;
  const sellerName = profile?.full_name || profile?.first_name || 'there';
  const location = [listing.county, listing.state].filter(Boolean).join(', ');

  if (!sellerEmail) {
    return NextResponse.json({ error: 'Listing status updated, but seller email is missing so no notification could be sent.' }, { status: 502 });
  }

  if (sellerEmail) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (status === 'active') {
        await resend.emails.send({
          from: 'LotScout <support@lotscout.com>',
          to: sellerEmail,
          subject: 'Your listing has been approved — LotScout',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#012d1d;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#012d1d;margin-top:0">Your Listing is Approved!</h2>
                <p>Hi ${sellerName},</p>
                <p>Great news — your listing has been reviewed and <strong>approved</strong>. It's now live on the LotScout marketplace!</p>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:24px 0">
                  <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Listing</p>
                  <p style="margin:0;font-weight:bold;color:#012d1d;font-size:16px">${listing.title}</p>
                  ${location ? `<p style="margin:4px 0 0;color:#6b7280;font-size:14px">${location}</p>` : ''}
                </div>
                <a href="https://lotscout.com/marketplace"
                   style="display:inline-block;background:#012d1d;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px">
                  View on Marketplace →
                </a>
                <p style="color:#6b7280;font-size:13px">Questions? Contact <a href="mailto:support@lotscout.com" style="color:#059669">support@lotscout.com</a></p>
              </div>
            </div>
          `,
        });
        await logEmail({ user_id: listing.user_id, to_email: sellerEmail, from_email: 'support@lotscout.com', subject: 'Your listing has been approved — LotScout', email_type: 'listing_approved' });
      } else if (status === 'revision_needed') {
        await resend.emails.send({
          from: 'LotScout <support@lotscout.com>',
          to: sellerEmail,
          subject: 'Your listing needs a few updates — LotScout',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#012d1d;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#012d1d;margin-top:0">Listing Revision Requested</h2>
                <p>Hi ${sellerName},</p>
                <p>Thank you for your submission! We've reviewed your listing and have a few updates we'd like you to make before it goes live.</p>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:24px 0">
                  <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Listing</p>
                  <p style="margin:0;font-weight:bold;color:#012d1d;font-size:16px">${listing.title}</p>
                  ${location ? `<p style="margin:4px 0 0;color:#6b7280;font-size:14px">${location}</p>` : ''}
                </div>
                ${reason ? `
                <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:0 0 24px">
                  <p style="margin:0 0 6px;color:#92400e;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Requested Changes</p>
                  <p style="margin:0;color:#78350f">${reason}</p>
                </div>` : ''}
                <a href="https://lotscout.com/create-listing"
                   style="display:inline-block;background:#012d1d;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px">
                  Update Listing →
                </a>
                <p style="color:#6b7280;font-size:13px">Questions? Contact <a href="mailto:support@lotscout.com" style="color:#059669">support@lotscout.com</a></p>
              </div>
            </div>
          `,
        });
        await logEmail({ user_id: listing.user_id, to_email: sellerEmail, from_email: 'support@lotscout.com', subject: 'Your listing needs a few updates — LotScout', email_type: 'listing_revision' });
      } else if (status === 'rejected') {
        await resend.emails.send({
          from: 'LotScout <support@lotscout.com>',
          to: sellerEmail,
          subject: 'Update on your LotScout listing',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#012d1d;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#012d1d;margin-top:0">Listing Not Approved</h2>
                <p>Hi ${sellerName},</p>
                <p>After review, we weren't able to approve this listing for the LotScout marketplace at this time.</p>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:24px 0">
                  <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Listing</p>
                  <p style="margin:0;font-weight:bold;color:#012d1d;font-size:16px">${listing.title}</p>
                  ${location ? `<p style="margin:4px 0 0;color:#6b7280;font-size:14px">${location}</p>` : ''}
                </div>
                ${reason ? `
                <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:0 0 24px">
                  <p style="margin:0 0 6px;color:#991b1b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Reason</p>
                  <p style="margin:0;color:#7f1d1d">${reason}</p>
                </div>` : ''}
                <p style="color:#6b7280;font-size:13px">Questions? Contact <a href="mailto:support@lotscout.com" style="color:#059669">support@lotscout.com</a></p>
              </div>
            </div>
          `,
        });
        await logEmail({ user_id: listing.user_id, to_email: sellerEmail, from_email: 'support@lotscout.com', subject: 'Update on your LotScout listing', email_type: 'listing_rejected' });
      }
    } catch (emailErr) {
      console.error('[listing/status] Email error:', emailErr);
      return NextResponse.json({ error: 'Listing status updated, but email notification failed to send.' }, { status: 502 });
    }
  }

  return NextResponse.json({ success: true, emailSent: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';
import { isAdminEmail } from '@/lib/admin';

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

    // Fetch listing details before updating
    const { data: listing, error: fetchError } = await service
      .from('listings')
      .select('id, title, user_id, state, county')
      .eq('id', id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Update listing status to active
    const { error: updateError } = await service
      .from('listings')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Look up seller email from profiles table
    const { data: profile } = await service
      .from('profiles')
      .select('email, full_name, first_name')
      .eq('id', listing.user_id)
      .single();

    const sellerEmail = profile?.email;
    const sellerName = profile?.full_name || profile?.first_name || 'there';

    // Send approval email to seller
    if (sellerEmail) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'LotScout <hello@lotscout.com>',
          to: sellerEmail,
          subject: 'Your listing has been approved — LotScout',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#1B4332;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#1B4332;margin-top:0">🎉 Your Listing is Approved!</h2>
                <p>Hi ${sellerName},</p>
                <p>Great news — your listing has been reviewed and <strong>approved</strong>. It's now live on the LotScout marketplace!</p>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:24px 0">
                  <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Listing</p>
                  <p style="margin:0;font-weight:bold;color:#1B4332;font-size:16px">${listing.title}</p>
                  ${listing.county || listing.state ? `<p style="margin:4px 0 0;color:#6b7280;font-size:14px">${[listing.county, listing.state].filter(Boolean).join(', ')}</p>` : ''}
                </div>
                <a href="https://lotscout.com/marketplace"
                   style="display:inline-block;background:#1B4332;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px">
                  View on Marketplace →
                </a>
                <p style="color:#6b7280;font-size:13px">Questions? Reply to this email or visit <a href="https://lotscout.com" style="color:#059669">lotscout.com</a>.</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('[approve] Email error:', emailErr);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[approve] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

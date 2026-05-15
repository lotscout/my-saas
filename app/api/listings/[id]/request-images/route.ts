import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';
import { logEmail } from '@/lib/email-logger';

export const IMAGE_REQUEST_BODY =
  "Hi, I'm interested in this property and would like to request additional images. Thank you!";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = createServiceClient();

    // Tier check — Standard or above (or admin) required
    const [subRes, profileRes] = await Promise.all([
      service.from('subscriptions').select('tier').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
      service.from('profiles').select('is_admin, first_name, last_name').eq('id', user.id).single(),
    ]);

    const hasTier = !!subRes.data?.tier;
    const isAdmin = profileRes.data?.is_admin === true;
    if (!hasTier && !isAdmin) {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
    }

    const { id: listingId } = await params;

    const { data: listing } = await service
      .from('listings')
      .select('id, user_id, title, street_address, county, state')
      .eq('id', listingId)
      .single();

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const buyerId = user.id;
    const sellerId = listing.user_id;

    // Find existing conversation between this buyer and seller (any listing)
    const { data: existingConv } = await service
      .from('conversations')
      .select('id')
      .or(
        `and(buyer_id.eq.${buyerId},seller_id.eq.${sellerId}),` +
        `and(buyer_id.eq.${sellerId},seller_id.eq.${buyerId})`
      )
      .limit(1)
      .maybeSingle();

    let conversationId = existingConv?.id ?? null;

    if (!conversationId) {
      const { data: newConv, error: convErr } = await service
        .from('conversations')
        .insert({ buyer_id: buyerId, seller_id: sellerId, status: 'active', listing_id: listingId })
        .select('id')
        .single();

      if (convErr || !newConv) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
      conversationId = newConv.id;
    }

    // Idempotency: check if this buyer already sent an image request in this conversation
    const { data: existingMsg } = await service
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_id', buyerId)
      .eq('body', IMAGE_REQUEST_BODY)
      .maybeSingle();

    if (existingMsg) {
      return NextResponse.json({ alreadySent: true });
    }

    // Insert the automated image request message as the buyer
    const { error: msgErr } = await service
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: buyerId, body: IMAGE_REQUEST_BODY });

    if (msgErr) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update conversation preview (non-blocking)
    service
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), last_message_preview: IMAGE_REQUEST_BODY.slice(0, 100) })
      .eq('id', conversationId)
      .then(() => {});

    // Fetch seller profile for email notification
    const { data: sellerProfile } = await service
      .from('profiles')
      .select('email, first_name, is_test_profile')
      .eq('id', sellerId)
      .single();

    const buyerName =
      [profileRes.data?.first_name, profileRes.data?.last_name].filter(Boolean).join(' ') || 'A buyer';
    const propertyAddress =
      listing.street_address ||
      [listing.county, listing.state].filter(Boolean).join(', ') ||
      listing.title ||
      'your property';

    // Route to support@ for test sellers, otherwise to seller's real email
    const toEmail = sellerProfile?.is_test_profile
      ? 'support@lotscout.com'
      : sellerProfile?.email ?? null;

    if (toEmail) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const subject = `Image request for your listing: ${propertyAddress}`;
        await resend.emails.send({
          from: 'LotScout <hello@lotscout.com>',
          to: toEmail,
          subject,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#1B4332;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#1B4332;margin-top:0">New Image Request</h2>
                <p style="color:#374151"><strong>${buyerName}</strong> has requested additional images for your listing at <strong>${propertyAddress}</strong>.</p>
                <p style="color:#374151">Log in to LotScout to view the message and respond with photos.</p>
                <a href="https://www.lotscout.com/messaging"
                   style="display:inline-block;background:#1B4332;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0 24px">
                  View Message &rarr;
                </a>
                <p style="color:#6b7280;font-size:13px">Questions? Reply to this email or visit <a href="https://www.lotscout.com" style="color:#059669">lotscout.com</a>.</p>
              </div>
            </div>
          `,
        });
        await logEmail({
          user_id: sellerId,
          to_email: toEmail,
          from_email: 'hello@lotscout.com',
          subject,
          email_type: 'image_request',
        });
      } catch (emailErr) {
        console.error('[request-images] Email error:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[request-images] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

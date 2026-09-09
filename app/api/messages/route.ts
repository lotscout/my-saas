/*
  Run once in Supabase SQL editor to create the notifications table:

  CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    message text NOT NULL,
    link text,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz
  );
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
*/

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';
import { logEmail } from '@/lib/email-logger';
import { sendAdminAlert } from '@/lib/admin-alerts';

const PAID_TIERS = new Set(['standard', 'priority', 'exclusive']);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function hasPaidMessagingAccess(service: ReturnType<typeof createServiceClient>, userId: string): Promise<boolean> {
  const [{ data: activeSubscription }, { data: profileForTier }] = await Promise.all([
    service
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(),
    service
      .from('profiles')
      .select('subscription_tier,is_admin')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  const effectiveTier = activeSubscription?.tier ?? profileForTier?.subscription_tier ?? null;
  return PAID_TIERS.has(String(effectiveTier)) || Boolean(profileForTier?.is_admin);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    conversationId?: string;
    recipientId: string;
    body: string;
    currentUserIsBuyer?: boolean;
    listingId?: string;
  };

  const { conversationId: existingConvId, recipientId, body: messageBody, currentUserIsBuyer, listingId } = body;

  if (!recipientId || !messageBody?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const service = createServiceClient();
  let conversationId = existingConvId ?? null;

  // Find or create conversation when not provided (SendMessageModal flow)
  if (!conversationId) {
    const buyerId  = currentUserIsBuyer ? user.id : recipientId;
    const sellerId = currentUserIsBuyer ? recipientId : user.id;

    const { data: existing } = await service
      .from('conversations')
      .select('id')
      .or(
        `and(buyer_id.eq.${user.id},seller_id.eq.${recipientId}),` +
        `and(buyer_id.eq.${recipientId},seller_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle();

    conversationId = existing?.id ?? null;

    if (!conversationId) {
      const { data: newConv, error: convErr } = await service
        .from('conversations')
        .insert({ buyer_id: buyerId, seller_id: sellerId, status: 'active', listing_id: listingId ?? null })
        .select('id')
        .single();

      if (convErr || !newConv) {
        console.error('[api/messages] create conversation error:', convErr);
        return NextResponse.json({ error: convErr?.message ?? 'Failed to create conversation' }, { status: 500 });
      }
      conversationId = newConv.id;
    }
  }

  const { data: conversationForGate } = await service
    .from('conversations')
    .select('buyer_id, seller_id, listing_id')
    .eq('id', conversationId)
    .maybeSingle();

  const currentUserHasPaid = await hasPaidMessagingAccess(service, user.id);

  if (conversationForGate?.seller_id === user.id) {
    if (!currentUserHasPaid) {
      return NextResponse.json(
        { error: 'Upgrade to a paid LotScout account to view buyer messages and respond.' },
        { status: 403 }
      );
    }
  }

  if (conversationForGate?.buyer_id === user.id && !currentUserHasPaid && conversationForGate.seller_id) {
    const { data: sellerMessage } = await service
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_id', conversationForGate.seller_id)
      .limit(1)
      .maybeSingle();

    if (sellerMessage) {
      return NextResponse.json(
        { error: 'Upgrade to a paid LotScout account to view the seller reply and continue the conversation.' },
        { status: 403 }
      );
    }
  }

  // Insert message
  const trimmedBody = messageBody.trim();
  const { data: inserted, error: msgErr } = await service
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, body: trimmedBody })
    .select('id, body, sender_id, created_at, is_read')
    .single();

  if (msgErr || !inserted) {
    console.error('[api/messages] insert message error:', msgErr);
    return NextResponse.json({ error: msgErr?.message ?? 'Failed to send message' }, { status: 500 });
  }

  // Update conversation preview (best-effort, non-blocking)
  const preview = trimmedBody.length > 100 ? trimmedBody.slice(0, 100) + '…' : trimmedBody;
  service
    .from('conversations')
    .update({ last_message_at: inserted.created_at, last_message_preview: preview })
    .eq('id', conversationId)
    .then(({ error: updErr }) => {
      if (updErr) console.warn('[api/messages] conversation preview update failed:', updErr);
    });

  try {
    const { data: senderProfile } = await service
      .from('profiles')
      .select('first_name, last_name, full_name, email, company_name')
      .eq('id', user.id)
      .single();

    const { data: recipientProfile } = await service
      .from('profiles')
      .select('first_name, last_name, full_name, email, company_name')
      .eq('id', recipientId)
      .single();

    const senderName = senderProfile?.full_name
      || [senderProfile?.first_name, senderProfile?.last_name].filter(Boolean).join(' ')
      || senderProfile?.company_name
      || user.email
      || 'Unknown User';
    const recipientName = recipientProfile?.full_name
      || [recipientProfile?.first_name, recipientProfile?.last_name].filter(Boolean).join(' ')
      || recipientProfile?.company_name
      || recipientProfile?.email
      || 'Unknown recipient';

    await sendAdminAlert({
      subject: `New LotScout message from ${senderName}`,
      title: 'New user message',
      rows: [
        ['From', `${senderName}${senderProfile?.email ? ` (${senderProfile.email})` : ''}`],
        ['To', `${recipientName}${recipientProfile?.email ? ` (${recipientProfile.email})` : ''}`],
        ['Message', trimmedBody],
        ['Conversation ID', conversationId],
      ],
      ctaHref: '/admin/messages',
      ctaLabel: 'Open Messages',
      emailType: 'admin_new_message',
      userId: user.id,
    });
  } catch (alertErr) {
    console.error('[api/messages] admin alert failed:', alertErr);
  }

  if (conversationForGate?.seller_id === user.id && conversationForGate.buyer_id) {
    try {
      const buyerHasPaid = await hasPaidMessagingAccess(service, conversationForGate.buyer_id);
      if (!buyerHasPaid) {
        const [{ data: buyerProfile }, { data: listing }] = await Promise.all([
          service
            .from('profiles')
            .select('email, first_name, full_name')
            .eq('id', conversationForGate.buyer_id)
            .maybeSingle(),
          conversationForGate.listing_id
            ? service.from('listings').select('title, street_address, city, state').eq('id', conversationForGate.listing_id).maybeSingle()
            : Promise.resolve({ data: null } as { data: null }),
        ]);

        const buyerEmail = buyerProfile?.email;
        if (buyerEmail) {
          const buyerName = buyerProfile?.full_name || buyerProfile?.first_name || 'there';
          const propertyLabel = listing?.title || [listing?.street_address, listing?.city, listing?.state].filter(Boolean).join(', ') || 'your property inquiry';
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lotscout.com';
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'support@lotscout.com',
            to: buyerEmail,
            subject: 'You have a seller reply waiting — LotScout',
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
                <div style="background:#1B4332;padding:24px 32px;border-radius:12px 12px 0 0">
                  <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
                </div>
                <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                  <h2 style="color:#1B4332;margin-top:0">You have a seller reply waiting</h2>
                  <p>Hi ${escapeHtml(buyerName)},</p>
                  <p>The seller replied to your inquiry about <strong>${escapeHtml(propertyLabel)}</strong>.</p>
                  <p>Upgrade to view the reply and continue the conversation.</p>
                  <p style="margin:28px 0">
                    <a href="${baseUrl}/pricing" style="background:#1D9E75;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;display:inline-block">View Plans →</a>
                  </p>
                  <p style="color:#6b7280;font-size:13px">We do not include seller message contents in email notifications for account security.</p>
                </div>
              </div>
            `,
          });
          await logEmail({
            user_id: conversationForGate.buyer_id,
            to_email: buyerEmail,
            from_email: 'support@lotscout.com',
            subject: 'You have a seller reply waiting — LotScout',
            email_type: 'seller_reply_upgrade_prompt',
          });
        }
      }
    } catch (notifyErr) {
      console.error('[api/messages] seller reply notification failed:', notifyErr);
    }
  }

  // Check if recipient is a test profile — triggers email + admin notification
  console.log('[api/messages] checking test profile for recipientId:', recipientId);
  const { data: recipientProfile, error: profileErr } = await service
    .from('profiles')
    .select('first_name, last_name, full_name, email, is_test_profile')
    .eq('id', recipientId)
    .single();

  console.log('[api/messages] recipient profile result:', { recipientProfile, profileErr });

  if (recipientProfile?.is_test_profile) {
    console.log('[api/messages] test profile — firing email + notification');

    const { data: senderProfile } = await service
      .from('profiles')
      .select('first_name, last_name, full_name, email')
      .eq('id', user.id)
      .single();

    const senderName = senderProfile?.full_name
      || [senderProfile?.first_name, senderProfile?.last_name].filter(Boolean).join(' ')
      || user.email
      || 'Unknown User';
    const senderEmail = senderProfile?.email || user.email || '';

    const recipientName = recipientProfile.full_name
      || [recipientProfile.first_name, recipientProfile.last_name].filter(Boolean).join(' ')
      || 'Sample Buyer';

    // Send email notification
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'support@lotscout.com',
        to: 'support@lotscout.com',
        subject: `New message from ${senderName} to a sample buyer`,
        html: `
          <h2 style="color:#1B4332">Message to Sample Buyer</h2>
          <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
            <tr><td style="font-weight:bold;color:#555">From</td><td>${senderName} (${senderEmail})</td></tr>
            <tr><td style="font-weight:bold;color:#555">To (sample buyer)</td><td>${recipientName}</td></tr>
            <tr><td style="font-weight:bold;color:#555">Message</td><td style="white-space:pre-wrap">${trimmedBody.replace(/</g, '&lt;')}</td></tr>
          </table>
          <p style="margin-top:16px">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/messaging" style="color:#059669;font-weight:bold">
              View in Admin Messaging →
            </a>
          </p>
        `,
      });
      console.log('[api/messages] email sent to support@lotscout.com');
      await logEmail({
        user_id: user.id,
        to_email: 'support@lotscout.com',
        from_email: 'support@lotscout.com',
        subject: `New message from ${senderName} to a sample buyer`,
        email_type: 'test_profile_message',
      });
    } catch (emailErr) {
      console.error('[api/messages] Resend error:', emailErr);
    }

    // Create admin dashboard notification
    try {
      const { error: notifErr } = await service
        .from('notifications')
        .insert({
          type: 'new_message',
          message: `${senderName} messaged ${recipientName}`,
          link: '/admin/messaging',
        });
      if (notifErr) {
        console.error('[api/messages] notification insert error:', notifErr);
      } else {
        console.log('[api/messages] admin notification created');
      }
    } catch (notifErr) {
      console.error('[api/messages] notification insert threw:', notifErr);
    }
  }

  return NextResponse.json({ success: true, conversationId, message: inserted });
}

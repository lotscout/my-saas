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

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ADMIN_EMAILS, isAdminEmail } from '@/lib/admin';
import { checkIsAdmin } from '@/lib/admin-server';
import { getBuyerName } from '@/lib/getBuyerName';
import { getSellerName } from '@/lib/getSellerName';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  is_admin: boolean | null;
};

function buyerDisplay(p: ProfileRow): string {
  return getBuyerName({
    first_name: p.first_name,
    last_name: p.last_name,
    display_company: p.company_name,
    display_name: p.full_name,
    profiles: { first_name: p.first_name, last_name: p.last_name, company_name: p.company_name },
  });
}
function sellerDisplay(p: ProfileRow): string {
  return getSellerName({
    owner_name: null,
    profiles: { first_name: p.first_name, last_name: p.last_name, full_name: p.full_name, company_name: p.company_name },
  });
}

// GET /api/admin/messages/thread/[id] → full ordered thread for one conversation.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkIsAdmin(_req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const service = createServiceClient();

  // Only columns that actually exist on the production messages table.
  const { data: rows, error } = await service
    .from('messages')
    .select('id, conversation_id, sender_id, body, is_read, read_at, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: conv } = await service
    .from('conversations')
    .select('id, buyer_id, seller_id, listing_id, subject, status')
    .eq('id', id)
    .maybeSingle();

  const messages = rows ?? [];

  const senderIds = [...new Set(messages.map(m => m.sender_id).filter((x): x is string => !!x))];
  const participantIds = new Set<string>(senderIds);
  if (conv?.buyer_id) participantIds.add(conv.buyer_id);
  if (conv?.seller_id) participantIds.add(conv.seller_id);

  const { data: profRows } = participantIds.size
    ? await service
        .from('profiles')
        .select('id, first_name, last_name, full_name, company_name, email, is_admin')
        .in('id', [...participantIds])
    : { data: [] };
  const profMap = new Map<string, ProfileRow>();
  for (const p of profRows ?? []) profMap.set(p.id, p as ProfileRow);

  const buyerProfile = conv?.buyer_id ? profMap.get(conv.buyer_id) : undefined;
  const sellerProfile = conv?.seller_id ? profMap.get(conv.seller_id) : undefined;
  const buyerName = buyerProfile ? buyerDisplay(buyerProfile) : 'Buyer';
  const sellerName = sellerProfile ? sellerDisplay(sellerProfile) : 'Seller';

  // A message is admin/support when its sender is neither the buyer nor the seller,
  // or the sender profile is flagged admin / in the admin allow-list. No schema column
  // needed — works with the real messages table.
  function isAdminSender(senderId: string | null): boolean {
    if (!senderId) return false;
    if (conv && (senderId === conv.buyer_id || senderId === conv.seller_id)) return false;
    const p = profMap.get(senderId);
    if (p?.is_admin) return true;
    if (p?.email && ADMIN_EMAILS.includes(p.email)) return true;
    // Sender is not a participant of this conversation → treat as support/admin.
    return true;
  }

  const enriched = messages.map(m => {
    const admin = isAdminSender(m.sender_id);
    let role: 'buyer' | 'seller' | 'admin';
    let senderName: string;
    if (admin) { role = 'admin'; senderName = 'LotScout Support'; }
    else if (conv && m.sender_id === conv.seller_id) { role = 'seller'; senderName = sellerName; }
    else { role = 'buyer'; senderName = buyerName; }

    const recipientName =
      role === 'admin' ? `${buyerName} & ${sellerName}`
      : role === 'buyer' ? sellerName
      : buyerName;

    return {
      id: m.id,
      sender_id: m.sender_id,
      body: m.body,
      created_at: m.created_at,
      is_read: m.is_read ?? false,
      read_at: m.read_at ?? null,
      role,
      is_admin: admin,
      sender_name: senderName,
      recipient_name: recipientName,
    };
  });

  return NextResponse.json({
    messages: enriched,
    conversation: conv
      ? {
          id: conv.id,
          subject: conv.subject,
          status: conv.status,
          buyer: { id: conv.buyer_id, name: buyerName, email: buyerProfile?.email ?? null },
          seller: { id: conv.seller_id, name: sellerName, email: sellerProfile?.email ?? null },
          listing_id: conv.listing_id,
        }
      : null,
  });
}

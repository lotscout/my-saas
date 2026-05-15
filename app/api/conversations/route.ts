import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  email?: string | null;
};

type ListingRow = {
  id: string;
  title: string | null;
  county: string | null;
  state: string | null;
  lot_size_acres: number | null;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();

  const { data: convs, error } = await supabase
    .from('conversations')
    .select('id, subject, last_message_at, last_message_preview, status, listing_id, buyer_id, seller_id')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .neq('status', 'blocked')
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!convs?.length) return NextResponse.json({ conversations: [] });

  const otherIds = [
    ...new Set(
      convs
        .map(c => (c.buyer_id === user.id ? c.seller_id : c.buyer_id))
        .filter((id): id is string => !!id)
    ),
  ];
  const listingIds = [
    ...new Set(convs.map(c => c.listing_id).filter((id): id is string => !!id)),
  ];

  const { data: profileRows } = await service
    .from('profiles')
    .select('id, first_name, last_name, company_name, avatar_url, email')
    .in('id', otherIds);

  const profileMap: Record<string, ProfileRow> = {};
  for (const p of profileRows ?? []) profileMap[p.id] = p;

  // For participants with no display name, fall back to auth user data
  const namelessIds = otherIds.filter(id => {
    const p = profileMap[id];
    return !p?.company_name && !p?.first_name && !p?.last_name;
  });

  if (namelessIds.length > 0) {
    await Promise.all(
      namelessIds.map(async id => {
        const { data } = await service.auth.admin.getUserById(id);
        const authUser = data?.user;
        if (!profileMap[id]) {
          profileMap[id] = { id, first_name: null, last_name: null, company_name: null, avatar_url: null };
        }
        // Fill email from auth if not already stored on profile
        if (!profileMap[id].email) {
          profileMap[id].email = authUser?.email ?? null;
        }
        // Also pull name fields from auth metadata for accounts whose profile
        // row was created without going through the handle_new_user trigger
        const meta = (authUser?.raw_user_meta_data ?? {}) as Record<string, unknown>;
        if (!profileMap[id].company_name && meta.company_name) {
          profileMap[id].company_name = meta.company_name as string;
        }
        if (!profileMap[id].first_name && meta.first_name) {
          profileMap[id].first_name = meta.first_name as string;
        }
        if (!profileMap[id].last_name && meta.last_name) {
          profileMap[id].last_name = meta.last_name as string;
        }
      })
    );
  }

  const listingMap: Record<string, ListingRow> = {};
  if (listingIds.length > 0) {
    const { data: listings } = await service
      .from('listings')
      .select('id, title, county, state, lot_size_acres')
      .in('id', listingIds);
    for (const l of listings ?? []) listingMap[l.id] = l;
  }

  const enriched = convs.map(c => {
    const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
    return {
      id: c.id,
      buyer_id: c.buyer_id,
      seller_id: c.seller_id,
      subject: c.subject,
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
      status: c.status,
      listing_id: c.listing_id,
      other_participant: otherId
        ? (profileMap[otherId] ?? {
            id: otherId,
            first_name: null,
            last_name: null,
            company_name: null,
            avatar_url: null,
            email: null,
          })
        : null,
      listing: c.listing_id ? (listingMap[c.listing_id] ?? null) : null,
    };
  });

  return NextResponse.json({ conversations: enriched });
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isBadName } from '@/lib/getSellerName';

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  full_name?: string | null;
};

type BuyerRequestNameRow = {
  user_id: string;
  display_name: string | null;
  display_company: string | null;
  created_at: string | null;
};

type ListingRow = {
  id: string;
  title: string | null;
  street_address: string | null;
  county: string | null;
  state: string | null;
  lot_size_acres: number | null;
  asking_price: number | null;
  seller_first_name: string | null;
  seller_last_name: string | null;
};

function hasStoredName(p: ProfileRow | undefined): boolean {
  return !!(p?.company_name || p?.first_name || p?.last_name || p?.full_name);
}

function isDisplayableName(value: string | null | undefined): boolean {
  const candidate = (value ?? '').trim();
  return !!candidate && candidate.toLowerCase() !== 'user' && !isBadName(candidate);
}

function hasDisplayablePersonOrCompanyName(p: ProfileRow | null | undefined): boolean {
  if (!p) return false;
  return [
    p.company_name,
    [p.first_name, p.last_name].filter(Boolean).join(' '),
    p.full_name,
  ].some(isDisplayableName);
}

function splitName(name: string | null | undefined): { first_name: string | null; last_name: string | null } {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: null, last_name: null };
  if (parts.length === 1) return { first_name: parts[0], last_name: null };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

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

  // Determine the other participant ID for each conversation (not the current user)
  const otherIds = [
    ...new Set(
      convs
        .map(c => (c.buyer_id === user.id ? c.seller_id : c.buyer_id))
        .filter((id): id is string => !!id && id !== user.id)
    ),
  ];
  const listingIds = [
    ...new Set(convs.map(c => c.listing_id).filter((id): id is string => !!id)),
  ];
  const buyerIds = [
    ...new Set(convs.map(c => c.buyer_id).filter((id): id is string => !!id)),
  ];

  // Fetch other participants' stored profiles
  const { data: profileRows } = await service
    .from('profiles')
    .select('id, first_name, last_name, full_name, company_name, avatar_url, email')
    .in('id', otherIds);

  // profileMap is enriched progressively; dbProfileMap captures what came from the DB row only
  const profileMap: Record<string, ProfileRow> = {};
  const dbProfileMap: Record<string, ProfileRow> = {};
  for (const p of profileRows ?? []) {
    profileMap[p.id] = { ...p };
    dbProfileMap[p.id] = { ...p };
  }

  // For participants with no stored name in profiles, fall back to auth user metadata
  const namelessIds = otherIds.filter(id => !hasStoredName(profileMap[id]));

  if (namelessIds.length > 0) {
    await Promise.all(
      namelessIds.map(async id => {
        const { data } = await service.auth.admin.getUserById(id);
        const authUser = data?.user;
        if (!profileMap[id]) {
          profileMap[id] = { id, first_name: null, last_name: null, company_name: null, avatar_url: null };
        }
        if (!profileMap[id].email) {
          profileMap[id].email = authUser?.email ?? null;
        }
        const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;
        if (!profileMap[id].company_name && meta.company_name) {
          profileMap[id].company_name = meta.company_name as string;
        }
        if (!profileMap[id].first_name && meta.first_name) {
          profileMap[id].first_name = meta.first_name as string;
        }
        if (!profileMap[id].last_name && meta.last_name) {
          profileMap[id].last_name = meta.last_name as string;
        }
        if (!profileMap[id].full_name && typeof meta.full_name === 'string') {
          profileMap[id].full_name = meta.full_name;
        }
        if (!hasStoredName(profileMap[id]) && typeof meta.name === 'string') {
          const { first_name, last_name } = splitName(meta.name);
          profileMap[id].first_name = first_name;
          profileMap[id].last_name = last_name;
        }
      })
    );
  }

  // Buyer Directory cards can carry the buyer-facing display name even when the
  // auth/profile row is blank. Use the newest request per buyer as a fallback so
  // seller inboxes show "John S." / company instead of generic "User".
  const buyerRequestNameMap: Record<string, BuyerRequestNameRow> = {};
  if (buyerIds.length > 0) {
    const { data: buyerRequests } = await service
      .from('buyer_requests')
      .select('user_id, display_name, display_company, created_at')
      .in('user_id', buyerIds)
      .order('created_at', { ascending: false });

    for (const br of (buyerRequests ?? []) as BuyerRequestNameRow[]) {
      if (!buyerRequestNameMap[br.user_id] && (br.display_company || br.display_name)) {
        buyerRequestNameMap[br.user_id] = br;
      }
    }
  }

  // Fetch listings — includes seller name fields for name fallback and address/price for display
  const listingMap: Record<string, ListingRow> = {};
  if (listingIds.length > 0) {
    const { data: listings } = await service
      .from('listings')
      .select('id, title, street_address, county, state, lot_size_acres, asking_price, seller_first_name, seller_last_name')
      .in('id', listingIds);
    for (const l of listings ?? []) listingMap[l.id] = l as ListingRow;
  }

  const enriched = convs.map(c => {
    const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
    const listing = c.listing_id ? (listingMap[c.listing_id] ?? null) : null;

    // Guard against self-conversations (buyer_id === seller_id === user.id)
    const resolvedOtherId = otherId && otherId !== user.id ? otherId : null;

    let otherProfile: ProfileRow | null = resolvedOtherId
      ? (profileMap[resolvedOtherId] ?? {
          id: resolvedOtherId,
          first_name: null,
          last_name: null,
          company_name: null,
          avatar_url: null,
          email: null,
        })
      : null;

    // Name priority:
    //   1. DB-stored profile company_name  (explicit business entity — never overridden)
    //   2. Listing seller_first_name + seller_last_name  (real deal seller, beats signup-trigger names)
    //   3. Buyer request display_company/display_name for buyer-directory conversations
    //   4. Profile first_name + last_name / auth-metadata name
    //   5. Email
    //
    // The signup trigger copies auth metadata first_name/last_name into the profiles row,
    // so test accounts like "FB Buyer" have a stored name in the DB. We must NOT let that
    // block the listing seller name, so we only guard on company_name (a real business entity).
    if (
      otherProfile &&
      resolvedOtherId === c.seller_id &&
      listing &&
      (listing.seller_first_name || listing.seller_last_name) &&
      !dbProfileMap[resolvedOtherId]?.company_name
    ) {
      otherProfile = {
        ...otherProfile,
        company_name: null, // clear any auth-metadata company_name
        first_name: listing.seller_first_name,
        last_name: listing.seller_last_name,
      };
    }

    if (
      otherProfile &&
      resolvedOtherId === c.buyer_id &&
      !hasDisplayablePersonOrCompanyName(otherProfile) &&
      buyerRequestNameMap[resolvedOtherId]
    ) {
      const buyerRequestName = buyerRequestNameMap[resolvedOtherId];
      const split = splitName(buyerRequestName.display_name);
      otherProfile = {
        ...otherProfile,
        company_name: buyerRequestName.display_company,
        first_name: split.first_name,
        last_name: split.last_name,
      };
    }

    return {
      id: c.id,
      buyer_id: c.buyer_id,
      seller_id: c.seller_id,
      subject: c.subject,
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
      status: c.status,
      listing_id: c.listing_id,
      other_participant: otherProfile,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            street_address: listing.street_address,
            county: listing.county,
            state: listing.state,
            lot_size_acres: listing.lot_size_acres,
            asking_price: listing.asking_price,
          }
        : null,
    };
  });

  return NextResponse.json({ conversations: enriched });
}

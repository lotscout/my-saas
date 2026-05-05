/*
  Run this SQL in Supabase dashboard (SQL Editor) before using favorites:

  create table if not exists saved_listings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    listing_id uuid references listings(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique (user_id, listing_id)
  );
  alter table saved_listings enable row level security;
  create policy "Users can manage own favorites"
    on saved_listings for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
*/

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/favorites — returns listing_ids the user has saved
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorites: [] });

  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorites: (data ?? []).map((r) => r.listing_id) });
}

// POST /api/favorites — toggle a listing (saves or removes)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listing_id } = await request.json();
  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listing_id)
    .single();

  if (existing) {
    // Remove
    await supabase.from('saved_listings').delete().eq('id', existing.id);
    return NextResponse.json({ saved: false });
  } else {
    // Save
    await supabase.from('saved_listings').insert({ user_id: user.id, listing_id });
    return NextResponse.json({ saved: true });
  }
}

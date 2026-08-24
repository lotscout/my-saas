import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const service = createServiceClient();
  const { data, error } = await service
    .from('profiles')
    .select('id, first_name, last_name, full_name, company_name, avatar_url, email, phone, website, contact_visible')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const contactVisible = data.contact_visible === true;

  return NextResponse.json({
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    full_name: data.full_name,
    company_name: data.company_name,
    avatar_url: data.avatar_url,
    contact_visible: contactVisible,
    email: contactVisible ? data.email : null,
    phone: contactVisible ? data.phone : null,
    website: contactVisible ? data.website : null,
  });
}

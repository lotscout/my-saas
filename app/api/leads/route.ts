import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { findProfaneField, profanityError } from '@/lib/profanity-validation';
import { sendAdminAlert } from '@/lib/admin-alerts';

export const dynamic = 'force-dynamic';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email: string) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatCurrency(value: number | null) {
  return value ? `$${value.toLocaleString()}` : 'Not provided';
}

function parseAddressLocation(address: string) {
  const parts = address.split(',').map(part => part.trim()).filter(Boolean);
  const possibleState = parts.length >= 2 ? parts[parts.length - 1].match(/\b([A-Z]{2})\b/)?.[1] ?? null : null;
  const possibleCity = parts.length >= 2 ? parts[parts.length - 2] : null;
  return { city: possibleCity, state: possibleState };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await createClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const streetAddress = clean(body.streetAddress);
    const apn = clean(body.apn);
    const lotSizeUnit = clean(body.lotSizeUnit) === 'sqft' ? 'sqft' : 'acres';
    const lotSizeValue = Number(body.lotSizeValue);
    const askingPrice = Number(body.askingPrice);
    const priceNegotiable = Boolean(body.priceNegotiable);
    const contactName = clean(body.contactName);
    const contactEmail = clean(body.contactEmail).toLowerCase();
    const contactPhone = clean(body.contactPhone);
    const notes = clean(body.notes);

    if (!streetAddress && !apn) {
      return NextResponse.json({ error: 'Enter an address or APN.' }, { status: 400 });
    }
    if (!Number.isFinite(lotSizeValue) || lotSizeValue <= 0) {
      return NextResponse.json({ error: 'Enter a valid lot size.' }, { status: 400 });
    }
    if (!Number.isFinite(askingPrice) || askingPrice < 0) {
      return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
    }
    if (!contactName) {
      return NextResponse.json({ error: 'Contact name is required.' }, { status: 400 });
    }
    if (!contactEmail && !contactPhone) {
      return NextResponse.json({ error: 'Enter a contact email or phone number.' }, { status: 400 });
    }
    if (!isValidEmail(contactEmail)) {
      return NextResponse.json({ error: 'Enter a valid contact email.' }, { status: 400 });
    }

    const profaneField = findProfaneField([
      { label: 'address', value: streetAddress },
      { label: 'APN', value: apn },
      { label: 'contact name', value: contactName },
      { label: 'notes', value: notes },
    ]);
    if (profaneField) {
      return NextResponse.json({ error: profanityError(profaneField) }, { status: 400 });
    }

    const lotSizeAcres = lotSizeUnit === 'acres'
      ? lotSizeValue
      : Number((lotSizeValue / 43560).toFixed(6));
    const lotSizeSqft = lotSizeUnit === 'sqft'
      ? Math.round(lotSizeValue)
      : Math.round(lotSizeValue * 43560);

    const service = createServiceClient();
    const { data: profile } = await service
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const submitterName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
    const title = streetAddress || `APN ${apn}`;
    const parsedLocation = parseAddressLocation(streetAddress);
    const descriptionLines = [
      'Lead submitted through LotScout Leads.',
      `Contact: ${contactName}`,
      contactEmail ? `Contact email: ${contactEmail}` : null,
      contactPhone ? `Contact phone: ${contactPhone}` : null,
      `Price negotiable: ${priceNegotiable ? 'Yes' : 'No'}`,
      notes ? `Notes: ${notes}` : null,
    ].filter(Boolean).join('\n');

    const { data: lead, error: insertError } = await service
      .from('listings')
      .insert({
        user_id: user.id,
        owner_name: submitterName || profile?.email || user.email || contactName,
        status: 'pending_review',
        ownership_type: 'property_lead',
        title,
        property_description: descriptionLines,
        city: parsedLocation.city,
        state: parsedLocation.state,
        street_address: streetAddress || null,
        apn: apn || null,
        lot_size_acres: lotSizeAcres,
        lot_size_sqft: lotSizeSqft,
        asking_price: askingPrice,
        price_negotiable: priceNegotiable,
        additional_information: descriptionLines,
        contact_methods: [
          contactEmail ? 'email' : null,
          contactPhone ? 'phone' : null,
        ].filter(Boolean),
        photos_urls: [],
        legal_confirmation: false,
        platform_understanding: true,
        state_compliance: false,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[POST /api/leads] insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await sendAdminAlert({
      toEmail: 'support@lotscout.com',
      fromEmail: 'LotScout <hello@lotscout.com>',
      subject: 'New property lead submitted — LotScout',
      title: 'New property lead submitted',
      rows: [
        ['Submitted by', submitterName || profile?.email || user.email || user.id],
        ['Lead', title],
        ['APN', apn || null],
        ['Lot size', `${lotSizeValue.toLocaleString()} ${lotSizeUnit === 'sqft' ? 'sq ft' : 'acres'}`],
        ['Price', formatCurrency(askingPrice)],
        ['Negotiable', priceNegotiable ? 'Yes' : 'No'],
        ['Contact', contactName],
        ['Contact email', contactEmail || null],
        ['Contact phone', contactPhone || null],
      ],
      ctaHref: '/admin/listings',
      ctaLabel: 'Review lead',
      emailType: 'property_lead_submitted_admin_review',
      userId: user.id,
    });

    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/leads] unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

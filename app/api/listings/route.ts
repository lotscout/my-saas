import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { containsProfanity } from '@/lib/profanity-filter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const limit = Math.min(Number(searchParams.get('limit') ?? '550'), 550);

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('listings')
      .select('id,title,state,county,zip_code,lot_size_acres,asking_price,zoning,road_access,utilities,photos_urls,user_id,created_at,status,lat,lng')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search.trim()) {
      const q = search.trim();
      query = query.or(`title.ilike.%${q}%,state.ilike.%${q}%,county.ilike.%${q}%,zip_code.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ listings: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const textFields: [string, string][] = [
      ['title', body.title],
      ['property_description', body.propertyDescription],
      ['additional_information', body.additionalInformation],
    ];
    for (const [, value] of textFields) {
      if (value && containsProfanity(value)) {
        return NextResponse.json(
          { error: 'Your submission contains inappropriate language. Please review and resubmit.' },
          { status: 400 }
        );
      }
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        status: 'pending_review',
        ownership_type: body.ownershipType,
        ownership_certified: body.ownershipCertified,
        title: body.title,
        property_description: body.propertyDescription,
        state: body.state,
        county: body.county,
        zip_code: body.zipCode,
        street_address: body.streetAddress || null,
        apn: body.apn || null,
        lot_size_acres: body.lotSizeUnit === 'acres' ? Number(body.lotSizeValue) || null : null,
        lot_size_sqft: body.lotSizeUnit === 'sqft' ? Number(body.lotSizeValue) || null : null,
        zoning: body.zoning,
        road_access: body.roadAccess,
        utilities: body.utilities,
        asking_price: Number(body.askingPrice),
        comparable_market_value: body.comparableMarketValue ? Number(body.comparableMarketValue) : null,
        price_negotiable: body.priceNegotiable,
        preferred_close_date: body.preferredCloseDate || null,
        additional_information: body.additionalInformation || null,
        contact_methods: body.contactMethods,
        photos_urls: body.photosUrls,
        contract_url: body.contractUrl || null,
        legal_confirmation: body.legalConfirmation,
        platform_understanding: body.platformUnderstanding,
        state_compliance: body.stateCompliance,
        digital_signature: body.digitalSignature,
        signature_date: body.signatureDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Listing insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send emails via Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const submitterName = body.digitalSignature;
      const submitterEmail = user.email;
      const acreage = body.lotSizeUnit === 'acres'
        ? `${body.lotSizeValue} acres`
        : `${body.lotSizeValue} sqft`;
      const price = `$${Number(body.askingPrice).toLocaleString()}`;
      const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

      await resend.emails.send({
        from: 'support@lotscout.com',
        to: 'support@lotscout.com',
        subject: 'New Listing Submitted — Review Required',
        html: `
          <h2 style="color:#1B4332">New Listing Submitted — Review Required</h2>
          <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
            <tr><td style="font-weight:bold;color:#666">Submitter</td><td>${submitterName}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Email</td><td>${submitterEmail}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Property Title</td><td>${body.title}</td></tr>
            <tr><td style="font-weight:bold;color:#666">State</td><td>${body.state}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Acreage</td><td>${acreage}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Asking Price</td><td>${price}</td></tr>
            <tr><td style="font-weight:bold;color:#666">Submitted</td><td>${submittedAt} CT</td></tr>
          </table>
          <p style="color:#d97706;font-weight:bold;margin-top:16px">⚠ Review within 24 hours</p>
        `,
      });

      if (submitterEmail) {
        await resend.emails.send({
          from: 'support@lotscout.com',
          to: submitterEmail,
          subject: 'Your listing has been submitted — LotScout',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#1B4332;padding:24px 32px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">LotScout</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
                <h2 style="color:#1B4332;margin-top:0">Listing Submitted!</h2>
                <p>Hi ${submitterName},</p>
                <p>Your listing <strong>${body.title}</strong> has been successfully submitted for review.</p>
                <p>Our team will review your listing within <strong>24 hours</strong> and you'll receive an update by email.</p>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:24px 0">
                  <p style="margin:0 0 4px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Property</p>
                  <p style="margin:0;font-weight:bold;color:#1B4332">${body.title}</p>
                  <p style="margin:4px 0 0;color:#6b7280;font-size:14px">${body.state} · ${acreage} · ${price}</p>
                </div>
                <p style="color:#6b7280;font-size:13px">Questions? Reply to this email or visit <a href="https://lotscout.com" style="color:#059669">lotscout.com</a>.</p>
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    return NextResponse.json({ success: true, listingId: listing.id });
  } catch (err) {
    console.error('Listing route error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

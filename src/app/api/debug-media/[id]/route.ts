import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const diagnostics: Record<string, any> = { __version: 'v2-raw-table' };

  // 1. Check the view (graphql_listings)
  const { data: viewData, error: viewError } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, preferred_photo, media')
    .or(`id.eq.${id},listing_id.eq.${id}`)
    .limit(1);

  if (viewError) {
    diagnostics.viewError = viewError.message;
  } else if (viewData?.[0]) {
    const r = viewData[0];
    const rawMedia: any = r.media;
    diagnostics.view = {
      id: r.id,
      listing_id: r.listing_id,
      preferred_photo: r.preferred_photo,
      media_is_null: rawMedia === null,
      media_typeof: typeof rawMedia,
      media_preview: rawMedia === null ? null : (typeof rawMedia === 'string' ? rawMedia.slice(0, 300) : JSON.stringify(rawMedia).slice(0, 300)),
    };
  } else {
    diagnostics.view = 'NOT FOUND';
  }

  // 2. Check the raw rc-listings table — look for photo/media columns
  const { data: rawData, error: rawError } = await supabase
    .from('rc-listings')
    .select('id, "ListingId", "PrefferedPhoto", "Media", "StandardStatus", "MlsStatus", "Status", "UnparsedAddress", "City"')
    .or(`id.eq.${id},"ListingId".eq.${id}`)
    .limit(2);

  if (rawError) {
    diagnostics.rawTableError = rawError.message;
    // If column doesn't exist, try without PrefferedPhoto
    const { data: rawData2, error: rawError2 } = await supabase
      .from('rc-listings')
      .select('id, "ListingId", "Media", "StandardStatus", "MlsStatus", "Status", "UnparsedAddress"')
      .or(`id.eq.${id},"ListingId".eq.${id}`)
      .limit(2);

    if (rawError2) {
      diagnostics.rawTableError2 = rawError2.message;
    } else {
      diagnostics.rawRows = (rawData2 || []).map((r: any) => ({
        id: r.id,
        ListingId: r.ListingId,
        Status: r.Status,
        StandardStatus: r.StandardStatus,
        MlsStatus: r.MlsStatus,
        address: r.UnparsedAddress,
        media_is_null: r.Media === null,
        media_typeof: typeof r.Media,
        media_preview: r.Media === null ? null : (typeof r.Media === 'string' ? r.Media.slice(0, 300) : JSON.stringify(r.Media).slice(0, 300)),
      }));
    }
  } else {
    diagnostics.rawRows = (rawData || []).map((r: any) => ({
      id: r.id,
      ListingId: r.ListingId,
      PrefferedPhoto: r.PrefferedPhoto,
      Status: r.Status,
      StandardStatus: r.StandardStatus,
      MlsStatus: r.MlsStatus,
      address: r.UnparsedAddress,
      city: r.City,
      media_is_null: r.Media === null,
      media_typeof: typeof r.Media,
      media_isArray: Array.isArray(r.Media),
      media_preview: r.Media === null ? null : (typeof r.Media === 'string' ? r.Media.slice(0, 300) : JSON.stringify(r.Media).slice(0, 300)),
    }));
  }

  // 3. Check media_lookup table
  const listingId = viewData?.[0]?.listing_id || id;
  const { data: lookupData, error: lookupError } = await supabase
    .from('media_lookup')
    .select('listing_id, media')
    .eq('listing_id', listingId)
    .limit(1);

  if (lookupError) {
    diagnostics.mediaLookupError = lookupError.message;
  } else {
    diagnostics.mediaLookup = (lookupData || []).map((r: any) => ({
      listing_id: r.listing_id,
      media_is_null: r.media === null,
      media_typeof: typeof r.media,
      media_preview: r.media === null ? null : (typeof r.media === 'string' ? r.media.slice(0, 300) : JSON.stringify(r.media).slice(0, 300)),
    }));
  }

  return NextResponse.json(diagnostics);
}

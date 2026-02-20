import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {
    __version: 'v4-media-inspect',
    __timestamp: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is null' });
  }

  // 1. Find an active listing from the VIEW and show its media column
  const { data: activeFromView, error: viewError } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, address, city, media, preferred_photo')
    .eq('status', 'Active')
    .limit(3);

  diagnostics.activeFromView = {
    error: viewError?.message || null,
    count: activeFromView?.length || 0,
    rows: (activeFromView || []).map((r: any) => ({
      id: r.id,
      listing_id: r.listing_id,
      status: r.status,
      address: r.address,
      media_is_null: r.media === null,
      media_typeof: typeof r.media,
      media_isArray: Array.isArray(r.media),
      media_preview: r.media === null ? null : (typeof r.media === 'string' ? r.media.slice(0, 500) : JSON.stringify(r.media).slice(0, 500)),
    })),
  };

  // 2. Get column names from rc-listings for a sample row
  const { data: rawSample, error: rawError } = await supabase
    .from('rc-listings')
    .select('id, "ListingId", "StandardStatus", "Media", "PreferredPhoto", "PrefferedPhoto"')
    .not('StandardStatus', 'is', null)
    .eq('StandardStatus', 'Active')
    .limit(3);

  diagnostics.rawActiveListings = {
    error: rawError?.message || null,
    count: rawSample?.length || 0,
    rows: (rawSample || []).map((r: any) => ({
      id: r.id,
      ListingId: r.ListingId,
      StandardStatus: r.StandardStatus,
      Media_is_null: r.Media === null,
      Media_typeof: typeof r.Media,
      Media_preview: r.Media === null ? null : (typeof r.Media === 'string' ? r.Media.slice(0, 500) : JSON.stringify(r.Media).slice(0, 500)),
      PreferredPhoto: r.PreferredPhoto,
      PrefferedPhoto: r.PrefferedPhoto,
    })),
  };

  // 3. Find ANY row in rc-listings that has non-null Media
  const { data: anyMedia, error: anyMediaError } = await supabase
    .from('rc-listings')
    .select('id, "ListingId", "StandardStatus", "Media"')
    .not('Media', 'is', null)
    .limit(2);

  diagnostics.anyRowWithMedia = {
    error: anyMediaError?.message || null,
    count: anyMedia?.length || 0,
    rows: (anyMedia || []).map((r: any) => ({
      id: r.id,
      ListingId: r.ListingId,
      status: r.StandardStatus,
      media_preview: typeof r.Media === 'string' ? r.Media.slice(0, 500) : JSON.stringify(r.Media).slice(0, 500),
    })),
  };

  // 4. Get all column names that contain photo/media/image (from any row with StandardStatus=Active)
  const { data: fullRow, error: fullRowError } = await supabase
    .from('rc-listings')
    .select('*')
    .eq('StandardStatus', 'Active')
    .limit(1);

  if (fullRowError) {
    diagnostics.columnInspection = { error: fullRowError.message };
  } else if (fullRow?.[0]) {
    const allCols = Object.keys(fullRow[0]);
    const mediaCols = allCols.filter((k) => /photo|media|image|picture|thumb/i.test(k));
    const mediaColValues: Record<string, any> = {};
    for (const col of mediaCols) {
      const val = (fullRow[0] as any)[col];
      mediaColValues[col] = {
        is_null: val === null,
        typeof: typeof val,
        preview: val === null ? null : (typeof val === 'string' ? val.slice(0, 300) : JSON.stringify(val).slice(0, 300)),
      };
    }
    diagnostics.columnInspection = {
      totalColumns: allCols.length,
      mediaRelatedColumns: mediaCols,
      mediaColumnValues: mediaColValues,
    };
  } else {
    diagnostics.columnInspection = { noActiveRowFound: true, error: null };
  }

  return NextResponse.json(diagnostics);
}

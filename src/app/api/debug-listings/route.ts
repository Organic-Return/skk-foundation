import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {
    __version: 'v5-media-coverage',
    __timestamp: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is null' });
  }

  // 1. Count active listings with and without media in the VIEW
  const { count: activeWithMedia } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')
    .not('media', 'is', null);

  const { count: activeWithoutMedia } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')
    .is('media', null);

  const { count: totalActive } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active');

  diagnostics.activeCoverage = {
    totalActive,
    activeWithMedia,
    activeWithoutMedia,
  };

  // 2. Sample active listings WITHOUT media (the ones showing no photos)
  const { data: noMediaSample } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, address, city, media')
    .eq('status', 'Active')
    .is('media', null)
    .order('listing_date', { ascending: false })
    .limit(5);

  diagnostics.activeNoMedia = (noMediaSample || []).map((r: any) => ({
    id: r.id,
    listing_id: r.listing_id,
    address: r.address,
    city: r.city,
  }));

  // 3. Sample active listings WITH media (working ones)
  const { data: withMediaSample } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, address, city')
    .eq('status', 'Active')
    .not('media', 'is', null)
    .limit(5);

  diagnostics.activeWithMediaSample = (withMediaSample || []).map((r: any) => ({
    id: r.id,
    listing_id: r.listing_id,
    address: r.address,
    city: r.city,
  }));

  // 4. Check media_lookup table coverage for active listings
  // Get listing_ids of active listings without media
  const noMediaListingIds = (noMediaSample || []).map((r: any) => r.listing_id).filter(Boolean);
  if (noMediaListingIds.length > 0) {
    const { data: lookupCheck } = await supabase
      .from('media_lookup')
      .select('listing_id')
      .in('listing_id', noMediaListingIds);

    diagnostics.mediaLookupForMissing = {
      checkedIds: noMediaListingIds,
      foundInLookup: (lookupCheck || []).map((r: any) => r.listing_id),
    };
  }

  // 5. Check rc-listings raw Media column for those same listings
  if (noMediaListingIds.length > 0) {
    const { data: rawCheck, error: rawError } = await supabase
      .from('rc-listings')
      .select('id, "ListingId", "Media", "MlsStatus", "Status"')
      .in('ListingId', noMediaListingIds)
      .limit(5);

    diagnostics.rawMediaForMissing = {
      error: rawError?.message || null,
      rows: (rawCheck || []).map((r: any) => ({
        id: r.id,
        ListingId: r.ListingId,
        MlsStatus: r.MlsStatus,
        Status: r.Status,
        Media_is_null: r.Media === null,
        Media_typeof: typeof r.Media,
        Media_preview: r.Media === null ? null : (typeof r.Media === 'string' ? r.Media.slice(0, 300) : JSON.stringify(r.Media).slice(0, 300)),
      })),
    };
  }

  return NextResponse.json(diagnostics);
}

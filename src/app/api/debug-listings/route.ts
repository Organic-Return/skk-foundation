import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { getMLSConfiguration, getAllowedCities, getExcludedStatuses } from '@/lib/mlsConfiguration';
import { getListings } from '@/lib/listings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const diagnostics: Record<string, any> = {
    __version: 'v3-getListings-test',
    __timestamp: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is null' });
  }

  // 1. Total count (no filters at all)
  const { count: totalCount, error: countError } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true });

  diagnostics.totalRows = totalCount;
  diagnostics.countError = countError?.message || null;

  // 2. MLS Configuration from Sanity
  const mlsConfig = await getMLSConfiguration();
  const excludedStatuses = getExcludedStatuses(mlsConfig);
  const allowedCities = getAllowedCities(mlsConfig);

  diagnostics.mlsConfig = {
    exists: !!mlsConfig,
    raw: mlsConfig,
    allowedCities,
    excludedStatuses,
  };

  // 3. Compute what the LISTINGS PAGE would use (same logic as page.tsx)
  const allExcludedStatuses = mlsConfig
    ? [...new Set([...excludedStatuses, 'Closed', 'Sold'])]
    : excludedStatuses;
  diagnostics.listingsPageExcludedStatuses = allExcludedStatuses;
  diagnostics.mlsConfigIsTruthy = !!mlsConfig;

  // 4. Call getListings directly with NO filters to see what comes back
  const noFilterResult = await getListings(1, 5, {});
  diagnostics.getListingsNoFilters = {
    total: noFilterResult.total,
    count: noFilterResult.listings.length,
    first: noFilterResult.listings.slice(0, 2).map((l) => ({
      id: l.id,
      mls_number: l.mls_number,
      address: l.address,
      city: l.city,
      status: l.status,
      list_price: l.list_price,
      photos_count: l.photos.length,
    })),
  };

  // 5. Call getListings with the same filters the page would use
  const pageResult = await getListings(1, 5, {
    excludedStatuses: allExcludedStatuses,
  });
  diagnostics.getListingsWithPageFilters = {
    total: pageResult.total,
    count: pageResult.listings.length,
    appliedExcludedStatuses: allExcludedStatuses,
    first: pageResult.listings.slice(0, 2).map((l) => ({
      id: l.id,
      mls_number: l.mls_number,
      address: l.address,
      city: l.city,
      status: l.status,
      list_price: l.list_price,
    })),
  };

  // 6. Sample statuses and cities from raw data
  const { data: statusSample } = await supabase
    .from('graphql_listings')
    .select('status')
    .not('status', 'is', null)
    .limit(200);

  const statusCounts: Record<string, number> = {};
  (statusSample || []).forEach((r: any) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });
  diagnostics.distinctStatuses = statusCounts;

  return NextResponse.json(diagnostics);
}

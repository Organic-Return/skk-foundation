import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { getListings } from '@/lib/listings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mls = searchParams.get('mls') || '286197';

  const diagnostics: Record<string, any> = {
    __version: 'v8-keyword-debug',
    __timestamp: new Date().toISOString(),
    searchMls: mls,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is null' });
  }

  // 1. Direct query: find by listing_id with NO filters
  const { data: direct, error: directError } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, property_type, address, city')
    .eq('listing_id', mls)
    .limit(1);

  diagnostics.directLookup = {
    error: directError?.message || null,
    found: (direct?.length || 0) > 0,
    data: direct?.[0] || null,
  };

  // 2. ILIKE query (same as keyword search)
  const { data: ilike, error: ilikeError } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, property_type, address')
    .or(`listing_id.ilike.%${mls}%,address.ilike.%${mls}%`)
    .limit(3);

  diagnostics.ilikeSearch = {
    error: ilikeError?.message || null,
    count: ilike?.length || 0,
    data: ilike,
  };

  // 3. ILIKE + status filter
  const allowedStatuses = ['Active', 'Active Under Contract', 'Active U/C W/ Bump', 'Pending', 'Pending Inspect/Feasib', 'To Be Built'];
  const { data: withStatus, error: withStatusError } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, property_type, address')
    .or(`listing_id.ilike.%${mls}%,address.ilike.%${mls}%`)
    .in('status', allowedStatuses)
    .limit(3);

  diagnostics.ilikeWithStatus = {
    error: withStatusError?.message || null,
    count: withStatus?.length || 0,
    data: withStatus,
  };

  // 4. ILIKE + status + not property type
  const { data: withAll, error: withAllError } = await supabase
    .from('graphql_listings')
    .select('id, listing_id, status, property_type, address')
    .or(`listing_id.ilike.%${mls}%,address.ilike.%${mls}%`)
    .in('status', allowedStatuses)
    .not('property_type', 'in', '(Commercial Sale)')
    .limit(3);

  diagnostics.ilikeWithStatusAndType = {
    error: withAllError?.message || null,
    count: withAll?.length || 0,
    data: withAll,
  };

  // 5. Call getListings with keyword (same as the page would)
  const result = await getListings(1, 5, {
    keyword: mls,
    excludedPropertyTypes: ['Commercial Sale'],
    allowedStatuses,
  });

  diagnostics.getListingsResult = {
    total: result.total,
    count: result.listings.length,
    first: result.listings.slice(0, 2).map((l) => ({
      id: l.id,
      mls_number: l.mls_number,
      status: l.status,
      address: l.address,
      property_type: l.property_type,
    })),
  };

  return NextResponse.json(diagnostics);
}

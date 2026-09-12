import { NextRequest, NextResponse } from 'next/server';
import { getListings, getDistinctCities } from '@/lib/listings';
import { getMLSConfiguration, getAllowedCities } from '@/lib/mlsConfiguration';

// Type-ahead suggestions for the hero search: matching areas plus a few active
// listings whose address / town / MLS number matches the term.
export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = ['Active', 'Active Under Contract', 'Active U/C W/ Bump', 'Pending', 'Pending Inspect/Feasib', 'To Be Built'];

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ areas: [], properties: [] });

  const ql = q.toLowerCase();

  // The site's own shortlist of towns where it has one (MLS Configuration);
  // suggesting a town the Areas filter does not list is a dead end.
  let areas: string[] = [];
  try {
    const config = await getMLSConfiguration();
    const allowed = getAllowedCities(config);
    const all = allowed.length > 0 ? allowed : await getDistinctCities();
    areas = all.filter((a) => a && a.toLowerCase().includes(ql)).slice(0, 5);
  } catch (error) {
    console.error('[suggest] areas error:', error instanceof Error ? error.message : error);
  }

  let properties: { id: string; mlsNumber: string; street: string; city: string; state: string }[] = [];
  try {
    const res = await getListings(1, 6, { keyword: q, sort: 'newest', allowedStatuses: ACTIVE_STATUSES });
    properties = (res.listings || []).map((l: any) => ({
      id: l.id,
      mlsNumber: l.mls_number || '',
      street: l.address || l.street_name || '',
      city: l.city || '',
      state: l.state || '',
    }));
  } catch (error) {
    console.error('[suggest] listings error:', error instanceof Error ? error.message : error);
  }

  return NextResponse.json(
    { areas, properties },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}

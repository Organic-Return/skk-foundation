import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCachedCityStats } from '@/lib/cityStats';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ cities: [], stats: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const propertyFilter = searchParams.get('propertyType') || 'all';
    const cityFilter = searchParams.get('city');
    const citiesFilter = searchParams.get('cities');

    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    };

    // All paths now use the 24-hour server cache
    let requestedCities: string[] | undefined;
    if (cityFilter) {
      requestedCities = [cityFilter];
    } else if (citiesFilter) {
      requestedCities = citiesFilter.split(',').map(c => c.trim());
    }

    const cachedFn = getCachedCityStats(propertyFilter, requestedCities);
    const result = await cachedFn();
    return NextResponse.json(result, { headers: cacheHeaders });
  } catch (error) {
    console.error('Error in city-stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

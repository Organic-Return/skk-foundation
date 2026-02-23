import { NextRequest, NextResponse } from 'next/server';
import { getNeighborhoodsByCity, getNeighborhoodsByCities, getDistinctNeighborhoods } from '@/lib/listings';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cityParam = searchParams.get('city');

  try {
    let neighborhoods: string[];

    if (cityParam) {
      const cities = cityParam.split(',').map(c => c.trim()).filter(Boolean);
      if (cities.length === 1) {
        neighborhoods = await getNeighborhoodsByCity(cities[0]);
      } else {
        neighborhoods = await getNeighborhoodsByCities(cities);
      }
    } else {
      neighborhoods = await getDistinctNeighborhoods();
    }

    return NextResponse.json({ neighborhoods });
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return NextResponse.json({ neighborhoods: [] }, { status: 500 });
  }
}

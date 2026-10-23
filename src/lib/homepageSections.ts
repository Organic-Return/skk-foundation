/**
 * Server-side data for the homepage sections that used to fetch in the
 * browser (Featured Properties, Market Insights, Newest to Market).
 *
 * Each helper mirrors the API route its section calls on the client, so the
 * server render and a later client fetch produce the same cards. Each returns
 * `undefined` on failure: the section then renders as before and fetches
 * after load, rather than taking the whole homepage down.
 *
 * Types are imported from the client components as types only, which TypeScript
 * erases; importing their functions from a 'use client' module would hand this
 * server code a client reference instead.
 */
import {
  getListingsByAgentId,
  getListingByMlsNumber,
  getListingById,
  getNewestHighPricedByCity,
  getNewestHighPricedByCities,
  type MLSProperty,
} from '@/lib/listings';
import { getCachedCityStats } from '@/lib/cityStats';
import type { FeaturedPropertyData } from '@/components/ModernFeaturedProperty';
import type { ApiCityStat } from '@/components/ModernCityStats';
import type { NewestListingData } from '@/components/ModernNewestListings';

const toFeatured = (l: MLSProperty): FeaturedPropertyData => ({
  id: l.id,
  address: l.address ?? '',
  city: l.city ?? '',
  state: l.state ?? '',
  list_price: l.list_price ?? 0,
  bedrooms: l.bedrooms,
  bathrooms: l.bathrooms,
  square_feet: l.square_feet,
  photos: l.photos || [],
});

/** Mirrors ModernFeaturedProperty's fetch: the agent's active listings,
 *  priciest first, or the single configured MLS listing. */
export async function getFeaturedProperties(opts: {
  mlsId?: string;
  agentMlsId?: string;
}): Promise<FeaturedPropertyData[] | undefined> {
  try {
    if (opts.agentMlsId) {
      const result = await getListingsByAgentId(opts.agentMlsId);
      return result.activeListings
        .slice(0, 12)
        .map(toFeatured)
        .sort((a, b) => (b.list_price || 0) - (a.list_price || 0));
    }
    if (opts.mlsId) {
      const listing = (await getListingByMlsNumber(opts.mlsId)) || (await getListingById(opts.mlsId));
      return listing ? [toFeatured(listing)] : [];
    }
    return [];
  } catch (error) {
    console.error('Error pre-fetching featured properties:', error);
    return undefined;
  }
}

/** Mirrors /api/city-stats with the default property filter. */
export async function getHomepageCityStats(cities?: string[]): Promise<ApiCityStat[] | undefined> {
  try {
    // The cache key sorts the array in place, so hand it a copy.
    const requested = cities && cities.length > 0 ? [...cities] : undefined;
    const result = await getCachedCityStats('all', requested)();
    return result.stats;
  } catch (error) {
    console.error('Error pre-fetching city stats:', error);
    return undefined;
  }
}

/** Mirrors ModernNewestListings' fetch: a larger pool, then only listings
 *  with a photo, so every card shown has an image. */
export async function getNewestListings(
  cities: string[] | undefined,
  limit: number
): Promise<NewestListingData[] | undefined> {
  try {
    const fetchLimit = Math.max(limit * 3, limit + 8);
    const pool: MLSProperty[] =
      cities && cities.length > 1
        ? await getNewestHighPricedByCities(cities, fetchLimit)
        : await getNewestHighPricedByCity(cities?.[0] || 'Aspen', fetchLimit);
    return pool
      .filter((p) => Array.isArray(p.photos) && Boolean(p.photos[0]))
      .slice(0, limit)
      .map((l) => ({
        id: l.id,
        address: l.address,
        city: l.city,
        state: l.state,
        zip_code: l.zip_code,
        list_price: l.list_price,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        square_feet: l.square_feet,
        listing_date: l.listing_date,
        photos: l.photos || [],
      }));
  } catch (error) {
    console.error('Error pre-fetching newest listings:', error);
    return undefined;
  }
}

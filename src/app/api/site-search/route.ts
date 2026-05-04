import { NextRequest, NextResponse } from 'next/server';
import { getListings } from '@/lib/listings';
import { client } from '@/sanity/client';

interface SanityHit {
  _type: string;
  title?: string;
  name?: string;
  slug?: { current?: string };
  excerpt?: string;
  city?: string;
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({
      query: q,
      properties: [],
      communities: [],
      posts: [],
      pages: [],
      team: [],
    });
  }

  // Fetch listings (MLS# / address keyword search) and Sanity content in parallel.
  const [listingsResult, sanityHits] = await Promise.all([
    getListings(1, 8, { keyword: q, sort: 'newest' }).catch(() => ({ listings: [] as any[] })),
    client
      .fetch<SanityHit[]>(
        `*[
          (_type == "community" && (title match $term || description match $term)) ||
          (_type == "post" && (title match $term || excerpt match $term)) ||
          (_type == "sitePage" && title match $term) ||
          (_type == "teamMember" && inactive != true && (name match $term || title match $term))
        ][0...20]{
          _type,
          title,
          name,
          slug,
          excerpt,
          city
        }`,
        { term: `${q}*` },
        { next: { revalidate: 60 } }
      )
      .catch(() => [] as SanityHit[]),
  ]);

  const properties = (listingsResult.listings || []).slice(0, 8).map((l: any) => ({
    id: l.id,
    mlsNumber: l.mls_number,
    address: l.address,
    city: l.city,
    state: l.state,
    price: l.price_amount ?? l.price,
    href: `/listings/${l.mls_number || l.id}`,
    photo: Array.isArray(l.photos) && l.photos.length > 0 ? l.photos[0] : null,
  }));

  const communities = sanityHits
    .filter(h => h._type === 'community')
    .slice(0, 5)
    .map(h => ({
      title: h.title,
      href: h.slug?.current ? `/communities/${h.slug.current}` : '/communities',
    }));

  const posts = sanityHits
    .filter(h => h._type === 'post')
    .slice(0, 5)
    .map(h => ({
      title: h.title,
      excerpt: h.excerpt,
      href: h.slug?.current ? `/blog/${h.slug.current}` : '/blog',
    }));

  const pages = sanityHits
    .filter(h => h._type === 'sitePage')
    .slice(0, 5)
    .map(h => ({
      title: h.title,
      href: h.slug?.current ? `/${h.slug.current}` : '/',
    }));

  const team = sanityHits
    .filter(h => h._type === 'teamMember')
    .slice(0, 5)
    .map(h => ({
      name: h.name,
      href: h.slug?.current ? `/agents/${h.slug.current}` : '/team',
    }));

  return NextResponse.json(
    { query: q, properties, communities, posts, pages, team },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
  );
}

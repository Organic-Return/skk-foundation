import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { getListings } from '@/lib/listings';
import { getMLSConfiguration, getAllowedCities, getExcludedStatuses } from '@/lib/mlsConfiguration';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {};

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is null' });
  }

  // 1. Test listing 288871 (Grapevine Court) — raw media from Supabase
  const { data: rawGrapevine } = await supabase
    .from('graphql_listings')
    .select('listing_id, address, city, status, preferred_photo, media')
    .eq('listing_id', '288871')
    .limit(1);

  if (rawGrapevine?.[0]) {
    const r = rawGrapevine[0];
    diagnostics.listing288871_raw = {
      listing_id: r.listing_id,
      address: r.address,
      city: r.city,
      status: r.status,
      preferred_photo: r.preferred_photo,
      media_is_null: r.media === null,
      media_typeof: typeof r.media,
      media_isArray: Array.isArray(r.media),
      media_length: Array.isArray(r.media) ? r.media.length : (typeof r.media === 'string' ? r.media.length : null),
      media_first_200_chars: r.media ? JSON.stringify(r.media).substring(0, 200) : null,
    };

    // Simulate transformListing photo extraction
    const photos: string[] = [];
    if (r.preferred_photo) photos.push(r.preferred_photo);

    let mediaItems: any[] = [];
    if (r.media) {
      if (Array.isArray(r.media)) {
        mediaItems = r.media;
      } else if (typeof r.media === 'string') {
        try {
          const parsed = JSON.parse(r.media);
          mediaItems = Array.isArray(parsed) ? parsed : [];
        } catch (e: any) {
          diagnostics.listing288871_parseError = e.message;
        }
      }
    }

    diagnostics.listing288871_mediaItems_count = mediaItems.length;
    if (mediaItems[0]) {
      diagnostics.listing288871_firstItem = {
        typeof: typeof mediaItems[0],
        isString: typeof mediaItems[0] === 'string',
        keys: typeof mediaItems[0] === 'object' ? Object.keys(mediaItems[0]) : null,
        raw: JSON.stringify(mediaItems[0]).substring(0, 300),
      };
    }

    for (const mediaItem of mediaItems) {
      try {
        const parsed = typeof mediaItem === 'string' ? JSON.parse(mediaItem) : mediaItem;
        let url: string | undefined;
        if (typeof parsed === 'string') {
          url = parsed;
        } else {
          url = parsed.MediaURL || parsed.MediaUrl || parsed.mediaUrl || parsed.mediaURL;
        }
        if (url) {
          if (url.startsWith('//')) {
            url = `https:${url}`;
          }
          if (!photos.includes(url)) {
            photos.push(url);
          }
        }
      } catch {
        // skip
      }
    }

    diagnostics.listing288871_extracted_photos_count = photos.length;
    diagnostics.listing288871_first_photo = photos[0] || null;
    diagnostics.listing288871_all_photos = photos.slice(0, 5);
  } else {
    diagnostics.listing288871_raw = 'NOT FOUND';
  }

  // 2. Test getListings pipeline — check how many of the first 24 listings have photos
  const mlsConfig = await getMLSConfiguration();
  const allExcludedStatuses = [...new Set([...getExcludedStatuses(mlsConfig), 'Closed', 'Sold'])];

  try {
    const result = await getListings(1, 24, {
      allowedCities: getAllowedCities(mlsConfig),
      excludedStatuses: allExcludedStatuses,
      sort: 'newest',
    });

    const withPhotos = result.listings.filter(l => l.photos && l.photos.length > 0);
    const withoutPhotos = result.listings.filter(l => !l.photos || l.photos.length === 0);

    diagnostics.page1_newest = {
      total: result.total,
      returned: result.listings.length,
      with_photos: withPhotos.length,
      without_photos: withoutPhotos.length,
      sample_with_photos: withPhotos[0] ? {
        id: withPhotos[0].id,
        address: withPhotos[0].address,
        photos_count: withPhotos[0].photos.length,
        first_photo: withPhotos[0].photos[0]?.substring(0, 120),
      } : null,
      sample_without_photos: withoutPhotos[0] ? {
        id: withoutPhotos[0].id,
        address: withoutPhotos[0].address,
        mls: withoutPhotos[0].mls_number,
      } : null,
    };
  } catch (e: any) {
    diagnostics.page1_error = e.message;
  }

  // 3. Test with price_high sort (known to show images)
  try {
    const result = await getListings(1, 24, {
      allowedCities: getAllowedCities(mlsConfig),
      excludedStatuses: allExcludedStatuses,
      sort: 'price_high',
    });

    const withPhotos = result.listings.filter(l => l.photos && l.photos.length > 0);
    diagnostics.page1_price_high = {
      returned: result.listings.length,
      with_photos: withPhotos.length,
      without_photos: result.listings.length - withPhotos.length,
    };
  } catch (e: any) {
    diagnostics.page1_price_high_error = e.message;
  }

  // 4. Search for Grapevine Court via getListings
  try {
    const result = await getListings(1, 5, {
      allowedCities: getAllowedCities(mlsConfig),
      excludedStatuses: allExcludedStatuses,
      keyword: 'Grapevine',
    });

    diagnostics.grapevine_search = {
      total: result.total,
      results: result.listings.map(l => ({
        id: l.id,
        mls: l.mls_number,
        address: l.address,
        photos_count: l.photos.length,
        first_photo: l.photos[0]?.substring(0, 120) || null,
      })),
    };
  } catch (e: any) {
    diagnostics.grapevine_search_error = e.message;
  }

  return NextResponse.json(diagnostics);
}

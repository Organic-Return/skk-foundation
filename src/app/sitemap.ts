import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { client } from '@/sanity/client';
import { getListings, getListingHref } from '@/lib/listings';
import { getOffMarketListings } from '@/lib/offMarketListings';
import { getBaseUrl } from '@/lib/settings';
import { getCrawlBaseUrl } from '@/lib/crawlers';

// Sanity queries for dynamic content
const COMMUNITIES_QUERY = `*[_type == "community"]{ "slug": slug.current, _updatedAt }`;
const MARKET_REPORTS_QUERY = `*[_type == "publication" && publicationType == "market-report"]{ "slug": slug.current, _updatedAt, publishedAt }`;
const MAGAZINES_QUERY = `*[_type == "publication" && publicationType == "magazine"]{ "slug": slug.current, _updatedAt, publishedAt }`;
const POSTS_QUERY = `*[_type == "post"]{ "slug": slug.current, _updatedAt, publishedAt }`;
const PARTNERS_QUERY = `*[_type == "affiliatedPartner" && active == true]{
  "slug": slug.current,
  partnerType,
  firstName,
  lastName,
  _updatedAt
}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // On staging, list staging URLs. settings.siteUrl points at the production
  // domain, so emitting it here would send an auditing crawler off this build
  // and onto the live site.
  const host = (await headers()).get('host');
  const baseUrl = getCrawlBaseUrl(host, await getBaseUrl());

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/off-market`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/market-reports`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/living-aspen`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/testimonials`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about/christies-masters-circle`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/exclusive-listings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sold`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/open-houses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/affiliated-partners`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/affiliated-partners/market-leaders`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/affiliated-partners/ski-town`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/videos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // Fetch dynamic content from Sanity
  const [communities, marketReports, magazines, posts, partners, buyPage, sellPage, aboutPage, resourcesPage, whyKlugPage] = await Promise.all([
    client.fetch<Array<{ slug: string; _updatedAt: string }>>(COMMUNITIES_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(MARKET_REPORTS_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(MAGAZINES_QUERY),
    client.fetch<Array<{ slug: string; _updatedAt: string; publishedAt: string }>>(POSTS_QUERY),
    client.fetch<Array<{ slug: string; partnerType: string; firstName: string; lastName: string; _updatedAt: string }>>(PARTNERS_QUERY),
    client.fetch<{ _updatedAt: string } | null>(`*[_type == "buyPage"][0]{ _updatedAt }`),
    client.fetch<{ _updatedAt: string } | null>(`*[_type == "sellPage"][0]{ _updatedAt }`),
    client.fetch<{ _updatedAt: string } | null>(`*[_type == "aboutPage"][0]{ _updatedAt }`),
    client.fetch<{ _updatedAt: string } | null>(`*[_type == "resourcesPage"][0]{ _updatedAt }`),
    client.fetch<{ _updatedAt: string } | null>(`*[_type == "whyKlugProperties"][0]{ _updatedAt }`),
  ]);

  // Conditionally add singleton content pages (only if they exist in this project's Sanity dataset)
  const singletonPages: MetadataRoute.Sitemap = [];
  if (buyPage) {
    singletonPages.push({ url: `${baseUrl}/buy`, lastModified: new Date(buyPage._updatedAt), changeFrequency: 'monthly', priority: 0.8 });
  }
  if (sellPage) {
    singletonPages.push({ url: `${baseUrl}/sell`, lastModified: new Date(sellPage._updatedAt), changeFrequency: 'monthly', priority: 0.8 });
  }
  if (aboutPage) {
    singletonPages.push({ url: `${baseUrl}/about`, lastModified: new Date(aboutPage._updatedAt), changeFrequency: 'monthly', priority: 0.7 });
  }
  if (resourcesPage) {
    singletonPages.push({ url: `${baseUrl}/resources`, lastModified: new Date(resourcesPage._updatedAt), changeFrequency: 'monthly', priority: 0.6 });
  }
  if (posts && posts.length > 0) {
    singletonPages.push({ url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 });
  }
  // Tenant-only page: the route 404s when this singleton isn't in the dataset,
  // so only advertise it where it exists.
  if (whyKlugPage) {
    singletonPages.push({ url: `${baseUrl}/why-klug-properties`, lastModified: new Date(whyKlugPage._updatedAt), changeFrequency: 'monthly', priority: 0.7 });
  }

  // Community pages
  const communityPages: MetadataRoute.Sitemap = (communities || []).map((community) => ({
    url: `${baseUrl}/communities/${community.slug}`,
    lastModified: new Date(community._updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Market report pages
  const marketReportPages: MetadataRoute.Sitemap = (marketReports || []).map((report) => ({
    url: `${baseUrl}/market-reports/${report.slug}`,
    lastModified: new Date(report._updatedAt || report.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Magazine/Living Aspen pages
  const magazinePages: MetadataRoute.Sitemap = (magazines || []).map((magazine) => ({
    url: `${baseUrl}/living-aspen/${magazine.slug}`,
    lastModified: new Date(magazine._updatedAt || magazine.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Blog/Post pages
  const postPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: new Date(post._updatedAt || post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Partner pages
  const partnerPages: MetadataRoute.Sitemap = (partners || []).map((partner) => {
    const slug = partner.slug || `${partner.firstName}-${partner.lastName}`.toLowerCase();
    const pathPrefix = partner.partnerType === 'market_leader' ? 'market-leaders' : 'ski-town';
    return {
      url: `${baseUrl}/affiliated-partners/${pathPrefix}/${slug}`,
      lastModified: new Date(partner._updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    };
  });

  // Every listing detail page, not just the first slice. This used to fetch a
  // single page of 500, which silently dropped ~2/3 of the ~1,750 listings —
  // they have no crawlable link path either (the /listings grid paginates
  // client-side), so a missing sitemap entry meant the page was undiscoverable.
  //
  // The sitemap spec allows 50,000 URLs; MAX_LISTINGS is a build-time guard, and
  // hitting it is logged rather than silently truncating.
  const LISTINGS_PAGE_SIZE = 500;
  const MAX_LISTINGS = 25_000;
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const collected: Awaited<ReturnType<typeof getListings>>['listings'] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const result = await getListings(page, LISTINGS_PAGE_SIZE, {
        excludedStatuses: ['Closed'],
      });
      collected.push(...result.listings);
      totalPages = result.totalPages || 1;
      page += 1;
    } while (page <= totalPages && collected.length < MAX_LISTINGS);

    if (collected.length >= MAX_LISTINGS) {
      console.warn(
        `sitemap: listing cap of ${MAX_LISTINGS} reached; some listings are not in the sitemap`
      );
    }

    listingPages = collected.map((listing) => ({
      url: `${baseUrl}${getListingHref(listing)}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching listings for sitemap:', error);
  }

  // Fetch off-market listings
  let offMarketPages: MetadataRoute.Sitemap = [];
  try {
    const offMarketListings = await getOffMarketListings();
    offMarketPages = offMarketListings.map((listing) => ({
      url: `${baseUrl}/off-market/${listing.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching off-market listings for sitemap:', error);
  }

  return [
    ...staticPages,
    ...singletonPages,
    ...communityPages,
    ...marketReportPages,
    ...magazinePages,
    ...postPages,
    ...partnerPages,
    ...listingPages,
    ...offMarketPages,
  ];
}

/**
 * Redirects for URLs of the previous skkrealestate.com, retired when this site
 * launched in September 2026.
 *
 * Google Search Console reported ~2,000 "Not found (404)" pages afterwards.
 * The Wayback Machine lists ~6,600 URLs for the old site; 6,445 of them were
 * listing pages of the form /Real-Estate-Listings/<address-slug>-<mls number>,
 * and two thirds of those MLS numbers still exist in the database, where the
 * new site serves them at /listings/<mls number>. The rest were a handful of
 * community, blog, search and about pages, mapped by hand below.
 *
 * Matching is case-insensitive: the old site used mixed case
 * (/Real-Estate-Listings, /home-search/Aspen-Real-Estate) and crawlers request
 * the exact spelling they indexed.
 */

const LEGACY_LISTING = /^\/real-estate-listings\/(?:.*-)?(\d{4,8})$/;

const COMMUNITY_SLUGS: Record<string, string> = {
  'aspen-glen': 'aspen-glen-club',
  'base-village': 'base-village-snowmass',
  'blue-lake': 'blue-lake',
  'brush-creek-village': 'brush-creek-village',
  'central-core': 'aspen-central-core',
  'divide': 'the-divide-snowmass-village-colorado',
  'east-aspen': 'aspen-colorado',
  'lower-village': 'lower-snowmass-village',
  'meadow-ranch': 'meadow-ranch-snowmass-village',
  'missouri-heights': 'missouri-heights-carbondale',
  'old-snowmass': 'old-snowmass-colorado',
  'ridge-run': 'ridge-run-snowmass-village',
  'roaring-fork-club': 'roaring-fork-club',
  'smuggler': 'smuggler-mountain-aspen',
  'snowmass-club': 'snowmass-club-snowmass-village',
  'snowmass-village': 'snowmass-village-colorado',
  'two-creeks': 'two-creeks-snowmass-village',
  'upper-village': 'upper-snowmass-village',
  'west-aspen': 'west-aspen-colorado',
  'west-end': 'west-end-aspen',
  'willits': 'willits-basalt',
  'woodrun': 'wood-run',
  'woodrun-complexes': 'woodrun-complexes',
};

// Old blog posts that have a counterpart on the new site. Anything else under
// /about/blog/ goes to the blog index.
const BLOG_SLUGS: Record<string, string> = {
  '2023-real-estate-recap': '/snowmass-village-2023-recap-market-stats',
  'ridge-run-market-update': '/ridge-run-snowmass-village-market-update',
  'snowmass-village-market-update': '/2023-snowmass-village-real-estate-market-update',
  'trusted-community-partners': '/affiliated-partners/the-council',
};

const STATIC: Record<string, string> = {
  '/home': '/',
  '/about/about': '/about/stacey-k-kelly',
  '/about/blog': '/blog',
  '/about/resource-center': '/resources',
  '/agents/stacey-kelly': '/about/stacey-k-kelly',
  '/agents/rulon-kelly-team': '/about/stacey-k-kelly',
  '/aspen-real-estate': '/communities/aspen-colorado',
  '/aspen-snowmass': '/communities',
  '/aspen-snowmass/communities-neighborhoods': '/communities',
  '/home-search': '/listings',
  '/home-search/sold-properties': '/sold',
  '/home-search/aspen-real-estate': '/listings?city=Aspen',
  '/home-search/basalt-real-estate': '/listings?city=Basalt',
  '/home-search/carbondale-real-estate': '/listings?city=Carbondale',
  '/home-search/old-snowmass-real-estate': '/communities/old-snowmass-colorado',
  '/home-search/snowmass-village-real-estate': '/listings?city=Snowmass%20Village',
  '/privacy': '/privacy-policy',
  '/search': '/listings',
  '/sell/sell-form': '/sell',
};

/**
 * The new-site path for a URL of the old site, or null when the path is not a
 * known legacy URL. Only the pathname is considered; query strings are dropped.
 */
export function legacyRedirect(pathname: string): string | null {
  const path = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  const listing = LEGACY_LISTING.exec(path);
  if (listing) return `/listings/${listing[1]}`;

  const direct = STATIC[path];
  if (direct) return direct;

  const community = /^\/aspen-snowmass\/communities-neighborhoods\/([^/]+)$/.exec(path);
  if (community) {
    const slug = COMMUNITY_SLUGS[community[1]];
    return slug ? `/communities/${slug}` : '/communities';
  }

  const post = /^\/about\/blog\/([^/]+)$/.exec(path);
  if (post) return BLOG_SLUGS[post[1]] || '/blog';

  if (path.startsWith('/vacation-rentals')) return '/listings?type=Residential%20Lease';
  if (path.startsWith('/agents/')) return '/about/stacey-k-kelly';

  return null;
}

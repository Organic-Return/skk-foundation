/**
 * Listing detail URLs: /listings/{mlsId}/{address-slug}
 *
 * The id segment is the only part that identifies the listing; the slug is
 * descriptive and the detail route redirects any request whose slug differs
 * from `listingSlug(listing)`. Everything that links to a listing — cards,
 * carousels, map pins, the sitemap, canonical and og:url, JSON-LD — goes
 * through `listingPath` so there is exactly one spelling of each URL.
 *
 * Pure: no data access, safe to import from client components.
 */

export interface ListingUrlInput {
  id: string;
  mls_number?: string | null;
  /** Full address as the feed supplies it: "130 Wood Road 614, Snowmass Village, CO 81615". */
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  /**
   * The MLS "display address on internet" flag. When false the slug carries
   * only city, state and zip. The data layer also blanks `address` for such
   * listings, so this is belt and braces for callers that pass raw rows.
   */
  address_display?: boolean | null;
}

const MAX_SLUG_LENGTH = 80;

/** Lowercase ASCII, "&" as "and", runs of anything else as a single hyphen. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // combining accents left by NFKD
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Cut a slug to `max` characters at a hyphen boundary. */
export function truncateSlug(slug: string, max = MAX_SLUG_LENGTH): string {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max + 1);
  const boundary = cut.lastIndexOf('-');
  return (boundary > 0 ? cut.slice(0, boundary) : cut.slice(0, max)).replace(/-+$/, '');
}

/**
 * The street part of a feed address, without the ", City, ST ZIP" tail. A
 * multi-unit address ("311 Main Street 101, 102, 201, Aspen, CO 81611") keeps
 * its first unit only. Returns null when there is no street: an address that
 * is just the city, or no address at all.
 */
export function listingStreet(listing: Pick<ListingUrlInput, 'address' | 'city'>): string | null {
  const address = listing.address?.trim();
  if (!address) return null;
  const street = address.split(',')[0].trim();
  if (!street) return null;
  if (listing.city && street.toLowerCase() === listing.city.trim().toLowerCase()) return null;
  return street;
}

/**
 * The address slug: street (with unit), city, state and zip. Street is left
 * out when the feed withholds it or none is known, leaving "city-state-zip".
 */
export function listingSlug(listing: ListingUrlInput): string {
  const showStreet = listing.address_display !== false;
  const street = showStreet ? listingStreet(listing) : null;
  const parts = [street, listing.city, listing.state, listing.zip_code]
    .map((p) => (p ? slugify(String(p)) : ''))
    .filter(Boolean);
  return truncateSlug(parts.join('-'));
}

/** The id segment: the MLS number, or the database id for records without one. */
export function listingId(listing: Pick<ListingUrlInput, 'id' | 'mls_number'>): string {
  return String(listing.mls_number || listing.id);
}

/** "/listings/{mlsId}/{slug}", or "/listings/{mlsId}" when no slug can be built. */
export function listingPath(listing: ListingUrlInput): string {
  const base = `/listings/${encodeURIComponent(listingId(listing))}`;
  const slug = listingSlug(listing);
  return slug ? `${base}/${slug}` : base;
}

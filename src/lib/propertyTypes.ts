/**
 * Crawlable views of the listings grid by MLS property type.
 *
 * The grid's type filter is a browser control, so nothing in the HTML linked
 * to the rental, commercial or land views. Those listings are in the sitemap
 * but were reachable by no link path at all: a crawler following links found
 * about 1,130 of 2,095 listings. These links give every type a path.
 *
 * Values are the feed's own property_type strings, which the listings page
 * filters on via ?type=.
 */
export const PROPERTY_TYPE_VIEWS: Array<{ type: string; label: string }> = [
  { type: 'Residential', label: 'Homes & Condos' },
  { type: 'Fractional', label: 'Fractional Ownership' },
  { type: 'RES Vacant Land', label: 'Land' },
  { type: 'Residential Lease', label: 'Rentals' },
  { type: 'Commercial Sale', label: 'Commercial' },
  { type: 'Commercial Lease', label: 'Commercial Leases' },
  { type: 'Commercial Land', label: 'Commercial Land' },
];

export function propertyTypeHref(type: string): string {
  return `/listings?type=${encodeURIComponent(type)}`;
}

/** Views to show, restricted to the types the feed currently carries when known. */
export function availablePropertyTypeViews(feedTypes?: string[]) {
  if (!feedTypes || feedTypes.length === 0) return PROPERTY_TYPE_VIEWS;
  const present = new Set(feedTypes);
  return PROPERTY_TYPE_VIEWS.filter((v) => present.has(v.type));
}

/**
 * Groups community documents by the town they belong to, so a neighborhood
 * page can link laterally to its siblings ("More in Snowmass Village").
 *
 * The Sanity community schema has no parent-town field; the town is inferred
 * from the slug, with an explicit table for the handful of neighborhoods whose
 * slug names a different town than the one they sit in (Aspen Glen is in
 * Carbondale, Roaring Fork Club is in Basalt).
 */

export type CommunityArea = {
  key: 'aspen' | 'snowmass' | 'basalt' | 'carbondale';
  label: string;
  /** Slug of the town-level community page for this area. */
  citySlug: string;
};

const AREAS: Record<CommunityArea['key'], CommunityArea> = {
  aspen: { key: 'aspen', label: 'Aspen', citySlug: 'aspen-colorado' },
  snowmass: { key: 'snowmass', label: 'Snowmass Village', citySlug: 'snowmass-village-colorado' },
  basalt: { key: 'basalt', label: 'Basalt', citySlug: 'basalt-colorado' },
  carbondale: { key: 'carbondale', label: 'Carbondale', citySlug: 'carbondale-colorado' },
};

/** Slugs whose town is not the one their name suggests, or is not in the name at all. */
const EXPLICIT: Record<string, CommunityArea['key']> = {
  'aspen-glen-club': 'carbondale',
  'blue-lake': 'carbondale',
  'roaring-fork-club': 'basalt',
  'willits-basalt': 'basalt',
  'woody-creek-colorado': 'aspen',
  'wood-run': 'snowmass',
  'woodrun-complexes': 'snowmass',
  'ridge-run-complexes': 'snowmass',
  'old-snowmass-colorado': 'snowmass',
};

export function communityArea(slug: string | undefined | null): CommunityArea | null {
  if (!slug) return null;
  const explicit = EXPLICIT[slug];
  if (explicit) return AREAS[explicit];
  if (slug.includes('snowmass')) return AREAS.snowmass;
  if (slug.includes('aspen')) return AREAS.aspen;
  if (slug.includes('carbondale')) return AREAS.carbondale;
  if (slug.includes('basalt')) return AREAS.basalt;
  return null;
}

export type CommunitySummary = {
  title?: string;
  slug?: string;
  communityType?: string;
  featuredImage?: unknown;
};

/**
 * Sibling communities for a page: the area's town page first, then the other
 * communities in the same area, never the page itself. Snowmass Village alone
 * has sixteen, so rather than every page showing the same alphabetical six,
 * the list starts just after the current page in alphabetical order and wraps.
 * Each page then links a different slice and every sibling is reachable from
 * somewhere in the area. When the area is unknown or has too few siblings,
 * the town pages fill the gaps so every community page still links onward.
 */
export function relatedCommunities<T extends CommunitySummary>(
  current: string,
  all: T[],
  limit = 6
): { area: CommunityArea | null; items: T[] } {
  const area = communityArea(current);
  const byTitle = (a: T, b: T) => (a.title || '').localeCompare(b.title || '');
  const others = all.filter((c) => c.slug && c.slug !== current);

  let siblings: T[] = [];
  if (area) {
    const members = all.filter((c) => c.slug && communityArea(c.slug)?.key === area.key).sort(byTitle);
    const town = members.find((c) => c.slug === area.citySlug && c.slug !== current);
    const ring = members.filter((c) => c !== town);
    const at = ring.findIndex((c) => c.slug === current);
    const rotated = at >= 0 ? [...ring.slice(at + 1), ...ring.slice(0, at)] : ring;
    siblings = town ? [town, ...rotated] : rotated;
  }
  const towns = others.filter((c) => c.communityType === 'city' && !siblings.includes(c)).sort(byTitle);

  return { area, items: [...siblings, ...towns].slice(0, limit) };
}

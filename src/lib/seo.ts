/**
 * Page-level SEO helpers. The JSON-LD helpers are thin wrappers over
 * `@/lib/schema` so index pages can keep their one-line calls; everything they
 * return is a graph node (or array of nodes) for <SchemaGraph>.
 */
import { breadcrumbNode, collectionPageNodes, faqNode, type JsonLdNode } from '@/lib/schema';

type Faq = { question?: string; answer?: string };

/** FAQPage node for questions rendered on the page at `pageUrl`. Null if none. */
export function faqPageSchema(faqs: Faq[] | undefined, pageUrl: string): JsonLdNode | null {
  return (
    faqNode(
      pageUrl,
      (faqs || []).map((f) => ({ question: f?.question || '', answer: f?.answer || '' }))
    ) || null
  );
}

/**
 * CollectionPage + ItemList for an index page (team, blog, market reports).
 * `items` are ordered; each becomes a ListItem pointing at its detail page.
 * Returns null when the list is empty — an empty ItemList is worse than none.
 */
export function collectionPageSchema(opts: {
  name: string;
  url: string;
  description?: string | null;
  items: Array<{ name?: string | null; url: string }>;
}): JsonLdNode[] | null {
  const valid = opts.items.filter((i) => i?.name && i?.url);
  if (valid.length === 0) return null;
  return collectionPageNodes({
    url: opts.url,
    name: opts.name,
    description: opts.description,
    hasBreadcrumb: true,
    listName: opts.name,
    items: valid,
  });
}

/**
 * Keyword-targeted title, description and heading for a community page.
 *
 * 33 of the 34 community docs have no `seo.metaTitle`, so they fell back to the
 * bare document title — literally "Basalt Colorado", "Aspen Colorado". Those
 * target no query. The pages that outrank us are titled like
 * "Basalt, CO Real Estate | View Homes, Condos & Lofts": the search term leads.
 *
 * Sanity's `seo.metaTitle` still wins when an editor sets one; this only
 * replaces the fallback.
 */
export function communitySeo(opts: {
  title?: string | null;
  communityType?: string | null;
}) {
  let raw = (opts.title || '').trim();
  // One doc is stored in ALL CAPS ("UPPER ROARING FORK VALLEY").
  if (raw && raw === raw.toUpperCase()) {
    raw = raw
      .toLowerCase()
      .replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }
  // Doc titles carry an inconsistent state suffix ("Basalt Colorado").
  const place = raw.replace(/[,\s]+(Colorado|CO)$/i, '').trim() || raw;

  const heading =
    opts.communityType === 'complex' ? place : `${place} Real Estate`;

  let title: string;
  if (opts.communityType === 'city' && place.length <= 20) {
    title = `${place} Real Estate | Homes for Sale in ${place}, CO`;
  } else if (opts.communityType === 'complex') {
    title = `${place} | Condos & Homes for Sale`;
  } else {
    // Neighborhood names are already long ("Sinclair Meadows Snowmass
    // Village"); repeating the place would push the tag past 90 characters.
    title = `${place} Real Estate | Homes for Sale`;
  }

  const description =
    opts.communityType === 'complex'
      ? `Browse condos and homes for sale at ${place}. Current listings, pricing, and a local guide to buying at ${place} in the Aspen–Snowmass area.`
      : `Explore ${place} real estate — homes, condos, and land for sale in ${place}, Colorado. Current listings, market data, and a local buyer's guide.`;

  return { place, title, description, heading };
}

/** BreadcrumbList node for a trail that ends at the current page. */
export function breadcrumbSchema(items: Array<{ name: string; url: string }>): JsonLdNode | null {
  if (items.length === 0) return null;
  return breadcrumbNode(items[items.length - 1].url, items) || null;
}

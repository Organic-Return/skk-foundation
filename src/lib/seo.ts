/**
 * Helpers that build schema.org JSON-LD objects for page SEO.
 * Pass the returned objects to the <StructuredData> component (skip nulls).
 */

const DEFAULT_AREA_SERVED = [
  "Aspen",
  "Snowmass",
  "Snowmass Village",
  "Roaring Fork Valley",
  "Colorado",
];

type Faq = { question?: string; answer?: string };

/** FAQPage rich-result schema built from Sanity FAQ items. Returns null if none. */
export function faqPageSchema(faqs?: Faq[]) {
  const valid = (faqs || []).filter((f) => f?.question && f?.answer);
  if (valid.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: valid.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** RealEstateAgent schema for the primary agent. Returns null without a name. */
export function realEstateAgentSchema(opts: {
  name?: string | null;
  url: string;
  image?: string | null;
  telephone?: string | null;
  description?: string | null;
  areaServed?: string[];
  knowsAbout?: string[];
}) {
  if (!opts.name) return null;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: opts.name,
    url: opts.url,
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.telephone ? { telephone: opts.telephone } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    areaServed: opts.areaServed || DEFAULT_AREA_SERVED,
    ...(opts.knowsAbout ? { knowsAbout: opts.knowsAbout } : {}),
  };
}

/**
 * Review schema objects for real, attributed testimonials.
 * Call this ONLY with genuine CMS testimonials — never placeholder copy.
 * Returns null if there are none.
 */
export function reviewSchemas(
  testimonials: Array<{ quote?: string; author?: string }> | undefined,
  agentName?: string | null
) {
  const valid = (testimonials || []).filter((t) => t?.quote && t?.author);
  if (valid.length === 0) return null;
  return valid.map((t) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    reviewBody: t.quote,
    author: { "@type": "Person", name: t.author },
    ...(agentName
      ? { itemReviewed: { "@type": "RealEstateAgent", name: agentName } }
      : {}),
  }));
}

/**
 * Full RealEstateAgent profile for an individual agent's own page.
 *
 * Richer than realEstateAgentSchema(): carries the contact points, postal
 * address, and sameAs social profiles that let Google resolve the agent as an
 * entity (knowledge panel) rather than just a page. Returns null without a name.
 */
export function agentProfileSchema(opts: {
  name?: string | null;
  url: string;
  jobTitle?: string | null;
  image?: string | null;
  description?: string | null;
  email?: string | null;
  telephone?: string | null;
  address?: string | null;
  worksFor?: string | null;
  sameAs?: Array<string | undefined | null>;
  areaServed?: string[];
}) {
  if (!opts.name) return null;
  const sameAs = (opts.sameAs || []).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${opts.url}#agent`,
    name: opts.name,
    url: opts.url,
    ...(opts.jobTitle ? { jobTitle: opts.jobTitle } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.email ? { email: opts.email } : {}),
    ...(opts.telephone ? { telephone: opts.telephone } : {}),
    ...(opts.address
      ? { address: { "@type": "PostalAddress", streetAddress: opts.address } }
      : {}),
    ...(opts.worksFor
      ? { worksFor: { "@type": "Organization", name: opts.worksFor } }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    areaServed: opts.areaServed || DEFAULT_AREA_SERVED,
  };
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
}) {
  const valid = opts.items.filter((i) => i?.name && i?.url);
  if (valid.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    url: opts.url,
    ...(opts.description ? { description: opts.description } : {}),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: valid.length,
      itemListElement: valid.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: item.url,
      })),
    },
  };
}

/** BreadcrumbList schema for a simple Home > Page trail. */
export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

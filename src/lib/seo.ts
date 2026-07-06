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

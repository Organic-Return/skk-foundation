import { headers } from 'next/headers';
import { client } from '@/sanity/client';
import { getBaseUrl, getSettings, getSiteName } from '@/lib/settings';
import { getCrawlBaseUrl } from '@/lib/crawlers';

export const revalidate = 3600;

/**
 * /llms.txt — a plain-Markdown map of the site for AI search crawlers.
 *
 * Semrush reported this file as malformed ("Missing H1"). It never existed: the
 * root catch-all was answering /llms.txt with a "Post Not Found" body and HTTP
 * 200, and the auditor read that. This serves a real one.
 *
 * The format is Markdown by convention: an H1, a blockquote summary, then
 * link sections. Deliberately curated rather than a sitemap dump — the point is
 * to tell a model what matters, not to list all ~3,400 listing URLs.
 */
const CONTENT_QUERY = `{
  "summary": *[_id == "homepage"][0].seo.metaDescription,
  "communities": *[_type == "community" && defined(slug.current)] | order(featured desc, title asc){
    title, "slug": slug.current, description
  },
  "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...30]{
    title, "slug": slug.current
  }
}`;

type ContentResult = {
  summary?: string;
  communities?: Array<{ title?: string; slug?: string; description?: string }>;
  posts?: Array<{ title?: string; slug?: string }>;
};

/** Cut to at most `max` characters on a word boundary, without a dangling comma. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const atSpace = cut.lastIndexOf(' ');
  return `${(atSpace > max / 2 ? cut.slice(0, atSpace) : cut).replace(/[,;:\s]+$/, '')}…`;
}

export async function GET() {
  const host = (await headers()).get('host');
  const [content, settings, siteName, canonicalBaseUrl] = await Promise.all([
    client.fetch<ContentResult>(CONTENT_QUERY, {}, { next: { revalidate: 3600 } }),
    getSettings(),
    getSiteName(),
    getBaseUrl(),
  ]);

  // Self-referencing on staging, same as robots.txt and sitemap.xml — otherwise
  // every link here would point at the production domain.
  const baseUrl = getCrawlBaseUrl(host, canonicalBaseUrl);

  // The blockquote is the one-line summary a model reads first. The homepage
  // meta description is written as a sentence; the settings description is a
  // run-on used for the Organization schema.
  const description =
    content?.summary?.trim() ||
    settings?.description ||
    'Luxury real estate in Aspen, Snowmass Village, and the Roaring Fork Valley.';

  const lines: string[] = [
    `# ${siteName}`,
    '',
    `> ${description}`,
    '',
    'Luxury residential real estate across Aspen, Snowmass Village, and the greater',
    'Roaring Fork Valley, Colorado — including buyer and seller representation,',
    'neighborhood guides, market reporting, and current and sold listings.',
    '',
    '## Key pages',
    '',
    `- [Properties for Sale](${baseUrl}/listings): Search all active Aspen and Snowmass listings.`,
    `- [Exclusive Listings](${baseUrl}/exclusive-listings): Properties we currently represent.`,
    `- [Sold Properties](${baseUrl}/sold): Recently closed transactions.`,
    `- [Buy](${baseUrl}/buy): Buyer representation and the Aspen purchase process.`,
    `- [Sell](${baseUrl}/sell): Seller representation, pricing, and marketing.`,
    `- [Communities](${baseUrl}/communities): Neighborhood guides across the valley.`,
    `- [Blog & Market Reports](${baseUrl}/blog): Guides, neighborhood articles, and Aspen and Snowmass market reports.`,
    `- [About Stacey K. Kelly](${baseUrl}/about/stacey-k-kelly): Background, credentials, and client reviews.`,
    `- [Contact](${baseUrl}/contact-us): Get in touch.`,
    '',
  ];

  const communities = (content?.communities || []).filter((c) => c.title && c.slug);
  if (communities.length > 0) {
    lines.push('## Communities', '');
    for (const community of communities) {
      const summary = community.description?.replace(/\s+/g, ' ').trim();
      lines.push(
        `- [${community.title}](${baseUrl}/communities/${community.slug})` +
          (summary ? `: ${clip(summary, 140)}` : '')
      );
    }
    lines.push('');
  }

  const posts = (content?.posts || []).filter((p) => p.title && p.slug);
  if (posts.length > 0) {
    lines.push('## Guides and articles', '');
    for (const post of posts) {
      lines.push(`- [${post.title}](${baseUrl}/${post.slug})`);
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}

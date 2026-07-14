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
  "communities": *[_type == "community" && defined(slug.current)] | order(featured desc, title asc)[0...25]{
    title, "slug": slug.current, description
  },
  "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...30]{
    title, "slug": slug.current
  }
}`;

type ContentResult = {
  communities?: Array<{ title?: string; slug?: string; description?: string }>;
  posts?: Array<{ title?: string; slug?: string }>;
};

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

  const description =
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
    `- [Market Reports](${baseUrl}/market-reports): Aspen and Snowmass market data.`,
    `- [About](${baseUrl}/about): Background and credentials.`,
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
          (summary ? `: ${summary.slice(0, 140)}` : '')
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

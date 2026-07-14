import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getBaseUrl } from '@/lib/settings';
import { AI_BOT_USER_AGENTS, AUDIT_BOT_USER_AGENTS, getCrawlBaseUrl, isStagingHost } from '@/lib/crawlers';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getBaseUrl();

  // Staging/preview builds run on *.vercel.app; production is a custom domain.
  // Search engines are refused outright so staging never competes with
  // production in the index. (The middleware also sets X-Robots-Tag: noindex.)
  //
  // SEO auditing tools are allowlisted: the pre-launch build is exactly what
  // they need to crawl, and they don't publish an index.
  //
  // Order matters here, even though it shouldn't. A spec-compliant parser picks
  // the most specific matching group regardless of position, but Semrush's
  // checker reports the site as forbidden unless its record follows the
  // wildcard — its own remediation text says to add the record "to the end of
  // your robots.txt file". So: wildcard deny first, audit-bot allows last.
  // Correct parsers are unaffected.
  const host = (await headers()).get('host') || '';
  if (isStagingHost(host)) {
    return {
      rules: [
        { userAgent: '*', disallow: '/' },
        ...AUDIT_BOT_USER_AGENTS.map((userAgent) => ({ userAgent, allow: '/' })),
      ],
      sitemap: `${getCrawlBaseUrl(host, baseUrl)}/sitemap.xml`,
    };
  }

  // Single rule covers every crawler. /_next/static/* (CSS, JS bundles,
  // optimized images, fonts) is intentionally NOT blocked — Google,
  // Bing, and every AI crawler need to fetch CSS+JS to render the page
  // for indexing. Google's own guidance: "Make sure that crawlers can
  // access these files. If they're blocked, we can't properly render
  // and index your pages."
  //
  // What we DO block:
  //   /api/             — JSON endpoints, not content
  //   /studio/          — Sanity admin UI
  //   /saved-properties/ — per-user content behind auth
  //   /dashboard/       — agent dashboard
  //   /account/         — user account pages (if present)
  //   /private/         — any private folder
  const privatePaths = [
    '/api/',
    '/studio/',
    '/saved-properties/',
    '/dashboard/',
    '/account/',
    '/private/',
  ];

  return {
    rules: [
      // AI crawlers are named explicitly. They would already match `*` below, so
      // this is functionally identical — but it states the allowance outright so
      // it cannot be revoked by accident. Note each group repeats the private
      // paths: a crawler that matches a named group ignores `*` entirely, so
      // omitting them here would expose /studio and /dashboard to these bots.
      ...AI_BOT_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: privatePaths,
      })),
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

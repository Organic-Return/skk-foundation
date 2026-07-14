/**
 * Crawler policy for staging hosts.
 *
 * Staging (*.vercel.app) is closed to search engines so it never competes with
 * production in the index. SEO auditing tools are the exception: they need to
 * crawl the pre-launch build, and they don't publish an index, so letting them
 * in costs nothing.
 *
 * Both robots.txt and the middleware read this list, so the allowlist and the
 * X-Robots-Tag header can't drift apart — a bot allowed by robots.txt but sent
 * `nofollow` would only ever crawl the homepage.
 */
/**
 * robots.txt user-agent tokens, spelled exactly as each tool looks for them.
 * Screaming Frog's token contains spaces ("Screaming Frog SEO Spider") — the
 * squashed form does not match and the crawler falls through to `*`.
 */
export const AUDIT_BOT_USER_AGENTS = [
  'SiteAuditBot', // Semrush Site Audit
  'SemrushBot',
  'AhrefsSiteAudit',
  'AhrefsBot',
  'Screaming Frog SEO Spider',
] as const;

/** Strip everything but letters and digits, so "Screaming Frog SEO Spider/21.4" matches its token. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** True for a *.vercel.app preview/staging deployment. Production is a custom domain. */
export function isStagingHost(host: string | null | undefined): boolean {
  return !!host && host.endsWith('.vercel.app');
}

/** True when the request comes from an SEO auditing tool we allow onto staging. */
export function isAuditBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = normalize(userAgent);
  return AUDIT_BOT_USER_AGENTS.some((bot) => ua.includes(normalize(bot)));
}

/**
 * Origin to use for robots.txt and sitemap.xml.
 *
 * On staging this is the staging host itself, NOT settings.siteUrl. The
 * configured site URL points at the production domain, which today still serves
 * the previous site — advertising its sitemap from staging would walk an
 * auditing crawler straight off the build it was pointed at and onto the old
 * site. Everywhere else, the canonical site URL is correct.
 */
export function getCrawlBaseUrl(host: string | null | undefined, canonicalBaseUrl: string): string {
  return isStagingHost(host) ? `https://${host}` : canonicalBaseUrl;
}

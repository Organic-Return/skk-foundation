/**
 * Canonical URL for a team member's profile.
 *
 * Stacey's profile is the editorial page at /about/stacey-k-kelly; the generic
 * /team/<slug> route for her slug is a permanent redirect there (next.config).
 * Linking straight to the destination keeps 120+ listing pages, the homepage
 * Person schema and the team component from pointing crawlers at a redirect.
 */
const PROFILE_OVERRIDES: Record<string, string> = {
  'stacey-k-kelly': '/about/stacey-k-kelly',
};

export function profileHref(slug: string | undefined | null): string | null {
  if (!slug) return null;
  return PROFILE_OVERRIDES[slug] ?? `/team/${slug}`;
}

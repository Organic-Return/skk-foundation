/**
 * The one file in src/lib/schema that differs per site. Everything else in
 * the module is shared verbatim between the tenant codebases.
 */
import { profileHref } from '@/lib/profiles';

export const siteConfig = {
  /**
   * Path of an agent's profile page for a team member slug. The primary
   * agent's editorial page overrides the generic route (see lib/profiles);
   * the RC Sotheby's template serves profiles under /agents.
   */
  agentProfilePath: (slug: string, template?: string | null): string => {
    const href = profileHref(slug) || `/team/${slug}`;
    return template === 'rcsothebys-custom' && href.startsWith('/team/') ? href.replace('/team/', '/agents/') : href;
  },
  /** The listings search page, for the WebSite SearchAction. */
  searchPath: '/listings',
};

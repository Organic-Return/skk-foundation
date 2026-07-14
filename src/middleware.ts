import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuditBot, isStagingHost } from '@/lib/crawlers';

const isRCSothebys = process.env.NEXT_PUBLIC_SITE_TEMPLATE === 'rcsothebys-custom';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // RC Sotheby's: redirect /team → /agents (preserve subpaths and query params)
  if (isRCSothebys && pathname.startsWith('/team')) {
    const newPath = pathname.replace(/^\/team/, '/agents');
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 301);
  }

  const response = NextResponse.next();

  // An X-Robots-Tag header rather than a meta tag: reading the request host
  // inside generateMetadata would opt the entire site out of static
  // generation. Google honors the header identically.
  //
  // Audit tools are exempt. `nofollow` would stop them after the homepage, so
  // sending it would make the allowlist in robots.txt pointless.
  const staging = isStagingHost(request.headers.get('host'));
  const auditing = isAuditBot(request.headers.get('user-agent'));
  if (staging && !auditing) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  // Run on every route so the staging noindex applies sitewide, skipping Next
  // internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

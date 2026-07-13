import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isRCSothebys = process.env.NEXT_PUBLIC_SITE_TEMPLATE === 'rcsothebys-custom';

/**
 * Staging hosts must never be indexed. Production runs on a custom domain, so
 * any *.vercel.app host is a preview or staging build. These have been getting
 * crawled and competing with the real site in search results.
 */
function isStagingHost(host: string | null): boolean {
  return !!host && host.endsWith('.vercel.app');
}

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
  if (isStagingHost(request.headers.get('host'))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  // Run on every route so the staging noindex applies sitewide, skipping Next
  // internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // Dashboard route protection: check for Supabase auth cookie
  // The login page is excluded — only protect /dashboard itself and sub-pages
  if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/login')) {
    const supabaseAuthCookie = request.cookies.getAll()
      .find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

    if (!supabaseAuthCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/team', '/team/:path*', '/dashboard', '/dashboard/:path*'],
};

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Short URLs for the affiliation pages, which live under /about/.
  async redirects() {
    return [
      { source: '/christies-masters-circle', destination: '/about/christies-masters-circle', permanent: true },
      { source: '/the-council', destination: '/affiliated-partners/the-council', permanent: true },
      { source: '/about/the-council', destination: '/affiliated-partners/the-council', permanent: true },
      // The Council is the only partner group on this site; the index and the
      // retired Ski Town / Market Leaders sections all resolve to it.
      { source: '/affiliated-partners', destination: '/affiliated-partners/the-council', permanent: true },
      { source: '/affiliated-partners/ski-town/:path*', destination: '/affiliated-partners/the-council', permanent: true },
      { source: '/affiliated-partners/market-leaders/:path*', destination: '/affiliated-partners/the-council', permanent: true },
    ];
  },

  // Image optimization with modern formats
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // MLS image sources
      {
        protocol: 'https',
        hostname: '*.mlsmatrix.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.photos.flexmls.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'photos.flexmls.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.mls.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ssl.cdn-redfin.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.zillowstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ap.rdcpix.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.listingphotos.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
    // Enable AVIF and WebP for better compression and quality
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;

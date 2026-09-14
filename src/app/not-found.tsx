import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
};

/**
 * Custom 404. Next renders this inside the root layout, so the site header
 * and footer wrap it automatically; it only has to fill the middle.
 */
export default function NotFound() {
  return (
    <>
      <PageHero
        eyebrow="Error 404"
        title="Page Not Found"
        subtitle="The page you're looking for has moved, was renamed, or never existed."
      />

      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <h2 className="mb-4">Let&apos;s get you back on track</h2>
          <div className="w-16 h-[1px] bg-gold mx-auto mb-8" />
          <p className="mx-auto mb-10 text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed">
            Browse the latest Aspen and Snowmass listings, or reach out and Stacey will point you in the right direction.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/listings" className="btn-modern-cta">
              <span>Search Homes</span>
            </Link>
            <Link href="/" className="btn-modern-cta">
              <span>Return Home</span>
            </Link>
            <Link href="/contact-us" className="btn-modern-cta">
              <span>Contact Stacey</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

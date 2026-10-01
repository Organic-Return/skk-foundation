import Link from 'next/link';
import { availablePropertyTypeViews, propertyTypeHref } from '@/lib/propertyTypes';

interface BrowseByPropertyTypeProps {
  /** Property types present in the feed; omit to show every known view. */
  feedTypes?: string[];
  /** 'page' renders a section on the listings page; 'footer' a compact row on dark. */
  variant?: 'page' | 'footer';
}

/**
 * Server-rendered links to each property-type view of the listings grid, so
 * rentals, commercial and land listings sit on a link path from every page
 * rather than only in the sitemap.
 */
export default function BrowseByPropertyType({ feedTypes, variant = 'page' }: BrowseByPropertyTypeProps) {
  const views = availablePropertyTypeViews(feedTypes);
  if (views.length === 0) return null;

  if (variant === 'footer') {
    return (
      <nav aria-label="Browse properties by type" className="mt-12 pt-8 border-t border-white/10">
        <h3 className="!mt-0 text-xs uppercase tracking-[0.2em] text-white/40 mb-4">Browse Properties</h3>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 list-none p-0 m-0">
          <li><Link href="/listings" className="text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors duration-300">All Listings</Link></li>
          <li><Link href="/exclusive-listings" className="text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors duration-300">Exclusive Listings</Link></li>
          <li><Link href="/off-market" className="text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors duration-300">Off-Market</Link></li>
          <li><Link href="/sold" className="text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors duration-300">Sold</Link></li>
          {views.map((v) => (
            <li key={v.type}>
              <Link href={propertyTypeHref(v.type)} className="text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors duration-300">
                {v.label}
              </Link>
            </li>
          ))}
          <li><Link href="/resources" className="text-white/60 text-sm font-light hover:text-[var(--modern-gold)] transition-colors duration-300">Resource Center</Link></li>
        </ul>
      </nav>
    );
  }

  return (
    <section aria-labelledby="browse-by-type-heading" className="bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-10">
        <h2 id="browse-by-type-heading" className="!mt-0 !mb-4 !text-xs uppercase tracking-[0.2em] !font-medium text-[var(--modern-gold)]">
          Browse by Property Type
        </h2>
        <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
          {views.map((v) => (
            <li key={v.type}>
              <Link
                href={propertyTypeHref(v.type)}
                className="inline-block px-4 py-2 border border-gray-200 dark:border-white/15 text-sm font-light text-[#1a1a1a] dark:text-white hover:border-[var(--modern-gold)] hover:text-[var(--modern-gold)] transition-colors"
              >
                {v.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

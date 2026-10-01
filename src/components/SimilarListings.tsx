import Image from 'next/image';
import Link from 'next/link';
import { getListingHref, getListings, type MLSProperty } from '@/lib/listings';

function formatPrice(price: number | null): string {
  if (!price) return 'Price on request';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

interface SimilarListingsProps {
  listing: MLSProperty;
  template?: string;
}

/**
 * Lateral links between listing pages. Each of the 2,000-odd listing pages
 * was linked from exactly one place, its page of the listings grid. Four
 * neighbours of the same town and property type give every listing inbound
 * links from other listings and a path onward.
 */
export default async function SimilarListings({ listing, template }: SimilarListingsProps) {
  if (!listing.city) return null;
  // `property_type` on a transformed listing is the subtype (Single Family
  // Residence, Condominium) when the feed has one; the query's type filter
  // matches the feed's coarse type, so the two must not be confused.
  const feedType = listing.feed_property_type || listing.property_type || undefined;
  const subType = listing.feed_property_type && listing.property_type !== listing.feed_property_type
    ? listing.property_type || undefined
    : undefined;
  const base = {
    cities: [listing.city],
    allowedStatuses: ['Active', 'Active Under Contract', 'Pending'],
    sort: 'newest' as const,
  };
  let candidates: MLSProperty[] = [];
  try {
    const result = await getListings(1, 12, { ...base, propertyType: feedType, propertySubType: subType });
    candidates = result.listings;
    // A rare subtype (a ranch, a mobile home) may have no neighbours; widen to
    // the feed type before giving up.
    if (candidates.length < 3 && subType) {
      candidates = (await getListings(1, 12, { ...base, propertyType: feedType })).listings;
    }
  } catch {
    return null;
  }
  const seen = new Set<string>([listing.address || '']);
  const similar = candidates
    .filter((c) => c.id !== listing.id && c.mls_number !== listing.mls_number)
    // One card per address: a property listed under two MLS numbers should
    // not fill two of the four slots.
    .filter((c) => {
      const key = c.address || c.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
  if (similar.length === 0) return null;

  const isModern = template === 'custom-one' || template === 'modern';
  const label = feedType === 'Residential Lease' || feedType === 'Commercial Lease' ? 'Rentals' : 'Properties';

  return (
    <section
      aria-labelledby="similar-listings-heading"
      className={isModern ? 'py-16 md:py-24 bg-[var(--modern-gray-lighter)]' : 'py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]'}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-sm tracking-[0.3em] uppercase text-[var(--modern-gold)]">Keep Exploring</span>
          <h2
            id="similar-listings-heading"
            className="!mt-4 !mb-0 font-serif !text-3xl md:!text-4xl !font-light tracking-wide text-[var(--modern-black)] dark:text-white"
          >
            More {label} in {listing.city}
          </h2>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 list-none p-0 m-0">
          {similar.map((item) => {
            const photo = item.photos?.[0];
            const facts = [
              item.bedrooms ? `${item.bedrooms} bd` : null,
              item.bathrooms ? `${item.bathrooms} ba` : null,
              item.square_feet ? `${item.square_feet.toLocaleString()} sq ft` : null,
            ].filter(Boolean).join(' · ');
            return (
              <li key={item.id}>
                <Link href={getListingHref(item)} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#e9e7e3] dark:bg-[#222]">
                    {photo && (
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="!mt-4 !mb-1 text-lg font-light text-[var(--modern-black)] dark:text-white">
                    {formatPrice(item.list_price)}
                  </p>
                  <p className="!my-0 text-sm text-[#1a1a1a] dark:text-white/90 group-hover:text-[var(--modern-gold)] transition-colors">
                    {item.address || `MLS ${item.mls_number}`}
                  </p>
                  {facts && <p className="!mt-1 !mb-0 text-xs tracking-wide text-[#8a8a8a] dark:text-gray-500">{facts}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

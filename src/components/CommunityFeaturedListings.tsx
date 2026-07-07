import Link from "next/link";
import Image from "next/image";
import { getListingHref, type MLSProperty } from "@/lib/listings";

function formatPrice(price: number | null): string {
  if (!price) return "Price Upon Request";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatSqft(sqft: number | null): string {
  if (!sqft) return "";
  return new Intl.NumberFormat("en-US").format(sqft) + " sq ft";
}

/**
 * Showcase of the highest-priced active listings within a community/city.
 * Renders up to 6 cards, each linking to the property. Renders nothing when empty.
 */
export default function CommunityFeaturedListings({
  title,
  subtitle,
  listings,
  city,
}: {
  title: string;
  subtitle?: string;
  listings: MLSProperty[];
  city?: string;
}) {
  const items = (listings || []).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-12 md:mb-16">
          {subtitle && (
            <span className="text-[var(--color-gold)] text-xs uppercase tracking-[0.3em] font-light mb-4 block">
              {subtitle}
            </span>
          )}
          <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-12">
          {items.map((listing) => (
            <Link key={listing.id} href={getListingHref(listing)} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#f0ede8] dark:bg-[#2a2a2a]">
                {listing.photos && listing.photos.length > 0 ? (
                  <Image
                    src={listing.photos[0]}
                    alt={listing.address || title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#b0b0b0]">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-[var(--color-navy,#002349)] text-white">
                    For Sale
                  </span>
                </div>
              </div>
              <div className="pt-4 pb-2">
                <div className="text-xl font-light text-[#1a1a1a] dark:text-white tracking-wide mb-2">
                  {formatPrice(listing.list_price)}
                </div>
                <p className="text-sm text-[#4a4a4a] dark:text-gray-300 font-light line-clamp-1">
                  {listing.address || "Address available on request"}
                </p>
                <div className="flex items-center mt-3 text-xs text-[#6a6a6a] dark:text-gray-400 font-light">
                  {listing.bedrooms ? <span>{listing.bedrooms} Beds</span> : null}
                  {listing.bathrooms ? (
                    <>
                      {listing.bedrooms ? <span className="mx-2 text-[#d0d0d0]">|</span> : null}
                      <span>{listing.bathrooms} Baths</span>
                    </>
                  ) : null}
                  {listing.square_feet ? (
                    <>
                      {(listing.bedrooms || listing.bathrooms) ? <span className="mx-2 text-[#d0d0d0]">|</span> : null}
                      <span>{formatSqft(listing.square_feet)}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {city && (
          <div className="text-center mt-12 md:mt-16">
            <Link
              href={`/listings?city=${encodeURIComponent(city)}`}
              className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-[#1a1a1a] dark:text-white hover:bg-[var(--color-gold)] hover:text-white transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
            >
              View All Listings in {city}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

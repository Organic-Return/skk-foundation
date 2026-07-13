import type { Metadata } from 'next';
import { getOpenHouseListings, getListingHref } from '@/lib/listings';
import OpenHouseGrid from '@/components/OpenHouseGrid';
import PageHero from '@/components/PageHero';
import { getBaseUrl, getSiteName } from '@/lib/settings';
import StructuredData from '@/components/StructuredData';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  const title = `Open Houses | ${siteName}`;
  const description = `Browse upcoming open houses with ${siteName}.`;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/open-houses` },
    openGraph: { title, description, type: 'website', url: `${baseUrl}/open-houses` },
  };
}

export default async function OpenHousesPage() {
  const [listings, baseUrl] = await Promise.all([getOpenHouseListings(), getBaseUrl()]);

  const openHousesSchema = collectionPageSchema({
    name: 'Open Houses',
    url: `${baseUrl}/open-houses`,
    items: listings.map((l) => ({
      name: l.address || l.mls_number,
      url: `${baseUrl}${getListingHref(l)}`,
    })),
  });
  const openHousesCrumbs = breadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Open Houses', url: `${baseUrl}/open-houses` },
  ]);

  return (
    <main className="min-h-screen">
      {openHousesSchema && <StructuredData data={openHousesSchema} />}
      <StructuredData data={openHousesCrumbs} />
      {/* Hero */}
      <PageHero
        title="Open Houses"
        subtitle="Visit our upcoming open houses and find your next home"
      >
        {listings.length > 0 && (
          <p className="text-white/50 text-sm mt-3 font-light">
            {listings.length} upcoming {listings.length === 1 ? 'open house' : 'open houses'}
          </p>
        )}
      </PageHero>

      {/* Listings */}
      <section className="py-16 md:py-24 bg-[var(--rc-cream)]">
        <div className="max-w-7xl mx-auto px-6">
          {listings.length > 0 ? (
            <OpenHouseGrid listings={listings} />
          ) : (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 mx-auto mb-6 text-[var(--rc-brown)]/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h2
                className="text-xl md:text-2xl font-light uppercase tracking-[0.08em] text-[var(--rc-navy)] mb-3"
                style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
              >
                No Upcoming Open Houses
              </h2>
              <p className="text-[var(--rc-brown)] text-sm max-w-md mx-auto">
                There are no open houses scheduled at this time. Please check back soon
                or contact us for a private showing.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

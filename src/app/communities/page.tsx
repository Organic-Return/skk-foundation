import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import PageHero from '@/components/PageHero';
import StructuredData from '@/components/StructuredData';
import { getBaseUrl, getSiteName } from '@/lib/settings';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/seo';

export const revalidate = 300;

// This index did not exist. Community detail pages were reachable only from the
// sitemap (Semrush flagged all 34 as orphaned), and the breadcrumb on every
// community page pointed at /communities — a 404.
const COMMUNITIES_QUERY = `*[_type == "community" && defined(slug.current)] | order(featured desc, title asc){
  _id,
  title,
  "slug": slug.current,
  description,
  featuredImage,
  communityType
}`;

type Community = {
  _id: string;
  title?: string;
  slug?: string;
  description?: string;
  featuredImage?: unknown;
  communityType?: string;
};

const { projectId, dataset } = client.config();
const urlFor = (source: unknown) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source as never)
    : null;

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  const title = `Aspen & Snowmass Communities | ${siteName}`;
  const description =
    'Explore the neighborhoods and communities of Aspen, Snowmass Village, and the Roaring Fork Valley — from Red Mountain and the West End to Old Snowmass, Basalt, and Carbondale.';

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/communities` },
    openGraph: { title, description, type: 'website', url: `${baseUrl}/communities` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CommunitiesPage() {
  const [communities, baseUrl] = await Promise.all([
    client.fetch<Community[]>(COMMUNITIES_QUERY, {}, { next: { revalidate: 300 } }),
    getBaseUrl(),
  ]);

  const listSchema = collectionPageSchema({
    name: 'Communities',
    url: `${baseUrl}/communities`,
    items: (communities || []).map((c) => ({
      name: c.title,
      url: `${baseUrl}/communities/${c.slug}`,
    })),
  });
  const crumbs = breadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Communities', url: `${baseUrl}/communities` },
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {listSchema && <StructuredData data={listSchema} />}
      <StructuredData data={crumbs} />

      <PageHero
        title="Communities"
        subtitle="Explore Aspen, Snowmass Village, and the Roaring Fork Valley — neighborhood by neighborhood."
      />

      <section className="py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          {communities && communities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {communities.map((community) => {
                const imageUrl = community.featuredImage
                  ? urlFor(community.featuredImage)?.width(800).height(600).url()
                  : null;

                return (
                  <Link
                    key={community._id}
                    href={`/communities/${community.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#f0efed] dark:bg-[#222]">
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={community.title || ''}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <h2 className="font-serif text-2xl font-light text-[#1a1a1a] dark:text-white mt-5 mb-2 tracking-wide">
                      {community.title}
                    </h2>
                    {community.description && (
                      <p className="text-[#5a5a5a] dark:text-gray-400 font-light leading-relaxed line-clamp-3">
                        {community.description}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[#6a6a6a] dark:text-gray-400 font-light">
              Community guides will appear here as they are published.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

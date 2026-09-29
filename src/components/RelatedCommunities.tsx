import Image from 'next/image';
import Link from 'next/link';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { relatedCommunities, type CommunitySummary } from '@/lib/communityArea';

const { projectId, dataset } = client.config();
const urlFor = (source: unknown) =>
  projectId && dataset ? createImageUrlBuilder({ projectId, dataset }).image(source as never) : null;

interface RelatedCommunitiesProps {
  /** Slug of the community page being rendered; excluded from the list. */
  currentSlug: string;
  /** Every community document (title, slug, communityType, featuredImage). */
  communities: CommunitySummary[];
  variant?: 'classic' | 'luxury';
}

/**
 * Lateral links to sibling communities. Community pages otherwise only link
 * the five town pages in the header, so a neighborhood such as Base Village
 * had no path to Upper Snowmass or any other neighbor. Descriptive anchor text
 * (the community title) so the links carry meaning for crawlers too.
 */
export default function RelatedCommunities({ currentSlug, communities, variant = 'classic' }: RelatedCommunitiesProps) {
  const { area, items } = relatedCommunities(currentSlug, communities, 6);
  if (items.length === 0) return null;

  const isLuxury = variant === 'luxury';
  const heading = area ? `More in ${area.label}` : 'Explore Other Communities';

  return (
    <section
      aria-labelledby="related-communities-heading"
      className={isLuxury ? 'py-24 md:py-32 bg-[#f7f6f4]' : 'py-16 md:py-24 bg-[#f7f6f4] dark:bg-[#141414]'}
    >
      <div className={isLuxury ? 'max-w-[1440px] mx-auto px-8 lg:px-12' : 'max-w-7xl mx-auto px-6 md:px-12 lg:px-16'}>
        <div className="text-center mb-12 md:mb-16">
          <h2
            id="related-communities-heading"
            className={
              isLuxury
                ? '!mt-0 font-luxury text-3xl md:text-4xl font-light text-[var(--color-charcoal)] tracking-wide'
                : '!mt-0 font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-white tracking-wide'
            }
          >
            {heading}
          </h2>
          <div className="w-16 h-[1px] bg-[var(--color-gold)] mx-auto mt-6" />
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 list-none p-0 m-0">
          {items.map((community) => {
            const imageUrl = community.featuredImage
              ? urlFor(community.featuredImage)?.width(800).height(600).url()
              : null;
            return (
              <li key={community.slug}>
                <Link href={`/communities/${community.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#e9e7e3] dark:bg-[#222]">
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3
                    className={
                      isLuxury
                        ? '!mt-5 mb-0 font-luxury text-xl md:text-2xl font-light text-[var(--color-charcoal)] tracking-wide group-hover:text-[var(--color-gold)] transition-colors'
                        : '!mt-5 mb-0 font-serif text-xl md:text-2xl font-light text-[#1a1a1a] dark:text-white tracking-wide group-hover:text-[var(--color-gold)] transition-colors'
                    }
                  >
                    {community.title}
                  </h3>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { client } from '@/sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { getListingsByAgentId, getListingHref, type MLSProperty } from '@/lib/listings';
import { computeSalesTotals, formatUSD, type SalesBaseline } from '@/lib/salesTotals';
import { getBaseUrl, getSettings, getSiteName } from '@/lib/settings';
import { agentProfileSchema, breadcrumbSchema, reviewSchemas } from '@/lib/seo';
import StructuredData from '@/components/StructuredData';
import VideoFeatureCarousel from '@/components/VideoFeatureCarousel';
import TestimonialsSection from '@/components/TestimonialsSection';
import AgentContactForm from '@/components/AgentContactForm';

/**
 * The "About Stacey" page — the site's one editorial profile.
 *
 * Deliberately not the generic team-member template: a black hero that
 * continues the header, a magazine-style biography with a pull quote, the
 * career numbers that /sold, /buy and /sell also show, her affiliations,
 * client videos and reviews, a handful of current listings, and a contact
 * form. Everything on it is read from Sanity or the MLS; nothing is typed in.
 */

const SLUG = 'stacey-k-kelly';
const options = { next: { revalidate: 300 } };

const builder = createImageUrlBuilder(client);
const urlFor = (src: any) => builder.image(src);

const AGENT_QUERY = `*[_type == "teamMember" && slug.current == $slug][0]{
  name, title, bio, image, email, phone, mobile, address, mlsAgentId, mlsAgentIdSold,
  socialMedia{ facebook, instagram, twitter, linkedin }
}`;

const PAGE_DATA_QUERY = `{
  "baseline": *[_type == "soldPage"][0].baseline{ soldCount, salesVolume, asOf },
  "years": *[_type == "buyPage"][0].yearsOfExperience,
  "accolades": *[_type == "homepage"][0].accolades.items[type != "image"]{ value, prefix, label, liveValue },
  "videos": *[_type == "homepage"][0].clientVideosSection{ enabled, title, videos[]{ playbackId, title, description } },
  "affiliations": *[_type == "settings"][0].footer.affiliationLogos[]{ _key, alt, href, image },
  "mastersBadge": *[_type == "christiesMastersCircle"][0].sectionLogo,
  "testimonials": *[_type == "testimonialsPage"][0]{
    featuredTestimonial{ quote, author, role, location },
    testimonials[]{ quote, author, role, location, featured }
  },
  "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...3]{
    title, "slug": slug.current, publishedAt, image, "alt": image.alt
  }
}`;

// Client testimonial videos shown until the homepage section is populated in
// Sanity; the same list the homepage falls back to.
const DEFAULT_CLIENT_VIDEOS = [
  { playbackId: '7yu92MIHCn2WKgFPo3FXABLHeF7Pp5865oXQJlp6Dvo', title: 'Anne McGrath' },
  { playbackId: 'N01q01jdd9nighexU3EIgTJs02aThZAgPyiVXF2AF4usEk', title: 'The Goodwins' },
  { playbackId: '9XsyyxEs6R4MBVAxffhQ4uJqGe8zBFb00NrpANTi0214s', title: 'Michelle' },
  { playbackId: 'VXGLYAMwFcrv5L6XqOn5H3gpdI4cJ2eJrYllpeUQjM4', title: 'Danny' },
  { playbackId: 'x9mZ0101LIHgpqkq2LLqTkki2U02nLDvCglG1xXUT015EK4', title: 'Amy' },
];

type Agent = {
  name: string;
  title?: string;
  bio?: string;
  image?: any;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  mlsAgentId?: string;
  mlsAgentIdSold?: string;
  socialMedia?: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string };
};

type CmsTestimonial = { quote?: string; author?: string; role?: string; location?: string; featured?: boolean };

/** Strip inline styles from CMS bio HTML so the page's typography applies. */
function sanitizeBioHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s*style="[^"]*"/gi, '')
    .replace(/\s*style='[^']*'/gi, '')
    .replace(/<\/?font[^>]*>/gi, '')
    .replace(/\s*(bgcolor|color)="[^"]*"/gi, '');
}

const bioToText = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const formatPhone = (raw?: string) => {
  const d = (raw || '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}` : raw || '';
};

const formatPrice = (n: number | null) =>
  n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : 'Price on request';

export async function generateMetadata(): Promise<Metadata> {
  const [agent, baseUrl, siteName] = await Promise.all([
    client.fetch<Agent | null>(AGENT_QUERY, { slug: SLUG }, options),
    getBaseUrl(),
    getSiteName(),
  ]);
  const name = agent?.name?.trim() || 'Stacey K. Kelly';
  const title = `${name} | Aspen Snowmass Real Estate Agent`;
  const description = `Meet ${name}, Principal Broker with Christie's International Real Estate Aspen Snowmass. Aspen and Snowmass Village real estate agent since 2005, 50+ five-star reviews, and a member of Christie's Masters Circle and The Council.`;
  const image = agent?.image ? urlFor(agent.image).width(1200).height(630).fit('crop').url() : undefined;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/about/${SLUG}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${baseUrl}/about/${SLUG}`,
      siteName,
      images: image ? [{ url: image, width: 1200, height: 630, alt: name }] : [],
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] },
  };
}

export default async function AboutStaceyPage() {
  const [agent, data, settings, baseUrl] = await Promise.all([
    client.fetch<Agent | null>(AGENT_QUERY, { slug: SLUG }, options),
    client.fetch<any>(PAGE_DATA_QUERY, {}, options),
    getSettings(),
    getBaseUrl(),
  ]);
  if (!agent) notFound();

  const name = agent.name.trim();
  const firstName = name.split(' ')[0];
  const listings = await getListingsByAgentId(agent.mlsAgentId || null, agent.mlsAgentIdSold, name);
  const totals = computeSalesTotals(listings.soldListings, data?.baseline as SalesBaseline);
  const years: number | undefined = data?.years;

  const phone = formatPhone(settings?.contactInfo?.phone || agent.phone || agent.mobile);
  const phoneHref = `tel:${(settings?.contactInfo?.phone || agent.phone || agent.mobile || '').replace(/[^\d+]/g, '')}`;
  const email = agent.email || settings?.contactInfo?.email;
  const address = agent.address || settings?.contactInfo?.address;

  const social = [
    { label: 'Instagram', href: agent.socialMedia?.instagram || settings?.socialMedia?.instagram },
    { label: 'Facebook', href: agent.socialMedia?.facebook || settings?.socialMedia?.facebook },
    { label: 'LinkedIn', href: agent.socialMedia?.linkedin || settings?.socialMedia?.linkedin },
    { label: 'YouTube', href: settings?.socialMedia?.youtube },
  ].filter((s) => s.href);

  // Accolades: the homepage set, with any live value resolved to the same
  // career totals used everywhere else.
  const accolades: Array<{ value: string; label: string }> = (data?.accolades || [])
    .map((a: any) => ({
      value:
        a.liveValue === 'soldCount' ? String(totals.totalSold)
        : a.liveValue === 'salesVolume' ? formatUSD(totals.totalVolume)
        : `${a.prefix || ''}${a.value || ''}`,
      label: a.label || '',
    }))
    .filter((a: any) => a.value && a.label);

  const affiliations: Array<{ key: string; alt: string; href?: string; src: string; wide: boolean }> = (data?.affiliations || [])
    .filter((a: any) => a?.image)
    .map((a: any) => {
      const dims = a.image?.asset?.metadata?.dimensions;
      return {
        key: a._key,
        alt: a.alt || '',
        href: a.href,
        src: urlFor(a.image).height(240).url(),
        wide: !!dims && dims.width / dims.height > 1.6,
      };
    });
  // The Masters Circle badge exists in a dark-on-light version on its own
  // page; prefer it there since this blade sits on cream, not black.
  const mastersBadge = data?.mastersBadge ? urlFor(data.mastersBadge).height(240).url() : null;

  const tp = data?.testimonials;
  const testimonials: CmsTestimonial[] = [
    ...(tp?.featuredTestimonial?.quote ? [tp.featuredTestimonial] : []),
    ...((tp?.testimonials || []) as CmsTestimonial[]).slice().sort((a, b) => Number(!!b.featured) - Number(!!a.featured)),
  ]
    .filter((t, i, arr) => t?.quote && arr.findIndex((x) => x.quote === t.quote) === i)
    .slice(0, 3);

  const videos =
    data?.videos?.enabled === false
      ? []
      : data?.videos?.videos?.length
        ? data.videos.videos.map((v: any) => ({ playbackId: v.playbackId, title: v.title || '', description: v.description }))
        : DEFAULT_CLIENT_VIDEOS;

  const active: MLSProperty[] = listings.activeListings.slice(0, 3);
  const bioHtml = agent.bio ? sanitizeBioHtml(agent.bio) : '';
  const bioText = bioHtml ? bioToText(bioHtml) : '';
  const portrait = agent.image ? urlFor(agent.image).width(900).height(1200).fit('crop').quality(90).url() : null;
  const pageUrl = `${baseUrl}/about/${SLUG}`;

  const schemas = [
    agentProfileSchema({
      name,
      url: pageUrl,
      jobTitle: agent.title,
      image: portrait,
      description: bioText.slice(0, 300),
      email,
      telephone: phone,
      address,
      worksFor: "Christie's International Real Estate Aspen Snowmass",
      sameAs: social.map((s) => s.href),
      areaServed: ['Aspen', 'Snowmass Village', 'Old Snowmass', 'Basalt', 'Carbondale', 'Roaring Fork Valley'],
    }),
    breadcrumbSchema([
      { name: 'Home', url: baseUrl },
      { name: 'About', url: `${baseUrl}/about` },
      { name, url: pageUrl },
    ]),
    ...(reviewSchemas(testimonials, name) || []),
  ].filter(Boolean);

  const stats = [
    ...(years ? [{ value: `${years}+`, label: 'Years in Aspen Snowmass' }] : []),
    { value: String(totals.totalSold), label: 'Properties Sold' },
    { value: formatUSD(totals.totalVolume), label: 'Career Sales Volume' },
  ];

  return (
    <>
      <StructuredData data={schemas} />

      {/* Hero: continues the black header, editorial type beside the portrait */}
      <section className="relative bg-[var(--modern-black)] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pt-40 md:pt-48 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-end">
            <div className="lg:col-span-7">
              <p className="mx-auto lg:mx-0 text-[var(--color-gold)] text-xs md:text-sm uppercase tracking-[0.3em] mb-6">
                Aspen Snowmass Real Estate Agent
              </p>
              <h1 className="text-white !text-5xl md:!text-6xl lg:!text-7xl leading-[1.05] mb-6">{name}</h1>
              <p className="mx-auto lg:mx-0 text-white/70 text-sm md:text-base uppercase tracking-[0.2em] mb-10">
                {agent.title ? `${agent.title} · ` : ''}Christie&apos;s International Real Estate
              </p>

              <dl className="grid grid-cols-3 gap-6 md:gap-10 border-t border-white/15 pt-8 mb-10 max-w-2xl">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <dt className="order-2 text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/55 mt-2">{s.label}</dt>
                    <dd className="order-1 font-serif text-2xl md:text-4xl font-light text-white whitespace-nowrap leading-none">{s.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap gap-4">
                <a href="#contact" className="btn-modern-cta btn-modern-cta-on-dark">
                  <span>Work With {firstName}</span>
                </a>
                {phone && (
                  <a href={phoneHref} className="btn-modern-cta btn-modern-cta-on-dark bg-transparent">
                    <span>{phone}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              {portrait && (
                <div className="relative w-full max-w-md mx-auto lg:ml-auto lg:mr-0">
                  {/* Offset gold frame behind the portrait */}
                  <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 w-full h-full border border-[var(--color-gold)]" aria-hidden="true" />
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image src={portrait} alt={name} fill priority sizes="(max-width: 1024px) 90vw, 40vw" className="object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Accolades band */}
      {accolades.length > 0 && (
        <section className="bg-[var(--color-cream-dark)] border-b border-[#e8e6e3]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-14 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {accolades.map((a) => (
              <div key={a.label} className="text-center lg:text-left lg:border-l lg:border-[#d9d3ca] lg:pl-6 first:border-l-0 first:pl-0">
                <div className="font-serif text-4xl md:text-5xl font-light text-[var(--modern-black)] leading-none mb-3">{a.value}</div>
                <p className="mx-auto lg:mx-0 text-xs md:text-sm text-[#6a6a6a] leading-relaxed max-w-[26ch]">{a.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Biography */}
      {bioHtml && (
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 grid lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-40">
                <p className="mx-0 text-[var(--color-gold)] text-xs uppercase tracking-[0.3em] mb-4">The Story</p>
                <h2 className="!text-3xl md:!text-4xl mb-6">Mountain life, lived and sold</h2>
                <div className="w-16 h-[1px] bg-gold mb-8" />
                <blockquote className="font-serif text-2xl md:text-3xl font-light leading-snug text-[var(--modern-black)]">
                  &ldquo;Hard work, dedication, and fun.&rdquo;
                </blockquote>
                <p className="mx-0 mt-4 text-xs uppercase tracking-[0.2em] text-[#8a8a8a]">The creed {firstName} lives every day</p>
              </div>
            </div>
            <div
              className="lg:col-span-8 text-[#3a3a3a] text-lg md:text-xl font-light leading-relaxed [&_p]:mx-0 [&_p]:max-w-none [&_p+p]:mt-7 [&>p:first-child]:first-letter:font-serif [&>p:first-child]:first-letter:text-6xl [&>p:first-child]:first-letter:leading-[0.8] [&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mr-3 [&>p:first-child]:first-letter:mt-2 [&>p:first-child]:first-letter:text-[var(--color-gold)] [&_a]:text-[var(--color-gold)] [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: bioHtml }}
            />
          </div>
        </section>
      )}

      {/* Affiliations */}
      {(affiliations.length > 0 || mastersBadge) && (
        <section className="bg-[var(--modern-black)] text-white py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-white !text-3xl md:!text-4xl mb-4">A global network, local knowledge</h2>
              <div className="w-16 h-[1px] bg-gold mx-auto" />
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {affiliations.map((a) => {
                const inner = (
                  <div className="h-full flex flex-col items-center justify-center gap-6 border border-white/15 hover:border-[var(--color-gold)] transition-colors duration-300 p-10">
                    <div className={`relative ${a.wide ? 'h-12 w-56' : 'h-28 w-28'}`}>
                      <Image src={a.src} alt={a.alt} fill sizes="240px" className="object-contain brightness-0 invert" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/70 text-center">{a.alt}</span>
                  </div>
                );
                return a.href ? (
                  <Link key={a.key} href={a.href} className="block group">{inner}</Link>
                ) : (
                  <div key={a.key}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Client videos */}
      {videos.length > 0 && <VideoFeatureCarousel title={data?.videos?.title || 'In Their Words'} videos={videos} />}

      {/* Written testimonials */}
      <TestimonialsSection
        title="What Clients Say"
        testimonials={testimonials}
        allLink={{ href: '/testimonials', label: 'Read All Testimonials' }}
      />

      {/* Current listings */}
      {active.length > 0 && (
        <section className="bg-white py-20 md:py-24 border-t border-[#e8e6e3]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="text-center mb-12">
              <p className="mx-auto text-[var(--color-gold)] text-xs uppercase tracking-[0.3em] mb-4">On the Market</p>
              <h2 className="!text-3xl md:!text-4xl mb-4">{firstName}&apos;s Current Listings</h2>
              <div className="w-16 h-[1px] bg-gold mx-auto" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {active.map((l) => (
                <Link key={l.id} href={getListingHref(l)} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f5f5]">
                    {l.photos?.[0] && (
                      <Image
                        src={l.photos[0]}
                        alt={l.address || 'Listing'}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="pt-5">
                    <p className="mx-0 text-sm text-[#4a4a4a] leading-snug">{l.address}</p>
                    <p className="mx-0 font-serif text-2xl font-light text-[var(--modern-black)] mt-2">{formatPrice(l.list_price)}</p>
                    <p className="mx-0 text-xs uppercase tracking-[0.15em] text-[#8a8a8a] mt-2">
                      {[l.bedrooms ? `${l.bedrooms} Beds` : null, l.bathrooms ? `${l.bathrooms} Baths` : null, l.square_feet ? `${l.square_feet.toLocaleString()} Sq Ft` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-14">
              <Link href="/exclusive-listings" className="btn-modern-cta"><span>All Exclusive Listings</span></Link>
              <Link href="/sold" className="btn-modern-cta"><span>Sold Properties</span></Link>
            </div>
          </div>
        </section>
      )}

      {/* Latest writing */}
      {Array.isArray(data?.posts) && data.posts.length > 0 && (
        <section className="bg-[var(--color-cream-dark)] py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="text-center mb-12">
              <p className="mx-auto text-[var(--color-gold)] text-xs uppercase tracking-[0.3em] mb-4">From the Blog</p>
              <h2 className="!text-3xl md:!text-4xl mb-4">Market Insight from {firstName}</h2>
              <div className="w-16 h-[1px] bg-gold mx-auto" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {data.posts.map((p: any) => (
                <Link key={p.slug} href={`/${p.slug}`} className="group block bg-white">
                  <div className="relative aspect-[3/2] overflow-hidden">
                    {p.image && (
                      <Image
                        src={urlFor(p.image).width(800).height(533).fit('crop').url()}
                        alt={p.alt || p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <p className="mx-0 text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] mb-3">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                    </p>
                    <h3 className="!text-xl leading-snug group-hover:text-[var(--color-gold)] transition-colors">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="bg-[var(--modern-black)] text-white py-20 md:py-28 scroll-mt-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 grid lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="mx-0 text-[var(--color-gold)] text-xs uppercase tracking-[0.3em] mb-4">Get in Touch</p>
            <h2 className="text-white !text-3xl md:!text-4xl mb-6">Work With {firstName}</h2>
            <div className="w-16 h-[1px] bg-gold mb-8" />
            <p className="mx-0 text-white/70 font-light leading-relaxed mb-10">
              Whether you are weighing a first ski condo or planning a legacy property, a conversation is the right first step.
            </p>
            <dl className="space-y-6 text-sm">
              {phone && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Phone</dt>
                  <dd><a href={phoneHref} className="text-white hover:text-[var(--color-gold)] transition-colors">{phone}</a></dd>
                </div>
              )}
              {email && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Email</dt>
                  <dd><a href={`mailto:${email}`} className="text-white hover:text-[var(--color-gold)] transition-colors">{email}</a></dd>
                </div>
              )}
              {address && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Office</dt>
                  <dd className="text-white/85 whitespace-pre-line leading-relaxed">{address}</dd>
                </div>
              )}
              {social.length > 0 && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Follow</dt>
                  <dd className="flex flex-wrap gap-x-6 gap-y-2">
                    {social.map((s) => (
                      <a key={s.label} href={s.href as string} target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-[var(--color-gold)] transition-colors text-xs uppercase tracking-[0.2em]">
                        {s.label}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          <div className="lg:col-span-7">
            <AgentContactForm agentName={firstName} agentEmail={email} inverted />
          </div>
        </div>
      </section>
    </>
  );
}

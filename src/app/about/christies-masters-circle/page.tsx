import { type SanityDocument } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import type { Metadata } from "next";
import { getBaseUrl } from '@/lib/settings';
import StructuredData from '@/components/StructuredData';
import { breadcrumbSchema } from '@/lib/seo';

const QUERY = `*[_type == "christiesMastersCircle"][0]{
  heroEyebrow, heroTitle, heroSubtitle, heroImage,
  introHeading, introParagraphs[]{ text },
  mastersCircleHeading, mastersCircleParagraphs[]{ text },
  distinctionsHeading, distinctions[]{ title, description },
  christieHeading, christieIntro, christieBenefits[]{ title, description },
  stats[]{ value, label },
  ctaHeading, ctaSubtitle, ctaButtonText, ctaButtonLink,
  seo
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 60 } };

// Rich default content — renders fully even before the page is populated in
// Sanity Studio. Any field set in Sanity overrides the matching default below.
// NOTE: Christie's network figures are intentionally kept qualitative; verify
// and add specific stats in Sanity if desired.
const DEFAULT = {
  heroEyebrow: "Christie's International Real Estate",
  heroTitle: "The Masters Circle",
  heroSubtitle:
    "Stacey K. Kelly is among an elite group of advisors recognized by Christie's International Real Estate — pairing the prestige of the world's most storied name in luxury with deep roots in the Aspen and Snowmass markets.",
  heroImage: null as any,
  introHeading: "A distinction earned, not given",
  introParagraphs: [
    { text: "Founded in 1766, Christie's is the most celebrated name in the art and luxury world. Christie's International Real Estate extends that legacy to exceptional homes, uniting a global network of leading luxury brokerages under a single, trusted standard of excellence." },
    { text: "Each year, Christie's International Real Estate recognizes the very top of that network through its Masters Circle — an honor reserved for the advisors who consistently deliver extraordinary results for their clients. Stacey K. Kelly's induction places her among this distinguished group." },
  ],
  mastersCircleHeading: "What the Masters Circle means",
  mastersCircleParagraphs: [
    { text: "The Masters Circle is Christie's International Real Estate's recognition of its highest-performing advisors worldwide. Membership is based on proven achievement — sustained sales performance, exceptional client outcomes, and a command of the luxury market that few attain." },
    { text: "It is, by design, a small circle. For buyers and sellers, it is a simple signal of confidence: you are working with an advisor the world's preeminent luxury brand counts among its very best." },
  ],
  distinctionsHeading: "How it sets Stacey apart",
  distinctions: [
    { title: "Proven, top-tier performance", description: "Masters Circle status is earned through results, not tenure — a measure of consistent excellence at the highest end of the market." },
    { title: "A truly global network", description: "Stacey's listings and buyers are connected to Christie's affiliates in the world's most desirable destinations, and to the qualified clientele that network attracts." },
    { title: "The power of the Christie's name", description: "Few brands open doors like Christie's. That prestige — and the buyer confidence it carries — accompanies every home she represents." },
    { title: "Local mastery, global reach", description: "She pairs Christie's worldwide platform with intimate, on-the-ground knowledge of Aspen, Snowmass, and the Roaring Fork Valley." },
  ],
  christieHeading: "The advantage of listing with Christie's & SKK",
  christieIntro:
    "When you list with Stacey K. Kelly, your home is represented by the full marketing power of Christie's International Real Estate — tailored to your property and our market.",
  christieBenefits: [
    { title: "Global exposure", description: "Your property is showcased on christiesrealestate.com and distributed across the Christie's network, reaching affluent buyers around the world." },
    { title: "Bespoke marketing", description: "Editorial-quality photography, film, and storytelling craft a presentation worthy of your home and the Christie's name." },
    { title: "Luxury publications", description: "Christie's renowned luxury editorial — including Luxury Defined and Luxury Perspectives — places exceptional homes in front of a discerning, design-led audience." },
    { title: "A qualified buyer network", description: "Christie's connection to the worlds of art, collecting, and wealth means genuine access to high-net-worth buyers and a powerful global referral network." },
    { title: "Discretion and trust", description: "A reputation built over more than 250 years rests on confidentiality and integrity — the same standard Stacey brings to every client relationship." },
    { title: "Local expertise", description: "SKK's deep knowledge of Aspen and Snowmass ensures your home is positioned and priced to perform in our unique market." },
  ],
  stats: [
    { value: "1766", label: "The year Christie's was founded" },
    { value: "Global", label: "Network of luxury brokerages" },
    { value: "By invitation", label: "Masters Circle membership" },
    { value: "Aspen · Snowmass", label: "SKK local expertise" },
  ],
  ctaHeading: "Experience the difference",
  ctaSubtitle:
    "Whether you're buying or selling in the Aspen and Snowmass area, partner with an advisor who brings world-class reach and local mastery to every transaction.",
  ctaButtonText: "Connect with Stacey",
  ctaButtonLink: "/contact-us",
};

function merge(data: SanityDocument | null) {
  if (!data) return DEFAULT;
  const arr = (a: any, fallback: any[]) => (Array.isArray(a) && a.length > 0 ? a : fallback);
  return {
    heroEyebrow: data.heroEyebrow || DEFAULT.heroEyebrow,
    heroTitle: data.heroTitle || DEFAULT.heroTitle,
    heroSubtitle: data.heroSubtitle || DEFAULT.heroSubtitle,
    heroImage: data.heroImage || null,
    introHeading: data.introHeading || DEFAULT.introHeading,
    introParagraphs: arr(data.introParagraphs, DEFAULT.introParagraphs),
    mastersCircleHeading: data.mastersCircleHeading || DEFAULT.mastersCircleHeading,
    mastersCircleParagraphs: arr(data.mastersCircleParagraphs, DEFAULT.mastersCircleParagraphs),
    distinctionsHeading: data.distinctionsHeading || DEFAULT.distinctionsHeading,
    distinctions: arr(data.distinctions, DEFAULT.distinctions),
    christieHeading: data.christieHeading || DEFAULT.christieHeading,
    christieIntro: data.christieIntro || DEFAULT.christieIntro,
    christieBenefits: arr(data.christieBenefits, DEFAULT.christieBenefits),
    stats: arr(data.stats, DEFAULT.stats),
    ctaHeading: data.ctaHeading || DEFAULT.ctaHeading,
    ctaSubtitle: data.ctaSubtitle || DEFAULT.ctaSubtitle,
    ctaButtonText: data.ctaButtonText || DEFAULT.ctaButtonText,
    ctaButtonLink: data.ctaButtonLink || DEFAULT.ctaButtonLink,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch<SanityDocument>(QUERY, {}, options);
  const c = merge(data);
  const baseUrl = await getBaseUrl();
  const metaTitle = data?.seo?.metaTitle || "Christie's Masters Circle | Stacey K. Kelly";
  const metaDescription =
    data?.seo?.metaDescription ||
    "Stacey K. Kelly is a member of the Christie's International Real Estate Masters Circle. Learn what it means, how it sets her apart, and the advantages of listing with Christie's and SKK in Aspen & Snowmass.";
  const ogImageUrl = data?.seo?.ogImage
    ? urlFor(data.seo.ogImage)?.width(1200).height(630).url()
    : c.heroImage
    ? urlFor(c.heroImage)?.width(1200).height(630).url()
    : null;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical: `${baseUrl}/about/christies-masters-circle` },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
      url: `${baseUrl}/about/christies-masters-circle`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function ChristiesMastersCirclePage() {
  const [data, baseUrl] = await Promise.all([
    client.fetch<SanityDocument>(QUERY, {}, options),
    getBaseUrl(),
  ]);
  const c = merge(data);
  const heroImageUrl = c.heroImage ? urlFor(c.heroImage)?.width(1920).height(900).url() : null;

  const pageUrl = `${baseUrl}/about/christies-masters-circle`;
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: c.heroTitle,
    url: pageUrl,
    ...(c.heroSubtitle ? { description: c.heroSubtitle } : {}),
    ...(heroImageUrl ? { primaryImageOfPage: heroImageUrl } : {}),
  };
  const crumbs = breadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'About', url: `${baseUrl}/about` },
    { name: c.heroTitle, url: pageUrl },
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <StructuredData data={pageSchema} />
      <StructuredData data={crumbs} />
      {/* Hero */}
      <PageHero
        title={c.heroTitle}
        subtitle={c.heroSubtitle}
        eyebrow={c.heroEyebrow}
        image={heroImageUrl ?? undefined}
      />

      {/* Intro */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <div className="w-16 h-[1px] bg-[var(--color-gold)] mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
            {c.introHeading}
          </h2>
          {c.introParagraphs.map((p: any, i: number) => (
            <p key={i} className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.85] font-light text-[17px]">
              {p.text}
            </p>
          ))}
        </div>
      </section>

      {/* Stats band */}
      {c.stats.length > 0 && (
        <section className="py-12 md:py-16 bg-[var(--color-navy)]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {c.stats.map((s: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-serif font-light text-[var(--color-gold)] mb-2">
                    {s.value}
                  </div>
                  <div className="text-white/60 text-xs md:text-sm uppercase tracking-wider font-light">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Masters Circle + distinctions */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-3xl mb-14 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
              {c.mastersCircleHeading}
            </h2>
            {c.mastersCircleParagraphs.map((p: any, i: number) => (
              <p key={i} className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.85] font-light text-[17px]">
                {p.text}
              </p>
            ))}
          </div>

          {c.distinctions.length > 0 && (
            <>
              <h3 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mb-10 tracking-wide">
                {c.distinctionsHeading}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {c.distinctions.map((d: any, i: number) => (
                  <div key={i} className="border-t border-[#e8e6e3] dark:border-gray-800 pt-6">
                    <div className="flex items-baseline gap-4">
                      <span className="text-[var(--color-gold)] font-serif text-lg">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <h4 className="text-lg font-medium text-[#1a1a1a] dark:text-white mb-2">{d.title}</h4>
                        <p className="text-[#5a5a5a] dark:text-gray-400 font-light leading-relaxed">{d.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Christie's + SKK benefits */}
      <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-3xl mb-14 md:mb-16">
            <div className="w-16 h-[1px] bg-[var(--color-gold)] mb-8" />
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-6 tracking-wide">
              {c.christieHeading}
            </h2>
            {c.christieIntro && (
              <p className="text-[#4a4a4a] dark:text-gray-300 leading-[1.85] font-light text-[17px]">
                {c.christieIntro}
              </p>
            )}
          </div>
          {c.christieBenefits.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {c.christieBenefits.map((b: any, i: number) => (
                <div key={i} className="bg-white dark:bg-[#1a1a1a] p-8 border border-[#e8e6e3] dark:border-gray-800">
                  <h3 className="text-lg font-medium text-[#1a1a1a] dark:text-white mb-3">{b.title}</h3>
                  <p className="text-[#5a5a5a] dark:text-gray-400 font-light leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      {c.ctaHeading && (
        <section className="relative py-20 md:py-28 bg-[var(--color-navy)]">
          <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
              {c.ctaHeading}
            </h2>
            {c.ctaSubtitle && (
              <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
                {c.ctaSubtitle}
              </p>
            )}
            {c.ctaButtonText && (
              <Link
                href={c.ctaButtonLink || "/contact-us"}
                className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
              >
                {c.ctaButtonText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

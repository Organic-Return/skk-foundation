import { PortableText, type PortableTextComponents } from "next-sanity";
import { notFound } from "next/navigation";
import { createImageUrlBuilder } from "@sanity/image-url";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { client } from "@/sanity/client";
import { getBaseUrl } from "@/lib/settings";
import PageHero from "@/components/PageHero";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema } from "@/lib/seo";

/**
 * Affiliation pages (Studio > Affiliation Pages), e.g. /about/the-council.
 * Static siblings such as /about/christies-masters-circle keep their own
 * routes; this only handles slugs that exist as affiliationPage documents.
 */

const QUERY = `*[_type == "affiliationPage" && slug.current == $slug][0]{
  title, heroEyebrow, heroTitle, heroSubtitle, heroImage, logo, body,
  ctaHeading, ctaSubtitle, ctaButtonText, ctaButtonLink,
  seo{ metaTitle, metaDescription }
}`;

type Page = {
  title?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: any;
  logo?: any;
  body?: unknown[];
  ctaHeading?: string;
  ctaSubtitle?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  seo?: { metaTitle?: string; metaDescription?: string };
} | null;

const options = { next: { revalidate: 300 } };
const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset ? createImageUrlBuilder({ projectId, dataset }).image(source) : null;

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">{children}</p>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white mt-10 mb-4 tracking-wide">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mt-8 mb-3 tracking-wide">{children}</h3>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-2 border-[var(--color-gold)] pl-6 my-8 italic text-[#5a5a5a] dark:text-gray-400 font-serif text-lg">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <ul className="list-disc pl-6 mb-6 space-y-2 text-[#4a4a4a] dark:text-gray-300 font-light text-[17px] leading-[1.7]">{children}</ul>
    ),
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-medium text-[#1a1a1a] dark:text-white">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic font-serif">{children}</em>,
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => (
      <a href={value?.href} className="text-[var(--color-gold)] underline underline-offset-2 hover:opacity-80">{children}</a>
    ),
  },
};

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await client.fetch<Page>(QUERY, { slug }, options);
  const baseUrl = await getBaseUrl();
  if (!data) return { title: "Not found" };
  const title = data.seo?.metaTitle || data.heroTitle || data.title || "Affiliation";
  const description = data.seo?.metaDescription || data.heroSubtitle || undefined;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/about/${slug}` },
    openGraph: { title, description, type: "website", url: `${baseUrl}/about/${slug}` },
  };
}

export default async function AffiliationPage({ params }: Params) {
  const { slug } = await params;
  const data = await client.fetch<Page>(QUERY, { slug }, options);
  if (!data) notFound();
  const baseUrl = await getBaseUrl();

  const title = data.heroTitle || data.title || "Affiliation";
  const heroImageUrl = data.heroImage ? urlFor(data.heroImage)?.width(1920).height(800).url() : undefined;
  const logoUrl = data.logo ? urlFor(data.logo)?.height(400).url() : undefined;
  const hasBody = Array.isArray(data.body) && data.body.length > 0;

  const crumbs = breadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "About", url: `${baseUrl}/about` },
    { name: title, url: `${baseUrl}/about/${slug}` },
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {crumbs && <StructuredData data={crumbs} />}
      <PageHero title={title} subtitle={data.heroSubtitle} eyebrow={data.heroEyebrow} image={heroImageUrl ?? undefined} />

      {/* Logo band — dark, so white-on-transparent artwork reads as supplied. */}
      {logoUrl && (
        <section className="py-14 md:py-20 bg-[var(--color-navy)]">
          <div className="max-w-5xl mx-auto px-6 md:px-12 flex justify-center">
            <Image src={logoUrl} alt={title} width={640} height={200} className="h-24 md:h-32 w-auto object-contain" priority />
          </div>
        </section>
      )}

      {/* Body — renders only once written in Studio. */}
      {hasBody && (
        <section className="py-12 md:py-16">
          <div className="content-wide max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <PortableText value={data.body as never} components={portableTextComponents} />
          </div>
        </section>
      )}

      {/* CTA — same treatment as the Masters Circle page. */}
      {data.ctaHeading && (
        <section className="relative py-20 md:py-28 bg-[var(--color-navy)]">
          <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">{data.ctaHeading}</h2>
            {data.ctaSubtitle && (
              <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">{data.ctaSubtitle}</p>
            )}
            {data.ctaButtonText && (
              <Link
                href={data.ctaButtonLink || "/contact-us"}
                className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
              >
                {data.ctaButtonText}
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

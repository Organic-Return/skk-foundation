import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Partner, enrichPartnerWithAgentData, PartnerCard, PageContent, urlFor } from "../components";
import CTASection from "../CTASection";
import { getBaseUrl, getSiteName } from '@/lib/settings';

const COUNCIL_QUERY = `*[_type == "affiliatedPartner" && active == true && partnerType == "the_council"] | order(sortOrder asc, lastName asc) {
  _id,
  partnerType,
  firstName,
  lastName,
  agentStaffId,
  slug,
  title,
  company,
  location,
  latitude,
  longitude,
  // email / phone / website deliberately not projected: the directory is a
  // members' document, so the public page shows name, brokerage and location only.
  overridePhoto,
  overrideBio,
  specialties,
  featured
}`;

const PAGE_CONTENT_QUERY = `*[_type == "affiliatedPartnersPage" && pageType == "the_council"][0] {
  _id,
  pageType,
  heroTitle,
  heroDescription,
  heroImage,
  logo,
  introTitle,
  introText,
  introImage,
  ctaTitle,
  ctaDescription,
  ctaButtonText,
  ctaButtonAction,
  ctaButtonLink
}`;

const options = { next: { revalidate: 60 } };

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);

  return {
    title: `The Council | ${siteName}`,
    description: "Members of The Council, Christie's International Real Estate's network of leading agents across North America.",
    alternates: {
      canonical: `${baseUrl}/affiliated-partners/the-council`,
    },
    openGraph: {
      title: `The Council | ${siteName}`,
      description: "Members of The Council, Christie's International Real Estate's network of leading agents across North America.",
      url: `${baseUrl}/affiliated-partners/the-council`,
    },
  };
}

export default async function TheCouncilPage() {
  const [partners, pageContent] = await Promise.all([
    client.fetch<Partner[]>(COUNCIL_QUERY, {}, options),
    client.fetch<PageContent | null>(PAGE_CONTENT_QUERY, {}, options),
  ]);

  // Enrich all partners with agent data from the database
  const enrichedPartners = await Promise.all(
    partners.map(partner => enrichPartnerWithAgentData(partner))
  );

  const featuredPartners = enrichedPartners.filter(p => p.featured);
  const regularPartners = enrichedPartners.filter(p => !p.featured);

  // Get hero image URL if available
  const heroImageUrl = pageContent?.heroImage
    ? urlFor(pageContent.heroImage)?.width(1920).height(800).url()
    : null;

  // Get logo URL if available
  const logoUrl = pageContent?.logo
    ? urlFor(pageContent.logo)?.width(200).height(80).url()
    : null;

  const introImageUrl = pageContent?.introImage
    ? urlFor(pageContent.introImage)?.width(1200).height(800).url()
    : null;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[var(--color-navy)] py-[8.45rem] md:py-[11.83rem] overflow-hidden">
        {heroImageUrl && (
          <>
            <Image
              src={heroImageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[var(--color-navy)]/70" />
          </>
        )}
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          {/* Breadcrumb */}

          {logoUrl && (
            <div className="mb-8">
              <Image
                src={logoUrl}
                alt="The Council"
                width={200}
                height={80}
                className="mx-auto"
              />
            </div>
          )}

          <h1 className="font-serif text-white text-4xl md:text-6xl font-light tracking-wide mb-5">
            {pageContent?.heroTitle || 'The Council'}
          </h1>
          <p className="text-lg md:text-xl text-white/75 font-light max-w-2xl mx-auto leading-relaxed">
            {pageContent?.heroDescription ||
              "A Christie's International Real Estate network of leading agents across North America."}
          </p>
        </div>
      </section>

      {/* About The Council — copy and photo from Studio > Affiliated Partners
          Page (The Council) > Intro. Renders only when text exists. */}
      {pageContent?.introText && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className={introImageUrl ? "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center" : "max-w-3xl mx-auto text-center"}>
              <div>
                {pageContent.introTitle && (
                  <>
                    <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-6 tracking-wide">
                      {pageContent.introTitle}
                    </h2>
                    <div className={`w-16 h-[1px] bg-[var(--color-gold)] mb-8 ${introImageUrl ? "" : "mx-auto"}`} />
                  </>
                )}
                <p className="text-[#4a4a4a] dark:text-gray-300 leading-[1.85] font-light text-[17px] whitespace-pre-line">
                  {pageContent.introText}
                </p>
              </div>
              {introImageUrl && (
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image src={introImageUrl} alt={pageContent.introTitle || "The Council"} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Partners */}
      {featuredPartners.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
              Featured Members
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {featuredPartners.map((partner) => (
                <PartnerCard key={partner._id} partner={partner} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Partners */}
      <section className={`py-16 md:py-24 ${featuredPartners.length > 0 ? 'bg-[#f8f7f5] dark:bg-[#141414]' : 'bg-white dark:bg-[#1a1a1a]'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {regularPartners.length > 0 ? (
            <>
              {featuredPartners.length > 0 && (
                <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white text-center mb-12 md:mb-16 tracking-wide">
                  All Members
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {regularPartners.map((partner) => (
                  <PartnerCard key={partner._id} partner={partner} />
                ))}
              </div>
            </>
          ) : featuredPartners.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-8">
                Members will appear here shortly.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        title={pageContent?.ctaTitle}
        description={pageContent?.ctaDescription}
        buttonText={pageContent?.ctaButtonText}
        buttonAction={pageContent?.ctaButtonAction}
        buttonLink={pageContent?.ctaButtonLink}
      />
    </main>
  );
}

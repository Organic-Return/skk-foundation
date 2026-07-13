import type { Metadata } from "next";
import Image from "next/image";
import { PortableText, type PortableTextComponents } from "next-sanity";
import { client } from "@/sanity/client";
import { getListingsByAgentId, getMlsNumbersWithSIRMedia, getListingHref, type MLSProperty } from "@/lib/listings";
import { getBaseUrl } from '@/lib/settings';
import AgentListingsGrid from "@/components/AgentListingsGrid";
import AgentContactForm from "@/components/AgentContactForm";
import StructuredData from "@/components/StructuredData";

const TEAM_QUERY = `*[_type == "teamMember" && inactive != true && defined(mlsAgentId)]{
  name, email, featured, mlsAgentId, mlsAgentIdSold
}`;

const PAGE_QUERY = `*[_type == "exclusiveListingsPage"][0]{
  contentHeading,
  contentBody,
  seo{ metaTitle, metaDescription }
}`;

type ExclusivePageData = {
  contentHeading?: string;
  contentBody?: unknown[];
  seo?: { metaTitle?: string; metaDescription?: string };
} | null;

const options = { next: { revalidate: 300 } };

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white mt-10 mb-4 tracking-wide">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mt-8 mb-3 tracking-wide">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[var(--color-gold)] pl-6 my-8 italic text-[#5a5a5a] dark:text-gray-400 font-serif text-lg">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 mb-6 space-y-2 text-[#4a4a4a] dark:text-gray-300 font-light text-[17px] leading-[1.7]">{children}</ul>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-medium text-[#1a1a1a] dark:text-white">{children}</strong>,
    em: ({ children }) => <em className="italic font-serif">{children}</em>,
    link: ({ children, value }) => (
      <a href={value?.href} className="text-[var(--color-gold)] underline underline-offset-2 hover:opacity-80">{children}</a>
    ),
  },
};

async function getExclusiveData() {
  const [team, page] = await Promise.all([
    client.fetch<
      Array<{ name?: string; email?: string; featured?: boolean; mlsAgentId?: string; mlsAgentIdSold?: string }>
    >(TEAM_QUERY, {}, options),
    client.fetch<ExclusivePageData>(PAGE_QUERY, {}, options),
  ]);

  const results = await Promise.all(
    (team || []).map((m) => getListingsByAgentId(m.mlsAgentId || null, m.mlsAgentIdSold, m.name))
  );

  // Aggregate active listings across all team agents, de-duplicated.
  const byKey = new Map<string, MLSProperty>();
  for (const r of results) {
    for (const l of r.activeListings) {
      const key = l.mls_number || l.id;
      if (key && !byKey.has(key)) byKey.set(key, l);
    }
  }

  const activeListings = Array.from(byKey.values()).sort(
    (a, b) => (b.list_price || 0) - (a.list_price || 0)
  );

  const firstName = team && team.length === 1 && team[0].name ? team[0].name.split(" ")[0] : null;

  // Primary agent for the "list your home" contact form (featured member, else first).
  const primaryMember = (team || []).find((m) => m.featured && m.name) || (team || []).find((m) => m.name) || null;
  const primaryAgent = primaryMember?.name
    ? { name: primaryMember.name, email: primaryMember.email }
    : null;

  return {
    activeListings,
    firstName,
    primaryAgent,
    contentHeading: page?.contentHeading || null,
    contentBody: page?.contentBody || null,
    seo: page?.seo || null,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { primaryAgent, seo, activeListings } = await getExclusiveData();
  const baseUrl = await getBaseUrl();
  const who = primaryAgent?.name || "Our Team";
  const ogImage = activeListings[0]?.photos?.[0];

  const title = seo?.metaTitle || `${who} | Aspen Homes for Sale — Exclusive Listings`;
  const description =
    seo?.metaDescription ||
    `Explore ${who}'s exclusive listings and luxury homes currently for sale across Aspen, Snowmass, and the Roaring Fork Valley. Browse current properties and connect with a top Aspen real estate agent.`;

  return {
    title,
    description,
    keywords: [
      "Aspen homes for sale",
      "Snowmass homes for sale",
      "Aspen real estate agent",
      primaryAgent?.name || "Aspen luxury real estate",
      "Aspen luxury listings",
      "Snowmass Village real estate",
      "Roaring Fork Valley homes for sale",
    ],
    alternates: { canonical: `${baseUrl}/exclusive-listings` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/exclusive-listings`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ExclusiveListingsPage() {
  const { activeListings, firstName, primaryAgent, contentHeading, contentBody } = await getExclusiveData();
  const who = firstName ? `${firstName}'s` : "Our";
  const agentFirstName = primaryAgent?.name?.split(" ")[0] || firstName || "our team";
  const total = activeListings.length;
  const baseUrl = await getBaseUrl();

  // Video / Matterport badges (no-op when SIR/Realogy isn't configured).
  const mlsNumbers = activeListings.map((l) => l.mls_number).filter(Boolean) as string[];
  const { videos, matterports } = await getMlsNumbersWithSIRMedia(mlsNumbers);

  // Background image from the most expensive listing (activeListings is sorted by price desc).
  const heroImage = activeListings[0]?.photos?.[0] || null;

  // SEO content section — Sanity overrides the built-in default copy.
  const agentName = primaryAgent?.name || null;
  const name = agentName || "Our team";
  const first = agentName ? agentName.split(" ")[0] : "our team";
  const contentTitle = contentHeading || `Aspen Homes for Sale with ${agentName || ""}`.trim();
  const hasManagedContent = Array.isArray(contentBody) && contentBody.length > 0;

  // ItemList structured data for the current listings.
  const listingsSchema =
    total > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${name} — Aspen & Snowmass Properties for Sale`,
          numberOfItems: total,
          itemListElement: activeListings.slice(0, 25).map((l, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: l.address || "Aspen area property for sale",
            url: `${baseUrl}${getListingHref(l)}`,
          })),
        }
      : null;

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {listingsSchema && <StructuredData data={listingsSchema} />}
      {/* Hero */}
      <section className="relative bg-[var(--color-navy)] py-[8.45rem] md:py-[11.83rem] overflow-hidden">
        {heroImage && (
          <>
            <Image
              src={heroImage}
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
          <h1 className="font-serif text-white text-4xl md:text-6xl font-light tracking-wide mb-5">
            {who} Exclusive Listings
          </h1>
          <p className="text-lg md:text-xl text-white/75 font-light max-w-2xl mx-auto leading-relaxed">
            A curated collection of properties currently represented across Aspen, Snowmass, and the Roaring Fork Valley.
          </p>
        </div>
      </section>

      {/* SEO content — properties currently for sale */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a] border-b border-[#e8e6e3] dark:border-gray-800">
        <div className="content-wide max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
            {contentTitle}
          </h2>
          {hasManagedContent ? (
            <PortableText value={contentBody as never} components={portableTextComponents} />
          ) : (
            <>
              <p className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">
                Explore the homes {name} currently represents for sale across Aspen, Snowmass, and the greater
                Roaring Fork Valley. From contemporary mountain estates and ski-in/ski-out residences to historic
                Aspen homes and Roaring Fork Valley ranches, each of these active listings reflects the quality
                and location that define the Aspen luxury real estate market.
              </p>
              <p className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">
                As a trusted Aspen real estate agent, {first} pairs deep local knowledge with a global marketing
                platform to represent each property at its very best &mdash; and to help buyers move quickly and
                confidently when the right home comes to market. Aspen and Snowmass inventory is limited and moves
                fast, so the collection below reflects what is available right now.
              </p>
              <h3 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mt-10 mb-4 tracking-wide">
                Aspen &amp; Snowmass properties currently for sale
              </h3>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-[#4a4a4a] dark:text-gray-300 font-light text-[17px] leading-[1.7]">
                <li>
                  <strong className="font-medium text-[#1a1a1a] dark:text-white">Luxury homes and estates</strong> in
                  Aspen&apos;s West End, Red Mountain, and the surrounding mountains.
                </li>
                <li>
                  <strong className="font-medium text-[#1a1a1a] dark:text-white">Ski-in/ski-out residences</strong> and
                  condominiums in Snowmass Village and Snowmass Base Village.
                </li>
                <li>
                  <strong className="font-medium text-[#1a1a1a] dark:text-white">Ranches and land</strong> throughout
                  the Roaring Fork Valley, from Basalt to Old Snowmass.
                </li>
                <li>
                  <strong className="font-medium text-[#1a1a1a] dark:text-white">New and off-market opportunities</strong>
                  {" "}surfaced through {first}&apos;s local network.
                </li>
              </ul>
              <p className="text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">
                Browse {name}&apos;s current Aspen and Snowmass listings below. To schedule a private showing or
                discuss a property in more detail, reach out and {first} will be glad to help you find the right
                home in the Roaring Fork Valley.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Listings grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          {total > 0 ? (
            <AgentListingsGrid
              activeListings={activeListings}
              soldListings={[]}
              mlsWithVideos={Array.from(videos)}
              mlsWithMatterport={Array.from(matterports)}
              twoColumn
            />
          ) : (
            <p className="text-center text-[#6a6a6a] dark:text-gray-400 font-light">
              Exclusive listings will appear here as new properties come to market.
            </p>
          )}
        </div>
      </section>

      {/* List your home — contact form */}
      <section className="relative bg-[var(--color-navy)] py-16 md:py-24 overflow-hidden">
        {heroImage && (
          <>
            <Image src={heroImage} alt="" fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[var(--color-navy)]/80" />
          </>
        )}
        <div className="relative max-w-2xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-10">
            <p className="text-[var(--color-gold)] text-xs md:text-sm uppercase tracking-[0.25em] mb-5">
              Sell With Confidence
            </p>
            <h2 className="font-serif text-white text-3xl md:text-4xl font-light tracking-wide mb-4">
              List Your Home with {agentFirstName}
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              Thinking about selling? Reach out for a private consultation and a tailored strategy to bring your property to market.
            </p>
          </div>
          <AgentContactForm
            agentName={primaryAgent?.name || "our team"}
            agentEmail={primaryAgent?.email}
            inverted
            interest={`Listing inquiry — sell my home${primaryAgent?.name ? ` (${primaryAgent.name})` : ""}`}
            messagePlaceholder="Tell us about the home you'd like to sell..."
          />
        </div>
      </section>
    </main>
  );
}

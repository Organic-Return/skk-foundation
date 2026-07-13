import type { Metadata } from "next";
import Image from "next/image";
import { PortableText, type PortableTextComponents } from "next-sanity";
import { client } from "@/sanity/client";
import { getListingsByAgentId, type MLSProperty } from "@/lib/listings";
import { getSettings } from "@/lib/settings";
import AgentListingsGrid from "@/components/AgentListingsGrid";
import AgentContactForm from "@/components/AgentContactForm";
import StructuredData from "@/components/StructuredData";

const TEAM_QUERY = `*[_type == "teamMember" && inactive != true && defined(mlsAgentId)]{
  name, email, featured, mlsAgentId, mlsAgentIdSold
}`;

const SOLD_PAGE_QUERY = `*[_type == "soldPage"][0]{
  stats[]{ value, label },
  contentHeading,
  contentBody,
  seo{ metaTitle, metaDescription }
}`;

type SoldPageStat = { value?: string; label?: string };
type SoldPageData = {
  stats?: SoldPageStat[];
  contentHeading?: string;
  contentBody?: unknown[];
  seo?: { metaTitle?: string; metaDescription?: string };
} | null;

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

const options = { next: { revalidate: 300 } };

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

async function getSoldData() {
  const [team, soldPage] = await Promise.all([
    client.fetch<Array<{ name?: string; email?: string; featured?: boolean; mlsAgentId?: string; mlsAgentIdSold?: string }>>(
      TEAM_QUERY,
      {},
      options
    ),
    client.fetch<SoldPageData>(SOLD_PAGE_QUERY, {}, options),
  ]);

  const results = await Promise.all(
    (team || []).map((m) => getListingsByAgentId(m.mlsAgentId || null, m.mlsAgentIdSold, m.name))
  );

  // Aggregate sold listings across all team agents, de-duplicated.
  const byKey = new Map<string, MLSProperty>();
  for (const r of results) {
    for (const l of r.soldListings) {
      const key = l.mls_number || l.id;
      if (key && !byKey.has(key)) byKey.set(key, l);
    }
  }

  const soldListings = Array.from(byKey.values()).sort(
    (a, b) => new Date(b.sold_date || 0).getTime() - new Date(a.sold_date || 0).getTime()
  );

  // Highest-value sold property supplies the hero background image.
  const mostExpensiveSold = [...soldListings].sort(
    (a, b) => (b.sold_price || b.list_price || 0) - (a.sold_price || a.list_price || 0)
  )[0];
  const heroImage = mostExpensiveSold?.photos?.[0] || null;

  const firstName = team && team.length === 1 && team[0].name ? team[0].name.split(" ")[0] : null;
  // Primary agent (featured member, else first) for SEO copy / structured data.
  const primaryMember = (team || []).find((m) => m.featured && m.name) || (team || []).find((m) => m.name) || null;
  const agentName = primaryMember?.name || null;
  const agentEmail = primaryMember?.email || null;

  // Sanity-managed stats override the auto-calculated totals when present.
  const managedStats = (soldPage?.stats || []).filter((s) => s.value || s.label) as SoldPageStat[];

  return {
    soldListings,
    firstName,
    agentName,
    agentEmail,
    heroImage,
    managedStats,
    contentHeading: soldPage?.contentHeading || null,
    contentBody: soldPage?.contentBody || null,
    seo: soldPage?.seo || null,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ agentName, seo, heroImage }, settings] = await Promise.all([getSoldData(), getSettings()]);
  const baseUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const who = agentName || "Our Team";

  const title = seo?.metaTitle || `${who} | Aspen Real Estate Agent — Sold Properties`;
  const description =
    seo?.metaDescription ||
    `${who} is a top Aspen real estate agent with a proven track record selling luxury homes across Aspen, Snowmass, and the Roaring Fork Valley. Browse recently closed sales and see the results.`;
  const ogImage = heroImage || undefined;

  return {
    title,
    description,
    keywords: [
      "Aspen real estate agent",
      "Snowmass real estate agent",
      agentName || "Aspen real estate",
      "Aspen luxury homes",
      "sell my Aspen home",
      "Roaring Fork Valley real estate",
      "Aspen sold properties",
    ],
    alternates: { canonical: `${baseUrl}/sold` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/sold`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SoldPage() {
  const { soldListings, firstName, agentName, agentEmail, heroImage, managedStats, contentHeading, contentBody } =
    await getSoldData();
  const settings = await getSettings();
  const baseUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const who = firstName ? `${firstName}'s` : "Our";
  const totalSold = soldListings.length;
  const totalVolume = soldListings.reduce((sum, l) => sum + (l.sold_price || l.list_price || 0), 0);

  // SEO content section — Sanity overrides the built-in default copy.
  const name = agentName || "Our team";
  const first = agentName ? agentName.split(" ")[0] : "our team";
  const contentTitle = contentHeading || `Aspen Real Estate Agent ${agentName || ""}`.trim();
  const hasManagedContent = Array.isArray(contentBody) && contentBody.length > 0;

  // RealEstateAgent structured data (only when a single agent is identifiable).
  const agentSchema = agentName
    ? {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: agentName,
        description: `${agentName} is a top Aspen real estate agent specializing in luxury home sales across Aspen, Snowmass, and the Roaring Fork Valley.`,
        url: `${baseUrl}/sold`,
        image: heroImage || undefined,
        areaServed: ["Aspen", "Snowmass", "Snowmass Village", "Roaring Fork Valley", "Colorado"],
        knowsAbout: [
          "Aspen real estate",
          "Snowmass real estate",
          "Luxury home sales",
          "Roaring Fork Valley properties",
        ],
      }
    : null;

  // Use Sanity-managed stats if configured, otherwise auto-calculate from sold listings.
  const stats =
    managedStats.length > 0
      ? managedStats.map((s) => ({ value: s.value || "", label: s.label || "" }))
      : [
          { value: String(totalSold), label: "Properties Sold" },
          { value: formatUSD(totalVolume), label: "Total Sales Volume" },
        ];

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {agentSchema && <StructuredData data={agentSchema} />}
      {/* Hero */}
      <section className="relative bg-[var(--color-navy)] pt-[160px] pb-[6.5rem] md:pt-[11rem] md:pb-[9.1rem] overflow-hidden">
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
          <div className="text-[var(--color-gold)] text-xs md:text-sm uppercase tracking-[0.25em] mb-5">
            Track Record
          </div>
          <h1 className="font-serif text-white text-4xl md:text-6xl font-light tracking-wide mb-5">
            {who} Sold Properties
          </h1>
          <p className="text-lg md:text-xl text-white/75 font-light max-w-2xl mx-auto leading-relaxed">
            A record of recently closed transactions across Aspen, Snowmass, and the Roaring Fork Valley.
          </p>

          {/* Stats — third line in the hero */}
          {stats.length > 0 && (totalSold > 0 || managedStats.length > 0) && (
            <div className={`mt-12 md:mt-16 grid ${stats.length >= 4 ? "grid-cols-2 md:grid-cols-4" : stats.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-8 max-w-3xl mx-auto`}>
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="font-serif text-white text-5xl md:text-7xl font-light mb-2 tracking-tight leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm uppercase tracking-[0.15em] font-light text-white/70">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SEO content — what makes the agent great at selling Aspen & Snowmass real estate */}
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
                {name} is a trusted Aspen real estate agent with a proven record of closing significant sales
                across Aspen, Snowmass, and the greater Roaring Fork Valley. Combining deep local roots with an
                intimate understanding of the Aspen and Snowmass luxury market, {first} guides sellers through
                every stage of the transaction &mdash; from strategic pricing and standout marketing to precise,
                results-driven negotiation.
              </p>
              <p className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">
                Aspen and Snowmass real estate is one of the most nuanced luxury markets in the country, where
                pricing, timing, and presentation make the difference between a good sale and an exceptional one.
                {" "}{first} pairs current, block-by-block market intelligence with a global marketing platform to
                position each home in front of the qualified buyers most likely to act.
              </p>
              <h3 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mt-10 mb-4 tracking-wide">
                Why sellers choose {first} in Aspen &amp; Snowmass
              </h3>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-[#4a4a4a] dark:text-gray-300 font-light text-[17px] leading-[1.7]">
                <li>
                  <strong className="font-medium text-[#1a1a1a] dark:text-white">Local market mastery</strong> across
                  Aspen&apos;s West End and Red Mountain, Snowmass Village ski-in/ski-out residences, and Roaring Fork
                  Valley ranches and estates.
                </li>
                <li>
                  <strong className="font-medium text-[#1a1a1a] dark:text-white">Luxury marketing</strong> with
                  professional photography, video, and targeted digital exposure that reaches high-net-worth buyers
                  worldwide.
                </li>
                <li>
                  <strong className="font-medium text-[#1a1a1a] dark:text-white">Skilled negotiation</strong> focused
                  on protecting your equity and achieving the strongest possible terms.
                </li>
                <li>
                  <strong className="font-medium text-[#1a1a1a] dark:text-white">Proven results</strong> demonstrated
                  by a substantial record of closed Aspen and Snowmass sales.
                </li>
                <li>
                  <strong className="font-medium text-[#1a1a1a] dark:text-white">Discreet, white-glove service</strong>
                  {" "}from first consultation to closing table.
                </li>
              </ul>
              <p className="text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">
                Whether you are selling a slope-side residence in Snowmass Village, a historic home in Aspen, or a
                legacy property in the Roaring Fork Valley, {first} delivers the strategy, exposure, and expertise
                needed to sell for top dollar. Explore recently sold properties below, then reach out to start the
                conversation about your home.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Sold listings grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          {totalSold > 0 ? (
            <AgentListingsGrid activeListings={[]} soldListings={soldListings} />
          ) : (
            <p className="text-center text-[#6a6a6a] dark:text-gray-400 font-light">
              Sold properties will appear here as transactions close.
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
              List Your Home with {first}
            </h2>
            <p className="text-white/75 font-light leading-relaxed">
              Thinking about selling? Reach out for a private consultation and a tailored strategy to bring your property to market.
            </p>
          </div>
          <AgentContactForm
            agentName={agentName || "our team"}
            agentEmail={agentEmail || undefined}
            inverted
            interest={`Listing inquiry — sell my home${agentName ? ` (${agentName})` : ""}`}
            messagePlaceholder="Tell us about the home you'd like to sell..."
          />
        </div>
      </section>
    </main>
  );
}

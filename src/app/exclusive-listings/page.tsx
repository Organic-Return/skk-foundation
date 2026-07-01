import type { Metadata } from "next";
import Image from "next/image";
import { client } from "@/sanity/client";
import { getListingsByAgentId, getMlsNumbersWithSIRMedia, type MLSProperty } from "@/lib/listings";
import { getSettings } from "@/lib/settings";
import AgentListingsGrid from "@/components/AgentListingsGrid";

const TEAM_QUERY = `*[_type == "teamMember" && inactive != true && defined(mlsAgentId)]{
  name, mlsAgentId, mlsAgentIdSold
}`;

const options = { next: { revalidate: 300 } };

async function getExclusiveData() {
  const team = await client.fetch<Array<{ name?: string; mlsAgentId?: string; mlsAgentIdSold?: string }>>(
    TEAM_QUERY,
    {},
    options
  );

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

  return { activeListings, firstName };
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ firstName }, settings] = await Promise.all([getExclusiveData(), getSettings()]);
  const baseUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const who = firstName ? `${firstName}'s` : "Our";
  const title = `${who} Exclusive Listings`;
  const description = `Explore ${who.toLowerCase()} exclusive listings across Aspen, Snowmass, and the Roaring Fork Valley.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/exclusive-listings` },
    openGraph: { title, description, type: "website", url: `${baseUrl}/exclusive-listings` },
  };
}

export default async function ExclusiveListingsPage() {
  const { activeListings, firstName } = await getExclusiveData();
  const who = firstName ? `${firstName}'s` : "Our";
  const total = activeListings.length;

  // Video / Matterport badges (no-op when SIR/Realogy isn't configured).
  const mlsNumbers = activeListings.map((l) => l.mls_number).filter(Boolean) as string[];
  const { videos, matterports } = await getMlsNumbersWithSIRMedia(mlsNumbers);

  // Background image from the most expensive listing (activeListings is sorted by price desc).
  const heroImage = activeListings[0]?.photos?.[0] || null;

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative bg-[var(--color-navy)] py-[6.5rem] md:py-[9.1rem] overflow-hidden">
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
          <p className="text-[var(--color-gold)] text-xs md:text-sm uppercase tracking-[0.25em] mb-5">
            For Sale
          </p>
          <h1 className="font-serif text-white text-4xl md:text-6xl font-light tracking-wide mb-5">
            {who} Exclusive Listings
          </h1>
          <p className="text-lg md:text-xl text-white/75 font-light max-w-2xl mx-auto leading-relaxed">
            A curated collection of properties currently represented across Aspen, Snowmass, and the Roaring Fork Valley.
          </p>
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
    </main>
  );
}

import type { Metadata } from "next";
import { client } from "@/sanity/client";
import { getListingsByAgentId, getMlsNumbersWithSIRMedia, type MLSProperty } from "@/lib/listings";
import { getSettings } from "@/lib/settings";
import AgentListingsGrid from "@/components/AgentListingsGrid";

const TEAM_QUERY = `*[_type == "teamMember" && inactive != true && defined(mlsAgentId)]{
  name, mlsAgentId, mlsAgentIdSold
}`;

const options = { next: { revalidate: 300 } };

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

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
  const totalValue = activeListings.reduce((sum, l) => sum + (l.list_price || 0), 0);

  // Video / Matterport badges (no-op when SIR/Realogy isn't configured).
  const mlsNumbers = activeListings.map((l) => l.mls_number).filter(Boolean) as string[];
  const { videos, matterports } = await getMlsNumbersWithSIRMedia(mlsNumbers);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative bg-[var(--color-navy)] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
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

      {/* Stats */}
      {total > 0 && (
        <section className="py-12 md:py-16 bg-[#f8f7f5] dark:bg-[#141414] border-b border-[#e8e6e3] dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                  {total}
                </p>
                <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                  Active Listings
                </p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                  {formatUSD(totalValue)}
                </p>
                <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                  Total List Value
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

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

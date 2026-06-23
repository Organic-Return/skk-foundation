import type { Metadata } from "next";
import { client } from "@/sanity/client";
import { getListingsByAgentId, type MLSProperty } from "@/lib/listings";
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

async function getSoldData() {
  const team = await client.fetch<Array<{ name?: string; mlsAgentId?: string; mlsAgentIdSold?: string }>>(
    TEAM_QUERY,
    {},
    options
  );

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

  const firstName = team && team.length === 1 && team[0].name ? team[0].name.split(" ")[0] : null;

  return { soldListings, firstName };
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ firstName }, settings] = await Promise.all([getSoldData(), getSettings()]);
  const baseUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const who = firstName ? `${firstName}'s` : "Our";
  const title = `${who} Sold Properties`;
  const description = `Browse ${who.toLowerCase()} recently sold properties across Aspen, Snowmass, and the Roaring Fork Valley.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/sold` },
    openGraph: { title, description, type: "website", url: `${baseUrl}/sold` },
  };
}

export default async function SoldPage() {
  const { soldListings, firstName } = await getSoldData();
  const who = firstName ? `${firstName}'s` : "Our";
  const totalSold = soldListings.length;
  const totalVolume = soldListings.reduce((sum, l) => sum + (l.sold_price || l.list_price || 0), 0);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative bg-[var(--color-navy)] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <p className="text-[var(--color-gold)] text-xs md:text-sm uppercase tracking-[0.25em] mb-5">
            Track Record
          </p>
          <h1 className="font-serif text-white text-4xl md:text-6xl font-light tracking-wide mb-5">
            {who} Sold Properties
          </h1>
          <p className="text-lg md:text-xl text-white/75 font-light max-w-2xl mx-auto leading-relaxed">
            A record of recently closed transactions across Aspen, Snowmass, and the Roaring Fork Valley.
          </p>
        </div>
      </section>

      {/* Stats */}
      {totalSold > 0 && (
        <section className="py-12 md:py-16 bg-[#f8f7f5] dark:bg-[#141414] border-b border-[#e8e6e3] dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                  {totalSold}
                </p>
                <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                  Properties Sold
                </p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                  {formatUSD(totalVolume)}
                </p>
                <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                  Total Sales Volume
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

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
    </main>
  );
}

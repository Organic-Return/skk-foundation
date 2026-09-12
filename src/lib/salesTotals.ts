import { client } from "@/sanity/client";
import { getListingsByAgentId, type MLSProperty } from "@/lib/listings";

/**
 * Career sales totals, shared by /sold and /buy so the two pages can never
 * disagree.
 *
 * With a baseline configured in Sanity (Sold Page > Sales Totals Baseline), the
 * figures are the verified totals as of a date plus every MLS sale closed after
 * that date — so they move on their own as new closings land, and sales already
 * inside the baseline are never counted twice. Without a baseline, they fall
 * back to what the MLS feed alone can see.
 */
export type SalesBaseline = { soldCount?: number; salesVolume?: number; asOf?: string } | null | undefined;

export type SalesTotals = {
  totalSold: number;
  totalVolume: number;
  hasBaseline: boolean;
  closedAfterBaseline: MLSProperty[];
};

export const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const priceOf = (l: MLSProperty) => l.sold_price || l.list_price || 0;

export function computeSalesTotals(soldListings: MLSProperty[], baseline: SalesBaseline): SalesTotals {
  const hasBaseline =
    typeof baseline?.soldCount === "number" && typeof baseline?.salesVolume === "number" && !!baseline?.asOf;
  // The as-of date is inclusive: a sale dated that day is assumed to be inside
  // the baseline, so only strictly-later closings are added on top.
  const closedAfterBaseline = hasBaseline
    ? soldListings.filter((l) => l.sold_date && new Date(l.sold_date) > new Date(`${baseline!.asOf}T23:59:59Z`))
    : [];
  const totalSold = hasBaseline ? baseline!.soldCount! + closedAfterBaseline.length : soldListings.length;
  const totalVolume = hasBaseline
    ? baseline!.salesVolume! + closedAfterBaseline.reduce((sum, l) => sum + priceOf(l), 0)
    : soldListings.reduce((sum, l) => sum + priceOf(l), 0);
  return { totalSold, totalVolume, hasBaseline, closedAfterBaseline };
}

const TEAM_QUERY = `*[_type == "teamMember" && inactive != true && defined(mlsAgentId)]{
  name, mlsAgentId, mlsAgentIdSold
}`;
const BASELINE_QUERY = `*[_type == "soldPage"][0].baseline{ soldCount, salesVolume, asOf }`;
const options = { next: { revalidate: 300 } };

/** Fetches everything needed and returns the current totals. */
export async function getSalesTotals(): Promise<SalesTotals> {
  const [team, baseline] = await Promise.all([
    client.fetch<Array<{ name?: string; mlsAgentId?: string; mlsAgentIdSold?: string }>>(TEAM_QUERY, {}, options),
    client.fetch<SalesBaseline>(BASELINE_QUERY, {}, options),
  ]);
  const results = await Promise.all(
    (team || []).map((m) => getListingsByAgentId(m.mlsAgentId || null, m.mlsAgentIdSold, m.name))
  );
  // De-duplicate across team agents, same as /sold does for its grid.
  const byKey = new Map<string, MLSProperty>();
  for (const r of results) {
    for (const l of r.soldListings) {
      const key = l.mls_number || l.id;
      if (key && !byKey.has(key)) byKey.set(key, l);
    }
  }
  return computeSalesTotals(Array.from(byKey.values()), baseline);
}

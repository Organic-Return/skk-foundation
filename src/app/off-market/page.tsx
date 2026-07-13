import { Metadata } from 'next';
import { getOffMarketListings } from '@/lib/offMarketListings';
import OffMarketListingsContent from '@/components/OffMarketListingsContent';
import { getBaseUrl } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();

  return {
    title: 'Off-Market Listings | Exclusive Properties',
    description: 'Access exclusive off-market properties not available to the general public. Register to view our private collection of premium real estate listings.',
    alternates: {
      canonical: `${baseUrl}/off-market`,
    },
    openGraph: {
      title: 'Off-Market Listings | Exclusive Properties',
      description: 'Access exclusive off-market properties not available to the general public. Register to view our private collection of premium real estate listings.',
      url: `${baseUrl}/off-market`,
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function OffMarketPage() {
  const listings = await getOffMarketListings();

  return <OffMarketListingsContent listings={listings} />;
}

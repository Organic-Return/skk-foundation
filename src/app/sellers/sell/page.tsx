import { client } from "@/sanity/client";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";
import RCSitePage from "@/components/RCSitePage";
import Link from "next/link";

const QUERY = `*[_type == "sitePage" && slug.current == "sell"][0]{
  title,
  heroImageUrl,
  contentHtml,
  showContactForm,
  seo
}`;

const options = { next: { revalidate: 60 } };

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch(QUERY, {}, options);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: data?.seo?.metaTitle || data?.title || 'Sell Your Home',
    description: data?.seo?.metaDescription || 'Sell your home with Retter & Company Sotheby\'s International Realty',
    alternates: { canonical: `${baseUrl}/sellers/sell` },
    openGraph: {
      title: data?.seo?.metaTitle || data?.title || 'Sell Your Home',
      description: data?.seo?.metaDescription || '',
      type: 'website',
      url: `${baseUrl}/sellers/sell`,
    },
  };
}

export default async function SellersSellPage() {
  const [data, template] = await Promise.all([
    client.fetch(QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === 'rcsothebys-custom';

  if (!isRC) {
    return (
      <main className="min-h-screen pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-serif text-[#1a1a1a] dark:text-white mb-4">Sell Your Home</h1>
          <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-8">
            Visit our <Link href="/sell" className="text-[var(--color-gold)] hover:underline">sell page</Link> for more information.
          </p>
        </div>
      </main>
    );
  }

  return (
    <RCSitePage
      title={data?.title || 'About Selling With Us'}
      heroImageUrl={data?.heroImageUrl}
      contentHtml={data?.contentHtml}
      showContactForm={data?.showContactForm !== false}
    />
  );
}

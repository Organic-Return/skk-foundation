import { client } from "@/sanity/client";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";
import RCSitePage from "@/components/RCSitePage";
import Link from "next/link";

const QUERY = `*[_type == "sitePage" && slug.current == "washington-wine"][0]{
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
    title: data?.seo?.metaTitle || data?.title || 'Washington Wine',
    description: data?.seo?.metaDescription || 'Discover Washington wines in the heart of wine country',
    alternates: { canonical: `${baseUrl}/local-guide/washington-wine` },
    openGraph: {
      title: data?.seo?.metaTitle || data?.title || 'Washington Wine',
      description: data?.seo?.metaDescription || '',
      type: 'website',
      url: `${baseUrl}/local-guide/washington-wine`,
    },
  };
}

export default async function WashingtonWinePage() {
  const [data, template] = await Promise.all([
    client.fetch(QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === 'rcsothebys-custom';

  if (!isRC) {
    return (
      <main className="min-h-screen pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-8">
            <Link href="/" className="text-[var(--color-gold)] hover:underline">Return Home</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <RCSitePage
      title={data?.title || 'Washington Wines'}
      heroImageUrl={data?.heroImageUrl}
      contentHtml={data?.contentHtml}
      showContactForm={data?.showContactForm !== false}
    />
  );
}

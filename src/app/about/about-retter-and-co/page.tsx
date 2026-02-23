import { client } from "@/sanity/client";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";
import RCSitePage from "@/components/RCSitePage";
import Link from "next/link";

const QUERY = `*[_type == "sitePage" && slug.current == "about-retter-and-co"][0]{
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
    title: data?.seo?.metaTitle || data?.title || 'About Retter & Company',
    description: data?.seo?.metaDescription || 'Learn about Retter & Company Sotheby\'s International Realty',
    alternates: { canonical: `${baseUrl}/about/about-retter-and-co` },
    openGraph: {
      title: data?.seo?.metaTitle || data?.title || 'About Retter & Company',
      description: data?.seo?.metaDescription || '',
      type: 'website',
      url: `${baseUrl}/about/about-retter-and-co`,
    },
  };
}

export default async function AboutRetterPage() {
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
            Visit our <Link href="/about" className="text-[var(--color-gold)] hover:underline">about page</Link>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <RCSitePage
      title={data?.title || 'About Retter And Company Sotheby\'s International Realty'}
      heroImageUrl={data?.heroImageUrl}
      contentHtml={data?.contentHtml}
      showContactForm={data?.showContactForm !== false}
    />
  );
}

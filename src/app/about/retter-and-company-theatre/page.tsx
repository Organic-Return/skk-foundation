import { client } from "@/sanity/client";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";
import RCSitePage from "@/components/RCSitePage";
import Link from "next/link";

const QUERY = `*[_type == "sitePage" && slug.current == "retter-and-company-theatre"][0]{
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
    title: data?.seo?.metaTitle || data?.title || 'Retter & Company Theatre',
    description: data?.seo?.metaDescription || 'Retter & Company Theatre at the Toyota Center',
    alternates: { canonical: `${baseUrl}/about/retter-and-company-theatre` },
    openGraph: {
      title: data?.seo?.metaTitle || data?.title || 'Retter & Company Theatre',
      description: data?.seo?.metaDescription || '',
      type: 'website',
      url: `${baseUrl}/about/retter-and-company-theatre`,
    },
  };
}

export default async function TheatrePage() {
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
      title={data?.title || 'Retter & Company Theatre'}
      heroImageUrl={data?.heroImageUrl}
      contentHtml={data?.contentHtml}
      showContactForm={data?.showContactForm !== false}
    />
  );
}

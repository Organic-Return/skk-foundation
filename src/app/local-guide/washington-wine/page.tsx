import { client } from "@/sanity/client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteTemplate, getBaseUrl } from '@/lib/settings';
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
  const baseUrl = await getBaseUrl();

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

  if (!isRC) notFound();

  return (
    <RCSitePage
      title={data?.title || 'Washington Wines'}
      heroImageUrl={data?.heroImageUrl}
      contentHtml={data?.contentHtml}
      showContactForm={data?.showContactForm !== false}
    />
  );
}

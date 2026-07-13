import { client } from "@/sanity/client";
import { notFound } from 'next/navigation';
import type { Metadata } from "next";
import { getSiteTemplate, getBaseUrl } from '@/lib/settings';
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
  const baseUrl = await getBaseUrl();

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

  if (!isRC) notFound();

  return (
    <RCSitePage
      title={data?.title || 'About Retter And Company Sotheby\'s International Realty'}
      heroImageUrl={data?.heroImageUrl}
      contentHtml={data?.contentHtml}
      showContactForm={data?.showContactForm !== false}
    />
  );
}

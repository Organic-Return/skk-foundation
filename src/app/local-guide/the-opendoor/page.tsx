import { client } from "@/sanity/client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteTemplate, getBaseUrl } from '@/lib/settings';
import RCSitePage from "@/components/RCSitePage";
import Link from "next/link";

const QUERY = `*[_type == "sitePage" && slug.current == "the-opendoor"][0]{
  title,
  embedUrl,
  showContactForm,
  seo
}`;

const options = { next: { revalidate: 60 } };

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch(QUERY, {}, options);
  const baseUrl = await getBaseUrl();

  return {
    title: data?.seo?.metaTitle || data?.title || 'The Open Door',
    description: data?.seo?.metaDescription || 'Retter & Company Magazine',
    alternates: { canonical: `${baseUrl}/local-guide/the-opendoor` },
    openGraph: {
      title: data?.seo?.metaTitle || data?.title || 'The Open Door',
      description: data?.seo?.metaDescription || '',
      type: 'website',
      url: `${baseUrl}/local-guide/the-opendoor`,
    },
  };
}

export default async function TheOpendoorPage() {
  const [data, template] = await Promise.all([
    client.fetch(QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === 'rcsothebys-custom';

  if (!isRC) notFound();

  return (
    <RCSitePage
      title={data?.title || 'The Open Door'}
      embedUrl={data?.embedUrl || 'https://publications.greydoorpublishing.com/Retter-and-Co-Magazine-Retter-and-Company-SIR-ED1-2021/index.html'}
      showContactForm={data?.showContactForm === true}
    />
  );
}

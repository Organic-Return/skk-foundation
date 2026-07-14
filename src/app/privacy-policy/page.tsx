import { client } from "@/sanity/client";
import type { Metadata } from "next";
import { getSiteTemplate, getBaseUrl } from '@/lib/settings';
import RCSitePage from "@/components/RCSitePage";
import PageHero from "@/components/PageHero";
import Link from "next/link";

const QUERY = `*[_type == "sitePage" && slug.current == "privacy-policy"][0]{
  title,
  contentHtml,
  showContactForm,
  seo
}`;

const options = { next: { revalidate: 60 } };

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch(QUERY, {}, options);
  const baseUrl = await getBaseUrl();

  return {
    title: data?.seo?.metaTitle || data?.title || 'Privacy Policy',
    description: data?.seo?.metaDescription || 'Privacy policy',
    alternates: { canonical: `${baseUrl}/privacy-policy` },
    openGraph: {
      title: data?.seo?.metaTitle || data?.title || 'Privacy Policy',
      description: data?.seo?.metaDescription || '',
      type: 'website',
      url: `${baseUrl}/privacy-policy`,
    },
  };
}

export default async function PrivacyPolicyPage() {
  const [data, template] = await Promise.all([
    client.fetch(QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === 'rcsothebys-custom';

  // Non-RC templates previously rendered a bare "Return Home" link here: no
  // heading, no policy text, on a page the footer and the contact form's
  // consent checkbox both link to. Render the real page instead.
  if (!isRC) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
        <PageHero title={data?.title || 'Privacy Policy'} />
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-16">
            {data?.contentHtml ? (
              <div
                className="prose prose-lg max-w-none dark:prose-invert font-light"
                dangerouslySetInnerHTML={{ __html: data.contentHtml }}
              />
            ) : (
              <p className="text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">
                Our privacy policy is being updated. For any questions about how
                we handle your information, please{' '}
                <Link href="/contact-us" className="text-[var(--color-gold)] underline underline-offset-2">
                  get in touch
                </Link>
                .
              </p>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <RCSitePage
      title={data?.title || 'Privacy Policy'}
      contentHtml={data?.contentHtml}
      showContactForm={false}
    />
  );
}

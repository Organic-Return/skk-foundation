import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import AgentContactForm from '@/components/AgentContactForm';
import StructuredData from '@/components/StructuredData';
import { client } from '@/sanity/client';
import { getBaseUrl, getSettings, getSiteName } from '@/lib/settings';
import { breadcrumbSchema } from '@/lib/seo';

export const revalidate = 300;

// /contact-us did not exist. It fell through to the root catch-all, which
// rendered "Post Not Found" with HTTP 200 — a soft 404 on the page the footer,
// the nav, and every community-page CTA link to.
const PRIMARY_AGENT_QUERY = `*[_type == "teamMember" && inactive != true && defined(name)] | order(featured desc)[0]{
  name,
  email
}`;

type PrimaryAgent = { name?: string; email?: string } | null;

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  const title = `Contact | ${siteName}`;
  const description =
    'Get in touch about buying or selling in Aspen, Snowmass Village, and the Roaring Fork Valley. Call, email, or send a message and we will be in touch shortly.';

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/contact-us` },
    openGraph: { title, description, type: 'website', url: `${baseUrl}/contact-us` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ContactUsPage() {
  const [agent, settings, baseUrl, siteName] = await Promise.all([
    client.fetch<PrimaryAgent>(PRIMARY_AGENT_QUERY, {}, { next: { revalidate: 300 } }),
    getSettings(),
    getBaseUrl(),
    getSiteName(),
  ]);

  const { email, phone, address } = settings?.contactInfo || {};
  const crumbs = breadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Contact', url: `${baseUrl}/contact-us` },
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <StructuredData data={crumbs} />

      <PageHero
        title="Get in Touch"
        subtitle="Whether you're buying, selling, or simply exploring the market, we'd be glad to help."
      />

      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">
            {/* Contact details */}
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
                Contact {siteName}
              </h2>

              <dl className="space-y-8">
                {phone && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a] dark:text-gray-500 mb-2">
                      Phone
                    </dt>
                    <dd>
                      <a
                        href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                        className="text-[#1a1a1a] dark:text-white font-light text-lg hover:text-[var(--color-gold)] transition-colors"
                      >
                        {phone}
                      </a>
                    </dd>
                  </div>
                )}

                {email && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a] dark:text-gray-500 mb-2">
                      Email
                    </dt>
                    <dd>
                      <a
                        href={`mailto:${email}`}
                        className="text-[#1a1a1a] dark:text-white font-light text-lg hover:text-[var(--color-gold)] transition-colors"
                      >
                        {email}
                      </a>
                    </dd>
                  </div>
                )}

                {address && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a] dark:text-gray-500 mb-2">
                      Office
                    </dt>
                    <dd className="text-[#4a4a4a] dark:text-gray-300 font-light leading-[1.8] whitespace-pre-line">
                      {address}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Form */}
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
                Send a Message
              </h2>
              <AgentContactForm
                agentName={agent?.name || siteName}
                agentEmail={agent?.email || email}
                interest="General inquiry"
                messagePlaceholder="How can we help?"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

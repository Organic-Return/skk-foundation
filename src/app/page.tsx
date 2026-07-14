import { Metadata } from 'next';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { getHomepageData, getAllCommunities } from '@/lib/homepage';
import { getSettings, getBranding, getBaseUrl } from '@/lib/settings';
import { getNewestHighPricedByCities, getNewestHighPricedByCity } from '@/lib/listings';
import StructuredData from '@/components/StructuredData';
import { postalAddressSchema } from '@/lib/seo';
import HomepageContent from '@/components/HomepageContent';

const builder = createImageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

export async function generateMetadata(): Promise<Metadata> {
  const [homepage, settings] = await Promise.all([
    getHomepageData(),
    getSettings(),
  ]);

  const seo = homepage?.seo;
  const siteTitle = settings?.title || 'Real Estate';
  const baseUrl = await getBaseUrl();

  return {
    title: seo?.metaTitle || siteTitle,
    description: seo?.metaDescription || settings?.description,
    keywords: seo?.keywords,
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title: seo?.metaTitle || siteTitle,
      description: seo?.metaDescription || settings?.description,
      url: baseUrl,
      images: seo?.metaImage?.asset?.url
        ? [{ url: urlFor(seo.metaImage).width(1200).url() }]
        : undefined,
    },
  };
}

const PRIMARY_AGENT_QUERY = `*[_type == "teamMember" && inactive != true && defined(name)] | order(featured desc)[0]{
  name, "slug": slug.current, title, email, phone, image
}`;

export default async function Home() {
  const [homepage, settings, branding, agent] = await Promise.all([
    getHomepageData(),
    getSettings(),
    getBranding(),
    client.fetch<{ name?: string; slug?: string; title?: string; email?: string; phone?: string; image?: unknown } | null>(
      PRIMARY_AGENT_QUERY,
      {},
      { next: { revalidate: 300 } }
    ),
  ]);

  const primaryAgent = agent?.name
    ? {
        ...agent,
        imageUrl: agent.image ? urlFor(agent.image).width(800).url() : undefined,
      }
    : null;

  const hero = homepage?.hero;
  const teamSection = homepage?.teamSection;
  const accolades = homepage?.accolades;
  const featuredProperty = homepage?.featuredProperty;
  const featuredCommunitiesConfig = homepage?.featuredCommunities;

  // Resolve hero video source. Mux is preferred — it offloads streaming
  // from Sanity (where bandwidth is metered) to Mux's CDN. Legacy
  // videoFile/videoUrl fields are still honored when Mux isn't set so
  // editors don't see a broken hero between deploy and the migration
  // upload step.
  const heroMuxPlaybackId = hero?.muxVideo?.asset?.playbackId;
  const videoUrl = hero?.videoFile?.asset?.url || hero?.videoUrl;
  const fallbackImageUrl = hero?.fallbackImage?.asset?.url
    ? urlFor(hero.fallbackImage).width(1920).url()
    : undefined;

  // Resolve communities: use showAll query or referenced communities
  const rawCommunities = featuredCommunitiesConfig?.showAll
    ? await getAllCommunities(featuredCommunitiesConfig?.limit || 12)
    : featuredCommunitiesConfig?.communities || [];

  const processedCommunities = rawCommunities.map((c: any) => ({
    _id: c._id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    imageUrl: c.featuredImage?.asset?.url
      ? urlFor(c.featuredImage).width(800).height(1067).url()
      : undefined,
  }));

  // Pre-fetch hero properties server-side for rcsothebys template (no loading flash)
  let heroProperties: any[] | undefined;
  if (settings?.template === 'rcsothebys-custom') {
    const heroCities = homepage?.featuredPropertiesCarousel?.cities;
    const heroLimit = 10;
    const heroOpts = { officeName: 'Retter', minPrice: 950000, sortBy: 'price' as const };
    try {
      heroProperties = heroCities && heroCities.length > 1
        ? await getNewestHighPricedByCities(heroCities, heroLimit, heroOpts)
        : await getNewestHighPricedByCity(heroCities?.[0] || 'Kennewick', heroLimit, heroOpts);
    } catch (e) {
      console.error('Error pre-fetching hero properties:', e);
    }
  }

  const baseUrl = await getBaseUrl();

  // RealEstateAgent / Organization structured data
  // Identity is emitted as three separate entities linked by @id, each with a
  // STRING @type.
  //
  // This used to be one node typed `["RealEstateAgent", "Organization"]`. That
  // is valid schema.org, but an array @type is invisible to parsers that only
  // match a string — auditors reported "no Organization or Person schema" and
  // "no LocalBusiness schema" on a page that had both. AI extractors are no
  // more sophisticated. Splitting costs nothing and reads correctly either way.
  const socialProfiles = [
    settings?.socialMedia?.facebook,
    settings?.socialMedia?.instagram,
    settings?.socialMedia?.twitter,
    settings?.socialMedia?.linkedin,
    settings?.socialMedia?.youtube,
  ].filter(Boolean);

  const postalAddress = postalAddressSchema(settings?.contactInfo?.address);
  const logoUrl = branding?.logo ? urlFor(branding.logo).width(600).url() : undefined;

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: settings?.title || 'Real Estate',
    description: settings?.description,
    url: baseUrl,
    ...(logoUrl ? { logo: logoUrl } : {}),
    ...(settings?.contactInfo?.phone ? { telephone: settings.contactInfo.phone } : {}),
    ...(settings?.contactInfo?.email ? { email: settings.contactInfo.email } : {}),
    ...(postalAddress ? { address: postalAddress } : {}),
    ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
  };

  // RealEstateAgent is a subtype of LocalBusiness — this is the local-business
  // entity, kept distinct from the brand above and linked back to it.
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${baseUrl}#localbusiness`,
    name: settings?.title || 'Real Estate',
    url: baseUrl,
    ...(logoUrl ? { image: logoUrl } : {}),
    ...(settings?.contactInfo?.phone ? { telephone: settings.contactInfo.phone } : {}),
    ...(settings?.contactInfo?.email ? { email: settings.contactInfo.email } : {}),
    ...(postalAddress ? { address: postalAddress } : {}),
    areaServed: ['Aspen', 'Snowmass Village', 'Basalt', 'Carbondale', 'Roaring Fork Valley'],
    parentOrganization: { '@id': `${baseUrl}#organization` },
  };

  // Person schema for the agent — what answers "who is Stacey K Kelly?" for
  // search engines and LLMs. Absent entirely before.
  const personSchema = primaryAgent?.name
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': `${baseUrl}#agent`,
        name: primaryAgent.name,
        url: `${baseUrl}/team/${primaryAgent.slug}`,
        ...(primaryAgent.title ? { jobTitle: primaryAgent.title } : {}),
        ...(primaryAgent.imageUrl ? { image: primaryAgent.imageUrl } : {}),
        ...(primaryAgent.email ? { email: primaryAgent.email } : {}),
        ...(primaryAgent.phone ? { telephone: primaryAgent.phone } : {}),
        ...(postalAddress ? { address: postalAddress } : {}),
        worksFor: { '@id': `${baseUrl}#organization` },
        knowsAbout: [
          'Aspen real estate',
          'Snowmass Village real estate',
          'Luxury home sales',
          'Roaring Fork Valley properties',
        ],
        ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
      }
    : null;

  // WebSite schema with SearchAction for sitelinks search box
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    name: settings?.title || 'Real Estate',
    url: baseUrl,
    description: settings?.description,
    publisher: {
      '@id': `${baseUrl}#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/listings?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // WebPage schema for homepage
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${baseUrl}#webpage`,
    url: baseUrl,
    name: settings?.title || 'Real Estate',
    description: settings?.description,
    isPartOf: {
      '@id': `${baseUrl}#website`,
    },
    about: {
      '@id': `${baseUrl}#organization`,
    },
    primaryImageOfPage: fallbackImageUrl ? {
      '@type': 'ImageObject',
      url: fallbackImageUrl,
    } : undefined,
  };

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={localBusinessSchema} />
      {personSchema && <StructuredData data={personSchema} />}
      <StructuredData data={websiteSchema} />
      <StructuredData data={webPageSchema} />

      <HomepageContent
        template={settings?.template}
        videoUrl={videoUrl}
        heroMuxPlaybackId={heroMuxPlaybackId}
        fallbackImageUrl={fallbackImageUrl}
        heroTitle={hero?.title}
        heroSubtitle={hero?.subtitle}
        showSearch={hero?.showSearch !== false}
        showTitleSubtitle={hero?.showTitleSubtitle !== false}
        teamSection={{
          enabled: teamSection?.enabled,
          title: teamSection?.title,
          imagePosition: teamSection?.imagePosition,
          featuredTeamMember: teamSection?.featuredTeamMember,
          primaryButtonText: teamSection?.primaryButtonText,
          primaryButtonLink: teamSection?.primaryButtonLink,
          secondaryButtonText: teamSection?.secondaryButtonText,
          secondaryButtonLink: teamSection?.secondaryButtonLink,
        }}
        accolades={{
          enabled: accolades?.enabled,
          title: accolades?.title,
          backgroundImage: accolades?.backgroundImage,
          items: accolades?.items,
        }}
        agentMlsId={teamSection?.featuredTeamMember?.mlsAgentId}
        officeName={settings?.template === 'rcsothebys-custom' ? 'Retter' : undefined}
        heroMinPrice={settings?.template === 'rcsothebys-custom' ? 950000 : undefined}
        heroSortBy={settings?.template === 'rcsothebys-custom' ? 'price' : undefined}
        heroLimit={settings?.template === 'rcsothebys-custom' ? 10 : undefined}
        heroProperties={heroProperties}
        featuredProperty={{
          enabled: featuredProperty?.enabled,
          mlsId: featuredProperty?.mlsId,
          title: featuredProperty?.title,
          headline: featuredProperty?.headline,
          buttonText: featuredProperty?.buttonText,
        }}
        featuredPropertiesCarousel={{
          enabled: homepage?.featuredPropertiesCarousel?.enabled,
          title: homepage?.featuredPropertiesCarousel?.title,
          subtitle: homepage?.featuredPropertiesCarousel?.subtitle,
          cities: homepage?.featuredPropertiesCarousel?.cities,
          limit: homepage?.featuredPropertiesCarousel?.limit,
          buttonText: homepage?.featuredPropertiesCarousel?.buttonText,
        }}
        featuredCommunities={{
          title: featuredCommunitiesConfig?.title,
          communities: processedCommunities,
        }}
        marketStatsSection={{
          enabled: homepage?.marketStatsSection?.enabled,
          title: homepage?.marketStatsSection?.title,
          subtitle: homepage?.marketStatsSection?.subtitle,
          cities: homepage?.marketStatsSection?.cities,
        }}
        clientVideosSection={{
          enabled: homepage?.clientVideosSection?.enabled,
          eyebrow: homepage?.clientVideosSection?.eyebrow,
          title: homepage?.clientVideosSection?.title,
          videos: (homepage?.clientVideosSection?.videos || []).flatMap((v) => {
            const playbackId = v?.muxVideo?.asset?.playbackId;
            return playbackId ? [{ playbackId, eyebrow: v?.eyebrow, title: v?.title }] : [];
          }),
        }}
        logoUrl={branding?.logo?.asset?.url ? urlFor(branding.logo).width(420).url() : undefined}
        logoAlt={branding?.logoAlt || settings?.title}
      />
    </>
  );
}

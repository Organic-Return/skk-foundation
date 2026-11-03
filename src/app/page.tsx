import { Metadata } from 'next';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { getHomepageData, getAllCommunities, getDefaultShareImage } from '@/lib/homepage';
import { getSettings, getBranding, getBaseUrl } from '@/lib/settings';
import { getNewestHighPricedByCities, getNewestHighPricedByCity } from '@/lib/listings';
import { getSalesTotals, formatUSD } from '@/lib/salesTotals';
import { getFeaturedProperties, getHomepageCityStats, getNewestListings } from '@/lib/homepageSections';
import SchemaGraph from '@/components/SchemaGraph';
import FaqSection, { faqEntries } from '@/components/FaqSection';
import { getTenant, webPageNode, serviceNode, faqNode, ids } from '@/lib/schema';
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
  const title = seo?.metaTitle || siteTitle;
  const description = seo?.metaDescription || settings?.description;
  // Share image: the homepage's own SEO image, else the hero still. Facebook
  // and LinkedIn refuse to build a preview without og:image and og:type.
  const images = seo?.metaImage?.asset
    ? [{ url: urlFor(seo.metaImage).width(1200).height(630).fit('crop').url(), width: 1200, height: 630 }]
    : (await getDefaultShareImage().then((i) => (i ? [i] : [])));

  return {
    title,
    description,
    keywords: seo?.keywords,
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      type: 'website',
      siteName: siteTitle,
      title,
      description,
      url: baseUrl,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function Home() {
  const [homepage, settings, branding] = await Promise.all([
    getHomepageData(),
    getSettings(),
    getBranding(),
  ]);

  const hero = homepage?.hero;
  const teamSection = homepage?.teamSection;
  // Accolades flagged with a Live Value in Sanity show the same career totals
  // as /sold, /buy, /sell and the team page instead of a typed-in number.
  const wantsLiveTotals = (homepage?.accolades?.items || []).some(
    (i) => i.liveValue === 'soldCount' || i.liveValue === 'salesVolume'
  );
  const totals = wantsLiveTotals ? await getSalesTotals().catch(() => null) : null;
  const accolades = homepage?.accolades
    ? {
        ...homepage.accolades,
        items: (homepage.accolades.items || []).map((item) => {
          if (!totals) return item;
          if (item.liveValue === 'soldCount') return { ...item, value: String(totals.totalSold) };
          if (item.liveValue === 'salesVolume') return { ...item, value: formatUSD(totals.totalVolume) };
          return item;
        }),
      }
    : undefined;
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
  // Phones get the image instead of the video (see ModernHero), so give
  // them a rendition sized for a phone rather than the 1920px desktop one.
  const heroMobileImageUrl = hero?.fallbackImage?.asset?.url
    ? urlFor(hero.fallbackImage).width(1080).url()
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

  // Pre-fetch the modern/custom-one sections that otherwise load in the
  // browser, so the bio, stats, Featured Properties, Market Insights and
  // Newest to Market are in the HTML for crawlers that do not run JavaScript.
  // The conditions mirror the ones HomepageContent renders each section under.
  const isModernTemplate = settings?.template === 'modern' || settings?.template === 'custom-one';
  const marketStatsCities = (homepage?.marketStatsSection?.cities || [])
    .filter((c) => c.enabled)
    .map((c) => c.city);
  const featuredAgentMlsId = teamSection?.featuredTeamMember?.mlsAgentId;
  const [featuredPropertiesInitial, cityStatsInitial, newestListingsInitial] = isModernTemplate
    ? await Promise.all([
        featuredProperty?.enabled && (featuredProperty?.mlsId || featuredAgentMlsId)
          ? getFeaturedProperties({ mlsId: featuredProperty.mlsId, agentMlsId: featuredAgentMlsId })
          : Promise.resolve(undefined),
        homepage?.marketStatsSection?.enabled !== false
          ? getHomepageCityStats(marketStatsCities.length > 0 ? marketStatsCities : undefined)
          : Promise.resolve(undefined),
        settings?.template === 'custom-one'
          ? getNewestListings(
              homepage?.featuredPropertiesCarousel?.cities || undefined,
              homepage?.featuredPropertiesCarousel?.limit || 8
            )
          : Promise.resolve(undefined),
      ])
    : [undefined, undefined, undefined];

  // Page-level structured data. The business, agent and website nodes come
  // from the root layout; this page adds its WebPage, the services the
  // business offers and the site-wide FAQ (rendered below the content).
  const tenant = await getTenant();
  const homeUrl = `${tenant.baseUrl}/`;
  const homeFaqs = faqEntries(tenant.faqs as Parameters<typeof faqEntries>[0]);
  const schemaNodes = [
    webPageNode({
      tenant,
      url: homeUrl,
      name: settings?.title || tenant.siteTitle,
      description: settings?.description,
      image: fallbackImageUrl,
      aboutId: ids.organization(tenant.baseUrl),
    }),
    ...tenant.services.map((service) =>
      serviceNode({
        serviceType: service.serviceType,
        description: service.description,
        providerId: ids.organization(tenant.baseUrl),
        areaServed: tenant.areaServed,
        url: homeUrl,
      })
    ),
    faqNode(homeUrl, homeFaqs),
  ];

  return (
    <>
      <SchemaGraph nodes={schemaNodes} />

      <HomepageContent
        template={settings?.template}
        videoUrl={videoUrl}
        heroMuxPlaybackId={heroMuxPlaybackId}
        fallbackImageUrl={fallbackImageUrl}
        heroMobileImageUrl={heroMobileImageUrl}
        heroTagline={hero?.tagline}
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
        featuredTestimonial={
          homepage?.featuredTestimonial?.quote && homepage?.featuredTestimonial?.author
            ? {
                quote: homepage.featuredTestimonial.quote,
                author: homepage.featuredTestimonial.author,
                role: homepage.featuredTestimonial.role,
                location: homepage.featuredTestimonial.location,
              }
            : null
        }
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
          title: homepage?.clientVideosSection?.title,
          videos: (homepage?.clientVideosSection?.videos || []).flatMap((v) => {
            const playbackId = v?.muxVideo?.asset?.playbackId;
            return playbackId ? [{ playbackId, title: v?.title, description: v?.description }] : [];
          }),
        }}
        logoUrl={branding?.logo?.asset?.url ? urlFor(branding.logo).width(420).url() : undefined}
        logoAlt={branding?.logoAlt || settings?.title}
        featuredPropertiesInitial={featuredPropertiesInitial}
        cityStatsInitial={cityStatsInitial}
        newestListingsInitial={newestListingsInitial}
      />
      <FaqSection faqs={tenant.faqs as Parameters<typeof faqEntries>[0]} />
    </>
  );
}

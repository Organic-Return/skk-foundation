import { client } from "@/sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { Metadata } from "next";
import { getBaseUrl, getSiteTemplate } from '@/lib/settings';
import TeamGrid from "@/components/TeamGrid";
import PageHero from "@/components/PageHero";
import StructuredData from "@/components/StructuredData";
import { breadcrumbSchema, collectionPageSchema } from '@/lib/seo';

const builder = createImageUrlBuilder(client);
function urlFor(source: any) {
  return builder.image(source);
}

interface TeamMember {
  _id: string;
  name: string;
  slug: { current: string };
  title?: string;
  image?: any;
  email?: string;
  phone?: string;
  mobile?: string;
  office?: string;
}

const ALL_TEAM_QUERY = `*[_type == "teamMember" && defined(slug.current) && inactive != true && defined(title) && title != ""] | order(order asc, name asc) {
  _id,
  name,
  slug,
  title,
  image,
  email,
  phone,
  mobile,
  office
}`;

const options = { next: { revalidate: 60 } };

export const metadata: Metadata = {
  title: "Our Team",
  description: "Meet our team of experienced real estate professionals.",
};

export default async function TeamPage() {
  const [members, template, baseUrl] = await Promise.all([
    client.fetch<TeamMember[]>(ALL_TEAM_QUERY, {}, options),
    getSiteTemplate(),
    getBaseUrl(),
  ]);

  const isRC = template === "rcsothebys-custom";
  const teamPath = isRC ? 'agents' : 'team';
  const teamSchema = collectionPageSchema({
    name: isRC ? 'Our Agents' : 'Our Team',
    url: `${baseUrl}/${teamPath}`,
    items: (members || []).map((m) => ({
      name: m.name,
      url: `${baseUrl}/${teamPath}/${m.slug?.current}`,
    })),
  });
  const teamCrumbs = breadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: isRC ? 'Agents' : 'Team', url: `${baseUrl}/${teamPath}` },
  ]);

  // Process image URLs server-side for the client component
  const processedMembers = members.map((m) => ({
    _id: m._id,
    name: m.name,
    slug: m.slug,
    title: m.title,
    email: m.email,
    phone: m.phone,
    mobile: m.mobile,
    office: m.office,
    imageUrl: m.image
      ? isRC
        ? urlFor(m.image).width(450).height(560).url()
        : urlFor(m.image).width(300).height(300).url()
      : undefined,
  }));

  return (
    <main className="min-h-screen">
      {teamSchema && <StructuredData data={teamSchema} />}
      <StructuredData data={teamCrumbs} />
      {/* Hero */}
      <PageHero
        title={isRC ? "Retter & Company Sotheby's International Realty Team" : "Our Team"}
        subtitle={isRC ? "Meet our Experienced Tri-Cities Real Estate Agents" : "Meet our experienced real estate professionals"}
      >
        {!isRC && (
          <p className="text-white/50 text-sm mt-3 font-light">
            {members.length} Agents
          </p>
        )}
      </PageHero>

      {/* Team Grid with Letter Filter */}
      <section
        className={
          isRC
            ? "py-16 md:py-24 bg-[var(--rc-cream)]"
            : "py-16 md:py-24 bg-white dark:bg-[#1a1a1a]"
        }
      >
        <div className="max-w-7xl mx-auto px-6">
          <TeamGrid members={processedMembers} isRC={isRC} totalCount={members.length} />
        </div>
      </section>
    </main>
  );
}

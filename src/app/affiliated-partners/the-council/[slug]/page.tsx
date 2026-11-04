import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Partner, EnrichedPartner, enrichPartnerWithAgentData, getPartnerUrl, urlFor } from "../../components";
import { getBaseUrl, getBrandName, getSettings } from '@/lib/settings';
import { getDefaultShareImage } from '@/lib/homepage';
import CouncilContactForm from "./CouncilContactForm";

// Query by slug or by generated slug from firstName-lastName
const PARTNER_BY_SLUG_QUERY = `*[_type == "affiliatedPartner" && active == true && partnerType == "the_council" && (slug.current == $slug || lower(firstName + "-" + lastName) == $slug)][0] {
  _id,
  partnerType,
  firstName,
  lastName,
  agentStaffId,
  slug,
  title,
  company,
  location,
  // email / phone / website deliberately not projected — see the list page.
  overridePhoto,
  overrideBio,
  specialties,
  featured
}`;

// The whole roster in display order, so a profile can point to its neighbours.
const COUNCIL_ROSTER_QUERY = `*[_type == "affiliatedPartner" && active == true && partnerType == "the_council"] | order(sortOrder asc, lastName asc) {
  _id,
  partnerType,
  firstName,
  lastName,
  agentStaffId,
  slug,
  title,
  company,
  location,
  overridePhoto
}`;

const options = { next: { revalidate: 60 } };

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [partner, baseUrl, siteName] = await Promise.all([
    client.fetch<Partner | null>(PARTNER_BY_SLUG_QUERY, { slug }, options),
    getBaseUrl(),
    getBrandName(),
  ]);

  if (!partner) {
    return {
      title: `Partner Not Found | ${siteName}`,
    };
  }
  const canonicalUrl = `${baseUrl}/affiliated-partners/the-council/${slug}`;

  const shareImage = await getDefaultShareImage();
  const partnerName = `${partner.firstName} ${partner.lastName}`;
  // The site's own agent is a Council member too; her profile would otherwise
  // read "Stacey K. Kelly | The Council | Stacey K. Kelly".
  const title = partnerName === siteName ? `${partnerName} | The Council` : `${partnerName} | The Council | ${siteName}`;
  const description = `Meet ${partner.firstName} ${partner.lastName}${partner.company ? ` of ${partner.company}` : ''}${partner.location ? ` in ${partner.location}` : ''}, a member of The Council, Christie's International Real Estate's network of leading agents.`;
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'profile',
      images: shareImage ? [shareImage] : [],
      title,
      description,
      url: canonicalUrl,
    },
  };
}

/** Split a plain-text bio into paragraphs on blank lines (or single newlines). */
function toParagraphs(bio: string): string[] {
  return bio
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Up to `count` other members, starting after the current one in roster order. */
function pickNeighbours(roster: Partner[], currentId: string, count: number): Partner[] {
  const others = roster.filter((p) => p._id !== currentId);
  if (others.length <= count) return others;
  const index = roster.findIndex((p) => p._id === currentId);
  const start = index < 0 ? 0 : index % others.length;
  return [...others.slice(start), ...others.slice(0, start)].slice(0, count);
}

function PortraitPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center text-[#c4c0b8] dark:text-gray-600 ${className}`}>
      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}

export default async function TheCouncilMemberPage({ params }: Props) {
  const { slug } = await params;
  const partner = await client.fetch<Partner | null>(PARTNER_BY_SLUG_QUERY, { slug }, options);

  if (!partner) {
    notFound();
  }

  const [member, roster, settings, siteName] = await Promise.all([
    enrichPartnerWithAgentData(partner),
    client.fetch<Partner[]>(COUNCIL_ROSTER_QUERY, {}, options),
    getSettings(),
    getBrandName(),
  ]);

  const fullName = `${member.firstName} ${member.lastName}`;
  const agentName = siteName;
  const agentFirstName = siteName.split(' ')[0];
  const agentPhone = settings?.contactInfo?.phone || settings?.footer?.contactInfo?.phone;
  const agentEmail = settings?.contactInfo?.email || settings?.footer?.contactInfo?.email;
  const isSiteAgent = fullName === siteName;

  // A taller crop for the profile than the directory cards use.
  const portraitUrl = member.overridePhoto
    ? urlFor(member.overridePhoto)?.width(900).height(1125).fit('crop').url() || member.photoUrl
    : member.photoUrl;

  const paragraphs = member.bio ? toParagraphs(member.bio) : [];
  const neighbours: EnrichedPartner[] = await Promise.all(
    pickNeighbours(roster, member._id, 4).map((p) => enrichPartnerWithAgentData(p))
  );

  const facts: Array<{ label: string; value: string }> = [
    member.title ? { label: 'Role', value: member.title } : null,
    member.company ? { label: 'Brokerage', value: member.company } : null,
    member.location ? { label: 'Market', value: member.location } : null,
    { label: 'Network', value: "The Council, Christie's International Real Estate" },
  ].filter((f): f is { label: string; value: string } => f !== null);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-[#e8e6e3] dark:border-gray-800">
        <ol className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] font-light">
          <li>
            <Link href="/affiliated-partners/the-council" className="text-[#6a6a6a] dark:text-gray-400 hover:text-[var(--color-gold)] transition-colors">
              The Council
            </Link>
          </li>
          <li aria-hidden="true" className="text-[#c4c0b8] dark:text-gray-600">/</li>
          <li aria-current="page" className="text-[#1a1a1a] dark:text-white truncate">
            {fullName}
          </li>
        </ol>
      </nav>

      {/* Profile header */}
      <section className="bg-[#f8f7f5] dark:bg-[#141414]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-10 md:py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-10 lg:gap-16 items-center">
            {/* Portrait */}
            <div className="relative w-full max-w-[260px] sm:max-w-[300px] lg:max-w-none mx-auto lg:mx-0 aspect-[4/5] overflow-hidden bg-[#ebe8e3] dark:bg-gray-800 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              {portraitUrl ? (
                <Image
                  src={portraitUrl}
                  alt={fullName}
                  fill
                  priority
                  sizes="(max-width: 1024px) 300px, 340px"
                  className="object-cover"
                />
              ) : (
                <PortraitPlaceholder />
              )}
            </div>

            {/* Identity */}
            <div className="text-center lg:text-left">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-gold)] font-light mb-4">
                Member of The Council
              </p>
              <h1 className="text-[#1a1a1a] dark:text-white !leading-[1.05] mb-4">
                {fullName}
              </h1>
              {member.title && (
                <p className="text-lg md:text-xl text-[#4a4a4a] dark:text-gray-300 font-light mb-6">
                  {member.title}
                </p>
              )}

              <div className="w-12 h-px bg-[var(--color-gold)] mx-auto lg:mx-0 mb-6" />

              <dl className="flex flex-col sm:flex-row sm:flex-wrap justify-center lg:justify-start gap-x-12 gap-y-4 mb-8 md:mb-10">
                {member.company && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] dark:text-gray-500 font-light mb-1">Brokerage</dt>
                    <dd className="text-[#1a1a1a] dark:text-white font-light">{member.company}</dd>
                  </div>
                )}
                {member.location && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] dark:text-gray-500 font-light mb-1">Market</dt>
                    <dd className="text-[#1a1a1a] dark:text-white font-light">{member.location}</dd>
                  </div>
                )}
              </dl>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
                {isSiteAgent ? (
                  <Link
                    href="/contact-us"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--color-navy)] border border-[var(--color-navy)] text-white text-[11px] uppercase tracking-[0.2em] font-light hover:bg-[var(--color-gold)] hover:border-[var(--color-gold)] transition-all duration-300"
                  >
                    Contact {agentFirstName}
                  </Link>
                ) : (
                  <a
                    href="#connect"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--color-navy)] border border-[var(--color-navy)] text-white text-[11px] uppercase tracking-[0.2em] font-light hover:bg-[var(--color-gold)] hover:border-[var(--color-gold)] transition-all duration-300"
                  >
                    Request an Introduction
                  </a>
                )}
                <Link
                  href="/affiliated-partners/the-council"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#1a1a1a]/20 dark:border-white/25 text-[#1a1a1a] dark:text-white text-[11px] uppercase tracking-[0.2em] font-light hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all duration-300"
                >
                  All Members
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio + sidebar */}
      <section className="py-14 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-14 lg:gap-20 items-start">
            <article>
              <h2 className="text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-white tracking-wide mb-3">
                About {member.firstName}
              </h2>
              <div className="w-16 h-px bg-[var(--color-gold)] mb-8" />

              {paragraphs.length > 0 ? (
                <div className="space-y-6 max-w-[68ch]">
                  {paragraphs.map((text, index) => (
                    <p
                      key={index}
                      className={`text-[#4a4a4a] dark:text-gray-300 font-light leading-[1.85] ${index === 0 ? 'text-[19px] md:text-[20px] text-[#1a1a1a] dark:text-white' : 'text-[17px]'}`}
                    >
                      {text}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[#4a4a4a] dark:text-gray-300 font-light leading-[1.85] text-[17px] max-w-[68ch]">
                  {member.firstName} {member.lastName} is a member of The Council, Christie&apos;s International Real Estate&apos;s
                  invitation-only network of leading agents{member.company ? `, representing ${member.company}` : ''}
                  {member.location ? ` in ${member.location}` : ''}.{' '}
                  {isSiteAgent ? (
                    <>Read more <Link href="/about/stacey-k-kelly" className="underline underline-offset-4 decoration-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors">about {agentFirstName}</Link>.</>
                  ) : (
                    <>{agentFirstName} can make a personal introduction.</>
                  )}
                </p>
              )}

              {member.specialties && member.specialties.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#8a8a8a] dark:text-gray-500 font-light mb-4">
                    Specialties
                  </h3>
                  <ul className="flex flex-wrap gap-2.5">
                    {member.specialties.map((specialty) => (
                      <li
                        key={specialty}
                        className="px-4 py-2 border border-[#e0ddd7] dark:border-gray-700 text-[#4a4a4a] dark:text-gray-300 text-sm font-light"
                      >
                        {specialty}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <aside className="lg:sticky lg:top-[140px] space-y-6">
              {/* At a glance */}
              <div className="border border-[#e8e6e3] dark:border-gray-800 p-7 md:p-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a8a8a] dark:text-gray-500 font-light mb-6">
                  At a Glance
                </p>
                <dl className="divide-y divide-[#efede9] dark:divide-gray-800">
                  {facts.map((fact) => (
                    <div key={fact.label} className="py-3.5 first:pt-0 last:pb-0">
                      <dt className="text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a] dark:text-gray-500 font-light mb-1">
                        {fact.label}
                      </dt>
                      <dd className="text-[#1a1a1a] dark:text-white font-light leading-snug">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Introduction */}
              <div id="connect" className="scroll-mt-[140px] bg-[var(--color-navy)] text-white p-7 md:p-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-gold)] font-light mb-3">
                  {isSiteAgent ? 'Get in Touch' : 'Introductions'}
                </p>
                <h2 className="font-serif !text-2xl md:!text-[1.75rem] text-white !leading-tight mb-3">
                  {isSiteAgent ? `Work with ${agentFirstName}` : `Connect with ${member.firstName} through ${agentFirstName}`}
                </h2>
                <p className="text-white/70 text-sm font-light leading-relaxed mb-6">
                  {isSiteAgent
                    ? `For real estate in Aspen and Snowmass, or an introduction anywhere The Council reaches, reach ${agentFirstName} directly.`
                    : `${agentName} is a fellow Council member and can personally introduce you to ${member.firstName}${member.location ? ` for real estate in ${member.location}` : ''}.`}
                </p>

                {(agentPhone || agentEmail) && (
                  <div className="flex flex-col gap-2 mb-7 text-sm font-light">
                    {agentPhone && (
                      <a href={`tel:${agentPhone.replace(/[^\d+]/g, '')}`} className="text-white/85 hover:text-[var(--color-gold)] transition-colors">
                        {agentPhone}
                      </a>
                    )}
                    {agentEmail && (
                      <a href={`mailto:${agentEmail}`} className="text-white/85 hover:text-[var(--color-gold)] transition-colors break-all">
                        {agentEmail}
                      </a>
                    )}
                  </div>
                )}

                <div className="border-t border-white/10 pt-6">
                  <CouncilContactForm
                    memberName={fullName}
                    memberLocation={member.location}
                    agentFirstName={agentFirstName}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Other members */}
      {neighbours.length > 0 && (
        <section className="py-14 md:py-20 bg-[#f8f7f5] dark:bg-[#141414] border-t border-[#e8e6e3] dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-gold)] font-light mb-3">
                  The Council
                </p>
                <h2 className="text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-white tracking-wide">
                  More Members
                </h2>
              </div>
              <Link
                href="/affiliated-partners/the-council"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-light text-[#1a1a1a] dark:text-white hover:text-[var(--color-gold)] transition-colors"
              >
                View all members
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
              {neighbours.map((other) => {
                const otherName = `${other.firstName} ${other.lastName}`;
                return (
                  <li key={other._id}>
                    <Link href={getPartnerUrl(other)} className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#ebe8e3] dark:bg-gray-800 mb-4">
                        {other.photoUrl ? (
                          <Image
                            src={other.photoUrl}
                            alt={otherName}
                            fill
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <PortraitPlaceholder />
                        )}
                      </div>
                      <h3 className="!text-lg md:!text-xl font-light text-[#1a1a1a] dark:text-white tracking-wide group-hover:text-[var(--color-gold)] transition-colors">
                        {otherName}
                      </h3>
                      {other.company && (
                        <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light mt-1 line-clamp-1">{other.company}</p>
                      )}
                      {other.location && (
                        <p className="text-sm text-[#8a8a8a] dark:text-gray-500 font-light">{other.location}</p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

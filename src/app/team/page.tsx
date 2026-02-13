import { client } from "@/sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";

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
}

const ALL_TEAM_QUERY = `*[_type == "teamMember"] | order(order asc, name asc) {
  _id,
  name,
  slug,
  title,
  image,
  email,
  phone
}`;

const options = { next: { revalidate: 60 } };

export const metadata: Metadata = {
  title: "Our Team",
  description: "Meet our team of experienced real estate professionals.",
};

export default async function TeamPage() {
  const [members, template] = await Promise.all([
    client.fetch<TeamMember[]>(ALL_TEAM_QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === "rcsothebys-custom";

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section
        className={
          isRC
            ? "bg-[var(--rc-navy)] py-16 md:py-24"
            : "bg-[var(--color-navy,#002349)] py-16 md:py-24"
        }
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1
            className={
              isRC
                ? "text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-white mb-4"
                : "font-serif text-white mb-4"
            }
            style={isRC ? { fontFamily: "var(--font-figtree), Figtree, sans-serif", lineHeight: "1.1em" } : undefined}
          >
            Our Team
          </h1>
          <p
            className={
              isRC
                ? "text-white/60 text-base md:text-lg font-normal max-w-2xl mx-auto"
                : "text-white/70 text-lg font-light max-w-2xl mx-auto"
            }
          >
            Meet our experienced real estate professionals
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section
        className={
          isRC
            ? "py-16 md:py-24 bg-[var(--rc-cream)]"
            : "py-16 md:py-24 bg-white dark:bg-[#1a1a1a]"
        }
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
            {members.map((member) => (
              <Link
                key={member._id}
                href={`/team/${member.slug.current}`}
                className="group text-center"
              >
                {/* Avatar */}
                <div
                  className={`relative w-full aspect-square rounded-full overflow-hidden mx-auto mb-4 ${
                    isRC
                      ? "bg-[var(--rc-navy)]/5 border-2 border-[var(--rc-gold)]/20 group-hover:border-[var(--rc-gold)] transition-colors duration-300"
                      : "bg-[#f0f0f0] dark:bg-gray-800 border-2 border-[var(--color-gold,#c19b5f)]/20 group-hover:border-[var(--color-gold,#c19b5f)] transition-colors duration-300"
                  }`}
                >
                  {member.image ? (
                    <Image
                      src={urlFor(member.image).width(300).height(300).url()}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3
                  className={`text-sm md:text-base font-medium transition-colors duration-200 ${
                    isRC
                      ? "text-[var(--rc-navy)] group-hover:text-[var(--rc-gold)]"
                      : "text-[#1a1a1a] dark:text-white group-hover:text-[var(--color-gold,#c19b5f)]"
                  }`}
                >
                  {member.name}
                </h3>

                {/* Title */}
                {member.title && (
                  <p
                    className={`text-xs mt-1 ${
                      isRC ? "text-[var(--rc-brown)]" : "text-[#6a6a6a] dark:text-gray-400"
                    }`}
                  >
                    {member.title}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

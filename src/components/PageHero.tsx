import Image from 'next/image';

/**
 * Default background image for hero sections on pages that don't supply their
 * own. A wide Aspen-style mountain landscape that reads well behind the
 * transparent site navigation.
 */
export const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Background image URL. Falls back to DEFAULT_HERO_IMAGE. */
  image?: string;
  /** Extra content rendered below the subtitle (e.g. a count or CTA). */
  children?: React.ReactNode;
}

/**
 * Canonical hero used across secondary pages. Matches the exclusive-listings
 * design: a navy section with a full-bleed background image behind a navy
 * overlay, centered white serif title and subtitle. The tall top padding
 * clears the fixed transparent nav that overlays it.
 */
export default function PageHero({ title, subtitle, eyebrow, image, children }: PageHeroProps) {
  const src = image || DEFAULT_HERO_IMAGE;

  return (
    <section className="relative bg-[var(--color-navy)] py-[8.45rem] md:py-[11.83rem] overflow-hidden">
      <Image src={src} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[var(--color-navy)]/70" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
        {eyebrow && (
          <p className="text-[var(--color-gold)] text-xs md:text-sm uppercase tracking-[0.25em] mb-5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-white text-4xl md:text-6xl font-light tracking-wide mb-5">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/75 font-light max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

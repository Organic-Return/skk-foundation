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
 * Full-bleed hero used across secondary pages. The site nav is transparent and
 * overlays this hero, so the section runs to the top of the viewport and its
 * content is padded down far enough to clear the fixed 127px nav.
 */
export default function PageHero({ title, subtitle, eyebrow, image, children }: PageHeroProps) {
  const src = image || DEFAULT_HERO_IMAGE;

  return (
    <section className="relative h-[60vh] md:h-[70vh] min-h-[500px] flex items-end overflow-hidden">
      <Image src={src} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
      <div className="relative max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 pb-16 md:pb-24">
        {eyebrow && (
          <p className="text-[var(--color-gold)] text-xs md:text-sm uppercase tracking-[0.25em] mb-5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-white text-4xl md:text-6xl font-light tracking-wide mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/80 font-light max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

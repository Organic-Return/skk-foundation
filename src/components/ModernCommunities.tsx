'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Community {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  imageUrl?: string;
}

interface ModernCommunitiesProps {
  title?: string;
  communities: Community[];
}

export default function ModernCommunities({
  title = 'Our Communities',
  communities,
}: ModernCommunitiesProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!communities || communities.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="pt-24 md:pt-32 pb-16 md:pb-24 bg-[var(--modern-black)] relative overflow-hidden">
      {/* Background pattern - matching ModernQuoteBlock */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            var(--modern-gold) 40px,
            var(--modern-gold) 41px
          )`
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div
          className={`text-center mb-16 md:mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-wide">
            {title}
          </h2>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {communities.map((community, index) => (
            <Link
              key={community._id}
              href={`/communities/${community.slug.current}`}
              className={`group block relative overflow-hidden transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-[3/4] bg-white/5">
                {community.imageUrl ? (
                  <Image
                    src={community.imageUrl}
                    alt={community.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/20">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[var(--modern-gold)]/0 group-hover:bg-[var(--modern-gold)]/10 transition-all duration-500" />

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <h3 className="text-white text-xl md:text-2xl font-light tracking-wide mb-2">
                    {community.title}
                  </h3>
                  {community.description && (
                    <p className="text-white/60 text-sm font-light line-clamp-2 mb-4">
                      {community.description}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-2 text-[var(--modern-gold)] text-xs uppercase tracking-[0.2em] group-hover:gap-3 transition-all duration-300">
                    <span>Explore</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div
          className={`text-center mt-12 md:mt-16 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 group text-white/60 hover:text-[var(--modern-gold)] transition-colors duration-300 text-sm uppercase tracking-[0.2em]"
          >
            <span>Explore All Communities</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

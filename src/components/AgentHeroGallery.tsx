'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroListing {
  id: string;
  address: string;
  city: string;
  state?: string;
  list_price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  photos: string[];
  status?: string;
}

interface AgentHeroGalleryProps {
  listings: HeroListing[];
  agentName: string;
  agentImageUrl?: string;
  agentTitle?: string;
  agentEmail?: string;
  agentPhone?: string;
  agentMobile?: string;
  agentSlug: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Left arrow — triangle points left (same as home hero)
function PrevArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M86.0014 0.407227L2.98023e-06 86.4086L86.0014 172.41V0.407227Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M0 86.4086L-0.707107 85.7015L-1.41421 86.4086L-0.707107 87.1157L0 86.4086ZM86.0014 0.407227H87.0014V-2.00699L85.2943 -0.29988L86.0014 0.407227ZM86.0014 172.41L85.2943 173.117L87.0014 174.824V172.41H86.0014ZM0.707107 87.1157L86.7085 1.11433L85.2943 -0.29988L-0.707107 85.7015L0.707107 87.1157ZM86.7085 171.703L0.707107 85.7015L-0.707107 87.1157L85.2943 173.117L86.7085 171.703ZM87.0014 172.41V0.407227H85.0014V172.41H87.0014Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M57.7344 85.6572L65.7344 85.6572L65.7344 87.1572L57.7344 87.1572L23.6069 87.1572L36.7919 100.35L35.7344 101.407L21.4844 87.1572L15.6069 87.1572L28.7919 100.35L27.7344 101.407L12.7344 86.4072L27.7344 71.4072L28.7994 72.4647L15.6069 85.6572L21.4844 85.6572L35.7344 71.4072L36.7994 72.4647L23.6069 85.6572L57.7344 85.6572Z" fill="#002349"/>
    </svg>
  );
}

// Right arrow — triangle points right (same as home hero)
function NextArrow() {
  return (
    <svg viewBox="0 0 86 173" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M-0.00140381 172.407L86 86.4058L-0.00141885 0.404426L-0.00140381 172.407Z" fill="#FFFFF8" fillOpacity="0.7"/>
      <path d="M86 86.4058L86.7071 87.1129L87.4142 86.4058L86.7071 85.6987L86 86.4058ZM-0.00140381 172.407L-1.0014 172.407L-1.0014 174.821L0.705704 173.114L-0.00140381 172.407ZM-0.00141885 0.404426L0.705689 -0.302681L-1.00142 -2.00979L-1.00142 0.404427L-0.00141885 0.404426ZM85.2929 85.6987L-0.708511 171.7L0.705704 173.114L86.7071 87.1129L85.2929 85.6987ZM-0.708526 1.11153L85.2929 87.1129L86.7071 85.6987L0.705689 -0.302681L-0.708526 1.11153ZM-1.00142 0.404427L-1.0014 172.407L0.998596 172.407L0.998581 0.404426L-1.00142 0.404427Z" fill="#C19B5F"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M28.2656 87.1572H20.2656L20.2656 85.6572H28.2656L62.3931 85.6572L49.2081 72.4647L50.2656 71.4072L64.5156 85.6572H70.3931L57.2081 72.4647L58.2656 71.4072L73.2656 86.4072L58.2656 101.407L57.2006 100.35L70.3931 87.1572H64.5156L50.2656 101.407L49.2006 100.35L62.3931 87.1572L28.2656 87.1572Z" fill="#002349"/>
    </svg>
  );
}

export default function AgentHeroGallery({
  listings,
  agentName,
  agentImageUrl,
  agentTitle,
  agentEmail,
  agentPhone,
  agentMobile,
  agentSlug,
  socialMedia,
}: AgentHeroGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    if (listings.length === 0) return;
    if (index < 0) index = listings.length - 1;
    if (index >= listings.length) index = 0;
    setActiveIndex(index);
  }, [listings.length]);

  const handlePrev = () => goToSlide(activeIndex - 1);
  const handleNext = () => goToSlide(activeIndex + 1);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (listings.length <= 1) return;
    const timer = setInterval(() => {
      goToSlide(activeIndex + 1);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeIndex, listings.length, goToSlide]);

  const currentListing = listings[activeIndex] || null;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '80vh', minHeight: '500px' }}>
      {/* Property Images — crossfade slideshow */}
      {listings.map((listing, index) => {
        const photo = listing.photos?.[0] || null;
        return (
          <div
            key={listing.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {photo ? (
              <Image
                src={photo}
                alt={listing.address || 'Property'}
                fill
                className="object-cover"
                sizes="100vw"
                quality={90}
                priority={index === 0}
              />
            ) : (
              <div className="w-full h-full bg-[var(--rc-navy)]" />
            )}
          </div>
        );
      })}

      {/* Signature Triangular Arrows */}
      {listings.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 hover:scale-105 transition-transform duration-200"
            aria-label="Previous property"
          >
            <div className="w-[36px] h-[72px] md:w-[48px] md:h-[96px] lg:w-[60px] lg:h-[120px]">
              <PrevArrow />
            </div>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 hover:scale-105 transition-transform duration-200"
            aria-label="Next property"
          >
            <div className="w-[36px] h-[72px] md:w-[48px] md:h-[96px] lg:w-[60px] lg:h-[120px]">
              <NextArrow />
            </div>
          </button>
        </>
      )}

      {/* Property Info Card — bottom right */}
      {currentListing && (
        <Link
          href={`/listings/${currentListing.id}`}
          className="absolute bottom-8 md:bottom-12 right-4 md:right-8 lg:right-12 z-20 bg-white/95 backdrop-blur-sm px-5 py-4 md:px-6 md:py-5 shadow-lg hover:bg-white transition-colors duration-200 max-w-[280px] md:max-w-sm md:w-[380px] hidden sm:block"
        >
          {/* Diamond plus icon */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
            <div className="w-8 h-8 bg-white border border-[var(--rc-gold)]/40 rotate-45 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-[var(--rc-navy)] -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-[var(--rc-navy)] text-xl md:text-2xl font-light tracking-wide">
                {formatPrice(currentListing.list_price)}
              </div>
              <div className="text-[var(--rc-brown)] text-xs uppercase tracking-[0.15em] mt-0.5">
                {currentListing.city}{currentListing.state ? `, ${currentListing.state}` : ''}
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col gap-1 text-[var(--rc-brown)] text-xs border-l border-gray-200 pl-4">
              {currentListing.bedrooms !== null && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span>{currentListing.bedrooms}</span>
                </div>
              )}
              {currentListing.bathrooms !== null && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{currentListing.bathrooms}</span>
                </div>
              )}
              {currentListing.square_feet && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[var(--rc-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  <span>{currentListing.square_feet.toLocaleString()} SQ FT</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Bottom gradient with agent info overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-32 pb-8">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="flex items-end gap-6 md:gap-8">
              {/* Agent Photo */}
              {agentImageUrl && (
                <div
                  className="relative flex-shrink-0 w-[120px] md:w-[160px] overflow-hidden border-2 border-white/20"
                  style={{ aspectRatio: '450 / 560' }}
                >
                  <Image
                    src={agentImageUrl}
                    alt={agentName}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                </div>
              )}

              {/* Agent Info */}
              <div className="flex-1 min-w-0 pb-1">
                <h1
                  className="text-2xl md:text-3xl lg:text-4xl font-light uppercase tracking-[0.08em] text-white mb-1"
                  style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
                >
                  {agentName}
                </h1>
                {agentTitle && (
                  <p className="text-[var(--rc-gold)] text-sm md:text-base font-light mb-3">
                    {agentTitle}
                  </p>
                )}

                <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                  {agentEmail && (
                    <a href={`mailto:${agentEmail}`} className="text-white/70 hover:text-white text-xs md:text-sm font-light transition-colors">
                      {agentEmail}
                    </a>
                  )}
                  {agentPhone && (
                    <a href={`tel:${agentPhone}`} className="text-white/70 hover:text-white text-xs md:text-sm font-light transition-colors">
                      {agentPhone}
                    </a>
                  )}
                  {agentMobile && agentMobile !== agentPhone && (
                    <a href={`tel:${agentMobile}`} className="text-white/70 hover:text-white text-xs md:text-sm font-light transition-colors">
                      {agentMobile}
                    </a>
                  )}
                </div>

                {/* Social media */}
                {socialMedia && (
                  <div className="flex items-center gap-3 mt-3">
                    {socialMedia.facebook && (
                      <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </a>
                    )}
                    {socialMedia.instagram && (
                      <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                      </a>
                    )}
                    {socialMedia.linkedin && (
                      <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                      </a>
                    )}
                    {socialMedia.twitter && (
                      <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Slide indicator */}
            {listings.length > 1 && (
              <div className="flex items-center gap-1.5 mt-4 ml-0 md:ml-[184px]">
                {listings.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-0.5 transition-all duration-300 ${
                      i === activeIndex ? 'w-6 bg-[var(--rc-gold)]' : 'w-3 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

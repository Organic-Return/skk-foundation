'use client'

import { useRef } from 'react'
import MuxPlayer from '@mux/mux-player-react'

interface FeatureVideo {
  playbackId: string
  /** The client's name, shown under the video. */
  title: string
  /** Short description under the name — around three lines. Optional. */
  description?: string
}

interface VideoFeatureCarouselProps {
  title: string
  videos: FeatureVideo[]
}

export default function VideoFeatureCarousel({ title, videos }: VideoFeatureCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  if (!videos || videos.length === 0) return null

  const scroll = (dir: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: el.clientWidth * 0.85 * dir, behavior: 'smooth' })
  }

  return (
    <section className="bg-[var(--modern-black)] py-20 md:py-28 relative overflow-hidden">
      {/* Background pattern - diagonal gold lines (matches the accolades section) */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
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

      {/* Header. The chevrons live here rather than over the carousel: floated
          on the videos they landed on Mux's centred play button. This is the
          same treatment as Newest to Market — square, hairline-bordered,
          filling white on hover. */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-12 md:mb-16 relative z-10">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.05] mb-8">
            {title}
          </h2>
          <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto" />
        </div>

        <div className="flex justify-end gap-3 mt-10">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous videos"
            className="w-12 h-12 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-[var(--modern-black)] transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next videos"
            className="w-12 h-12 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-[var(--modern-black)] transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative z-10">
        <div
          ref={scrollerRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pl-6 pr-4 lg:pr-6 lg:pl-[max(2rem,calc(((100vw_-_80rem)/2_+_2rem)_*_0.7))] scroll-pl-6 lg:scroll-pl-[max(2rem,calc(((100vw_-_80rem)/2_+_2rem)_*_0.7))] pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Cards are 20% wider than they were (640→768, 760→912). The mobile
              width stays at 90vw — it is already near full-bleed, and scaling it
              up would only push the card past the viewport. */}
          {videos.map((video, i) => (
            <div key={i} className="snap-start shrink-0 w-[90vw] sm:w-[768px] lg:w-[912px]">
              <div className="relative aspect-video overflow-hidden bg-black">
                <MuxPlayer
                  playbackId={video.playbackId}
                  streamType="on-demand"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <div className="mt-2.5">
                {/* The visible gap above the name is the heading's own
                    margin-top, not this wrapper's — the two collapse and the
                    heading's is larger. Halving it here halves the gap. It has
                    to be an inline style: the global `h1-h6 { margin-top }` rule
                    is unlayered, so a Tailwind mt-* class on a heading loses to
                    it and would do nothing. */}
                <h3
                  className="text-white text-xl md:text-2xl font-light"
                  style={{ marginTop: '0.75em' }}
                >
                  {video.title}
                </h3>
                {video.description && (
                  <p className="mt-3 text-white/60 text-sm md:text-base font-light leading-relaxed max-w-prose">
                    {video.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

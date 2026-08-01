'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    const update = () => {
      setCanLeft(el.scrollLeft > 8)
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [videos.length])

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

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-12 md:mb-16 relative z-10">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.05] mb-8">
          {title}
        </h2>
        <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto" />
      </div>

      {/* Carousel */}
      <div className="relative z-10">
        <div
          ref={scrollerRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pl-6 pr-4 lg:pr-6 lg:pl-[max(2rem,calc(((100vw_-_80rem)/2_+_2rem)_*_0.7))] scroll-pl-6 lg:scroll-pl-[max(2rem,calc(((100vw_-_80rem)/2_+_2rem)_*_0.7))] pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {videos.map((video, i) => (
            <div key={i} className="snap-start shrink-0 w-[90vw] sm:w-[640px] lg:w-[760px]">
              <div className="relative aspect-video overflow-hidden bg-black">
                <MuxPlayer
                  playbackId={video.playbackId}
                  streamType="on-demand"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <div className="mt-5">
                <h3 className="text-white text-xl md:text-2xl font-light">{video.title}</h3>
                {video.description && (
                  <p className="mt-3 text-white/60 text-sm md:text-base font-light leading-relaxed max-w-prose">
                    {video.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {canLeft && (
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous videos"
            className="hidden md:flex absolute left-4 top-[38%] -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-colors duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {canRight && (
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next videos"
            className="hidden md:flex absolute right-4 top-[38%] -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-colors duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}

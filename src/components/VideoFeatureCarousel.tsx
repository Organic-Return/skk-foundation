'use client'

import { useEffect, useRef, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'

interface FeatureVideo {
  playbackId: string
  eyebrow?: string
  title: string
}

interface VideoFeatureCarouselProps {
  eyebrow?: string
  title: string
  videos: FeatureVideo[]
}

export default function VideoFeatureCarousel({ eyebrow, title, videos }: VideoFeatureCarouselProps) {
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
    <section className="bg-[var(--modern-black)] py-20 md:py-28 overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-12 md:mb-16">
        {eyebrow && (
          <p className="text-white/70 text-xs md:text-sm uppercase tracking-[0.25em] mb-5">
            {eyebrow}
          </p>
        )}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.05]">
          {title}
        </h2>
      </div>

      {/* Carousel */}
      <div className="relative">
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
                {video.eyebrow && (
                  <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-2">
                    {video.eyebrow}
                  </p>
                )}
                <h3 className="text-white text-xl md:text-2xl font-light">{video.title}</h3>
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

'use client'

import { useRef, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'

interface VideoItem {
  playbackId: string
  title?: string
}

export default function TestimonialVideoGallery({ videos }: { videos: VideoItem[] }) {
  const [index, setIndex] = useState(0)
  // Refs to the underlying mux-player elements so we can pause when sliding away.
  const playerRefs = useRef<Array<{ pause?: () => void } | null>>([])

  if (!videos || videos.length === 0) return null

  const goTo = (next: number) => {
    const clamped = (next + videos.length) % videos.length
    if (clamped === index) return
    // Pause the current video before leaving it so it doesn't keep playing off-screen.
    playerRefs.current[index]?.pause?.()
    setIndex(clamped)
  }

  const hasMultiple = videos.length > 1

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {videos.map((video, i) => (
            <div key={i} className="w-full flex-shrink-0">
              <MuxPlayer
                ref={(el) => {
                  playerRefs.current[i] = el as { pause?: () => void } | null
                }}
                playbackId={video.playbackId}
                streamType="on-demand"
                className="w-full aspect-video overflow-hidden"
              />
              {video.title && (
                <p className="mt-3 text-center text-sm text-white/60 font-light tracking-wide">
                  {video.title}
                </p>
              )}
            </div>
          ))}
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous video"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors duration-300 backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next video"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors duration-300 backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex justify-center gap-3 mt-6">
          {videos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to video ${i + 1}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? 'w-8 bg-white/90' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

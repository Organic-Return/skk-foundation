'use client'

import MuxPlayer from '@mux/mux-player-react'

interface VideoItem {
  playbackId: string
  title?: string
}

export default function TestimonialVideoGallery({ videos }: { videos: VideoItem[] }) {
  if (!videos || videos.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {videos.map((video, index) => (
        <div key={index}>
          <MuxPlayer
            playbackId={video.playbackId}
            streamType="on-demand"
            className="w-full aspect-video overflow-hidden"
          />
          {video.title && (
            <p className="mt-3 text-center text-sm text-[#6a6a6a] dark:text-gray-400 font-light tracking-wide">
              {video.title}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

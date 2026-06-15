'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Photo } from '@/lib/supabase/types'
import { photoUrl } from '@/lib/utils'
import { Lightbox } from './Lightbox'

interface MasonryGridProps {
  photos: Photo[]
  gallery: {
    title: string
    location: string | null
    shoot_date: string | null
    lens: string | null
  }
}

export function MasonryGrid({ photos, gallery }: MasonryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  return (
    <>
      <div
        className="masonry columns-2 md:columns-3 gap-[3px] px-0"
        style={{ columnGap: '3px' }}
      >
        {photos.map((photo, i) => {
          const src = photoUrl(photo.storage_path)
          const aspectRatio = photo.width / photo.height

          return (
            <motion.button
              key={photo.id}
              className="masonry-item block w-full mb-[3px] overflow-hidden relative group"
              style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
              onClick={() => openLightbox(i)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.6) }}
              aria-label={photo.caption ?? `Foto ${i + 1}`}
            >
              <Image
                src={src}
                alt={photo.caption ?? gallery.title}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                quality={80}
                className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.02]"
                loading={i < 6 ? 'eager' : 'lazy'}
              />
              {/* Subtle hover overlay */}
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-300" />
            </motion.button>
          )
        })}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          galleryMeta={gallery}
          onClose={closeLightbox}
        />
      )}
    </>
  )
}

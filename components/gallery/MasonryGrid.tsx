'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Asset } from '@/lib/supabase/types'
import { photoUrl } from '@/lib/utils'
import { Lightbox } from './Lightbox'

export interface GalleryMeta {
  title: string
  location: string | null
  shoot_date: string | null
  lens: string | null
}

interface MasonryGridProps {
  assets: Asset[]
  gallery: GalleryMeta
}

export function MasonryGrid({ assets, gallery }: MasonryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  return (
    <>
      <div className="masonry columns-2 md:columns-3 gap-[3px]" style={{ columnGap: '3px' }}>
        {assets.map((asset, i) => {
          const w = asset.width ?? 4
          const h = asset.height ?? 3
          return (
            <motion.button
              key={asset.id}
              className="masonry-item block w-full mb-[3px] overflow-hidden relative group"
              style={{ aspectRatio: `${w} / ${h}` }}
              onClick={() => openLightbox(i)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.6) }}
              aria-label={asset.caption ?? `Foto ${i + 1}`}
            >
              <Image
                src={photoUrl(asset.storage_path)}
                alt={asset.caption ?? gallery.title}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                quality={80}
                className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.02]"
                loading={i < 6 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-300" />
            </motion.button>
          )
        })}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          assets={assets}
          initialIndex={lightboxIndex}
          galleryMeta={gallery}
          onClose={closeLightbox}
        />
      )}
    </>
  )
}

'use client'

import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import type { Asset } from '@/lib/supabase/types'
import { photoUrl } from '@/lib/utils'
import type { GalleryMeta } from './MasonryGrid'

interface LightboxProps {
  assets: Asset[]
  initialIndex: number
  galleryMeta: GalleryMeta
  onClose: () => void
}

export function Lightbox({ assets, initialIndex, galleryMeta, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [direction, setDirection] = useState(0)

  const asset = assets[index]
  const aw = asset.width ?? 4
  const ah = asset.height ?? 3
  const hasPrev = index > 0
  const hasNext = index < assets.length - 1

  const prev = useCallback(() => {
    if (!hasPrev) return
    setDirection(-1)
    setIndex(i => i - 1)
  }, [hasPrev])

  const next = useCallback(() => {
    if (!hasNext) return
    setDirection(1)
    setIndex(i => i + 1)
  }, [hasNext])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  // Prevent body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Touch/swipe
  const [touchStart, setTouchStart] = useState<number | null>(null)
  function onTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX)
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const delta = touchStart - e.changedTouches[0].clientX
    if (delta > 50) next()
    else if (delta < -50) prev()
    setTouchStart(null)
  }

  const src = photoUrl(asset.storage_path)

  // Neighbor preloading for instant prev/next.
  useEffect(() => {
    ;[index - 1, index + 1].forEach((i) => {
      const a = assets[i]
      if (!a) return
      const img = new window.Image()
      img.src = photoUrl(a.storage_path)
    })
  }, [index, assets])

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed inset-0 z-50 bg-overlay flex flex-col"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Top bar */}
        <div className="flex-none flex items-center justify-between px-6 py-4">
          <span className="font-display text-sm text-white/40 italic">
            {galleryMeta.title}
          </span>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-white/40 hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Image area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden px-12 md:px-20">
          {/* Prev arrow */}
          <button
            onClick={prev}
            disabled={!hasPrev}
            aria-label="Anterior"
            className="absolute left-3 md:left-6 z-10 w-10 h-10 flex items-center justify-center text-white/30 hover:text-white disabled:opacity-0 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 3l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={asset.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <div
                className="relative"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  aspectRatio: `${aw} / ${ah}`,
                  width: aw > ah ? '100%' : 'auto',
                  height: aw <= ah ? '100%' : 'auto',
                }}
              >
                <Image
                  src={src}
                  alt={asset.caption ?? galleryMeta.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 85vw"
                  quality={90}
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Next arrow */}
          <button
            onClick={next}
            disabled={!hasNext}
            aria-label="Siguiente"
            className="absolute right-3 md:right-6 z-10 w-10 h-10 flex items-center justify-center text-white/30 hover:text-white disabled:opacity-0 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 3l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Bottom bar */}
        <div className="flex-none flex items-end justify-between px-6 py-5 gap-4">
          <div className="space-y-0.5">
            {asset.caption && (
              <p className="text-xs text-white/60">{asset.caption}</p>
            )}
            <p className="text-2xs text-white/25 uppercase tracking-widest">
              {[galleryMeta.location, galleryMeta.lens].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className="text-2xs text-white/30 tracking-widest tabular-nums flex-none">
            {index + 1} / {assets.length}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { photoUrl, shootMeta } from '@/lib/utils'
import type { Gallery, Asset } from '@/lib/supabase/types'

interface Props {
  gallery: Gallery
  clientName: string
  clientSlug: string
  initialAssets: Asset[]
  generateShareToken: (id: string) => Promise<string>
}

// Reads natural dimensions of an image File in the browser.
function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export function GalleryEditor({ gallery, clientName, clientSlug, initialAssets, generateShareToken }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [published, setPublished] = useState(gallery.published)
  const [coverId, setCoverId] = useState<string | null>(gallery.cover_asset_id)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [dragOver, setDragOver] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>((gallery as Gallery & { share_token?: string }).share_token ?? null)
  const [shareCopied, setShareCopied] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (images.length === 0) return

    setUploading(true)
    setProgress({ done: 0, total: images.length })

    let order = assets.length > 0 ? Math.max(...assets.map((a) => a.display_order)) + 1 : 1
    const inserted: Asset[] = []

    for (const file of images) {
      const { width, height } = await readDimensions(file)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${clientSlug}/${gallery.slug}/${crypto.randomUUID()}.${ext}`

      const { error: upErr } = await supabase.storage.from('images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })
      if (upErr) {
        setProgress((p) => ({ ...p, done: p.done + 1 }))
        continue
      }

      const { data: row } = await supabase
        .from('assets')
        .insert({
          gallery_id: gallery.id,
          client_id: gallery.client_id,
          type: 'image',
          bucket: 'images',
          storage_path: path,
          width,
          height,
          display_order: order++,
        })
        .select('*')
        .single()

      if (row) inserted.push(row as Asset)
      setProgress((p) => ({ ...p, done: p.done + 1 }))
    }

    setAssets((prev) => [...prev, ...inserted])
    setUploading(false)
    router.refresh()
  }, [assets, clientSlug, gallery.id, gallery.client_id, gallery.slug, supabase, router])

  async function togglePublish() {
    const next = !published
    setPublished(next)
    await supabase.from('galleries').update({ published: next }).eq('id', gallery.id)
    router.refresh()
  }

  async function setCover(assetId: string) {
    setCoverId(assetId)
    await supabase.from('galleries').update({ cover_asset_id: assetId }).eq('id', gallery.id)
  }

  async function deleteAsset(asset: Asset) {
    setAssets((prev) => prev.filter((a) => a.id !== asset.id))
    await supabase.storage.from(asset.bucket).remove([asset.storage_path])
    await supabase.from('assets').delete().eq('id', asset.id)
    router.refresh()
  }

  async function persistOrder(next: Asset[]) {
    await Promise.all(
      next.map((a, i) => supabase.from('assets').update({ display_order: i + 1 }).eq('id', a.id)),
    )
    router.refresh()
  }

  async function handleShare() {
    const token = await generateShareToken(gallery.id)
    setShareToken(token)
    const url = `${window.location.origin}/preview/${token}`
    await navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2500)
  }

  async function deleteGallery() {
    const ok = window.confirm(`¿Borrar la galería "${gallery.title}" y sus ${assets.length} fotos? Esta acción no se puede deshacer.`)
    if (!ok) return

    const paths = assets.map((a) => a.storage_path)
    if (paths.length > 0) await supabase.storage.from('images').remove(paths)
    await supabase.from('assets').delete().eq('gallery_id', gallery.id)
    await supabase.from('galleries').delete().eq('id', gallery.id)
    router.push('/studio/galleries')
    router.refresh()
  }

  function onDrop(targetIndex: number) {
    const from = dragIndex.current
    dragIndex.current = null
    setDragOver(false)
    if (from === null || from === targetIndex) return
    const next = [...assets]
    const [moved] = next.splice(from, 1)
    next.splice(targetIndex, 0, moved)
    setAssets(next)
    persistOrder(next)
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <Link href="/studio/galleries" className="text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors">
            ← Galerías
          </Link>
          <h1 className="mt-3 font-display text-4xl text-ink font-light">{gallery.title}</h1>
          <p className="mt-1 text-2xs text-muted uppercase tracking-widest">
            {clientName} · {assets.length} fotos · {shootMeta(gallery) || 'sin fecha'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-none">
          <button
            onClick={handleShare}
            className="px-4 py-2.5 border border-border text-ink text-2xs uppercase tracking-widest hover:border-ink transition-colors"
          >
            {shareCopied ? '✓ Link copiado' : shareToken ? 'Copiar link' : 'Compartir'}
          </button>
          {published && clientSlug && (
            <Link href={`/c/${clientSlug}/g/${gallery.slug}`} target="_blank" className="px-4 py-2.5 border border-border text-ink text-2xs uppercase tracking-widest hover:border-ink transition-colors">
              Ver como cliente
            </Link>
          )}
          <button
            onClick={togglePublish}
            className={['px-4 py-2.5 text-2xs uppercase tracking-widest transition-colors', published ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-ink text-canvas hover:bg-ink/90'].join(' ')}
          >
            {published ? 'Publicada' : 'Publicar'}
          </button>
          <button
            onClick={deleteGallery}
            title="Borrar galería"
            className="px-4 py-2.5 border border-border text-muted text-2xs uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors"
          >
            Borrar
          </button>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
        }}
        onClick={() => fileInput.current?.click()}
        className={['mb-10 border border-dashed rounded-sm py-14 text-center cursor-pointer transition-colors', dragOver ? 'border-ink bg-ink/[0.03]' : 'border-border hover:border-muted'].join(' ')}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }}
        />
        {uploading ? (
          <div className="space-y-2">
            <p className="text-sm text-ink">Subiendo {progress.done} / {progress.total}…</p>
            <div className="mx-auto w-48 h-0.5 bg-border overflow-hidden">
              <div className="h-full bg-ink transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink">Arrastra fotos aquí o haz clic para elegir</p>
            <p className="mt-1 text-2xs text-muted uppercase tracking-widest">Subida múltiple · dimensiones automáticas</p>
          </>
        )}
      </div>

      {/* Asset grid */}
      {assets.length === 0 ? (
        <p className="text-muted text-sm">Aún no hay fotos. Sube las primeras arriba.</p>
      ) : (
        <>
          <p className="mb-4 text-2xs uppercase tracking-widest text-muted">Arrastra para reordenar · clic en ★ para portada</p>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {assets.map((asset, i) => (
              <div
                key={asset.id}
                draggable
                onDragStart={() => { dragIndex.current = i }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className="relative aspect-square bg-border overflow-hidden group cursor-move"
              >
                <Image src={photoUrl(asset.storage_path)} alt="" fill sizes="20vw" className="object-cover" />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors" />
                <button
                  onClick={(e) => { e.stopPropagation(); setCover(asset.id) }}
                  title="Portada"
                  className={['absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center rounded-full text-xs transition-colors', coverId === asset.id ? 'bg-white text-ink' : 'bg-ink/40 text-white/80 opacity-0 group-hover:opacity-100'].join(' ')}
                >
                  ★
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAsset(asset) }}
                  title="Eliminar"
                  className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-ink/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-colors text-xs"
                >
                  ✕
                </button>
                <span className="absolute bottom-1.5 left-1.5 text-2xs text-white/70 tabular-nums">{i + 1}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}

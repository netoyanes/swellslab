import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { shootMeta } from '@/lib/utils'
import type { Client, Gallery, Asset } from '@/lib/supabase/types'

type GalleryRow = Gallery & { assets: Asset[] }

export async function generateMetadata({ params }: { params: Promise<{ gallerySlug: string }> }): Promise<Metadata> {
  const { gallerySlug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('galleries').select('title').eq('slug', gallerySlug).single()
  return { title: (data as { title: string } | null)?.title ?? 'Galería' }
}

export default async function GalleryView({ params }: { params: Promise<{ clientSlug: string; gallerySlug: string }> }) {
  const { clientSlug, gallerySlug } = await params
  const supabase = await createClient()

  const { data: clientData } = await supabase.from('clients').select('id').eq('slug', clientSlug).single()
  if (!clientData) notFound()
  const client = clientData as Pick<Client, 'id'>

  const { data } = await supabase
    .from('galleries')
    .select('id, title, slug, shoot_date, location, lens, description, client_id, published, assets!assets_gallery_id_fkey(id, gallery_id, client_id, type, bucket, storage_path, width, height, duration, caption, downloadable, display_order, created_at)')
    .eq('client_id', client.id)
    .eq('slug', gallerySlug)
    .eq('published', true)
    .single()

  if (!data) notFound()
  const gallery = data as unknown as GalleryRow

  const assets = [...(gallery.assets ?? [])].sort((a, b) => a.display_order - b.display_order)
  const galleryMeta = {
    title: gallery.title,
    location: gallery.location,
    shoot_date: gallery.shoot_date,
    lens: gallery.lens,
  }

  return (
    <main>
      <div className="max-w-screen-xl mx-auto px-6 pt-14 pb-10">
        <div className="max-w-xl">
          <p className="text-2xs uppercase tracking-widest text-muted mb-3">{shootMeta(gallery)}</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink font-light leading-none text-balance">{gallery.title}</h1>
          {gallery.description && <p className="mt-5 text-sm text-muted leading-relaxed max-w-sm">{gallery.description}</p>}
        </div>
      </div>

      {assets.length > 0 ? (
        <MasonryGrid assets={assets} gallery={galleryMeta} />
      ) : (
        <div className="px-6 py-16 text-muted text-sm">Las fotos llegarán pronto.</div>
      )}

      <div className="h-24" />
    </main>
  )
}

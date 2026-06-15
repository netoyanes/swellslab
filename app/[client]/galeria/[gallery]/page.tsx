import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { shootMeta } from '@/lib/utils'

interface PageProps {
  params: Promise<{ client: string; gallery: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gallery: gallerySlug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('galleries')
    .select('title')
    .eq('slug', gallerySlug)
    .single()
  return { title: data?.title ?? 'Galería' }
}

export default async function GalleryPage({ params }: PageProps) {
  const { client: clientSlug, gallery: gallerySlug } = await params
  const supabase = await createClient()

  const { data: clientData } = await supabase
    .from('clients')
    .select('id')
    .eq('slug', clientSlug)
    .single()

  if (!clientData) notFound()
  const client = clientData as { id: string }

  const { data: gallery } = await supabase
    .from('galleries')
    .select(`
      id, title, slug, shoot_date, location, lens, description, published,
      photos(id, storage_path, width, height, caption, display_order)
    `)
    .eq('client_id', client.id)
    .eq('slug', gallerySlug)
    .eq('published', true)
    .single()

  if (!gallery) notFound()

  const photos = [...(gallery.photos ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  )

  const galleryMeta = {
    title: gallery.title,
    location: gallery.location,
    shoot_date: gallery.shoot_date,
    lens: gallery.lens,
  }

  return (
    <main>
      {/* Gallery header */}
      <div className="max-w-screen-xl mx-auto px-6 pt-14 pb-10">
        <div className="max-w-xl">
          <p className="text-2xs uppercase tracking-widest text-muted mb-3">
            {shootMeta(gallery)}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink font-light leading-none text-balance">
            {gallery.title}
          </h1>
          {gallery.description && (
            <p className="mt-5 text-sm text-muted leading-relaxed max-w-sm">
              {gallery.description}
            </p>
          )}
        </div>
      </div>

      {/* Masonry grid — edge to edge */}
      {photos.length > 0 ? (
        <MasonryGrid photos={photos} gallery={galleryMeta} />
      ) : (
        <div className="px-6 py-16 text-muted text-sm">
          Las fotos llegarán pronto.
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-24" />
    </main>
  )
}

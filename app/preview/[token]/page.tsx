import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { shootMeta } from '@/lib/utils'
import type { Gallery, Asset } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type GalleryRow = Gallery & { assets: Asset[] }

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('galleries')
    .select('id, title, slug, shoot_date, location, lens, description, client_id, assets!assets_gallery_id_fkey(id, gallery_id, client_id, type, bucket, storage_path, width, height, duration, caption, downloadable, display_order, created_at)')
    .eq('share_token', token)
    .single()

  if (!data) notFound()
  const gallery = data as unknown as GalleryRow
  const assets = [...(gallery.assets ?? [])].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="min-h-screen bg-canvas">
      {/* Minimal header */}
      <header className="fixed top-0 inset-x-0 z-40 h-12 bg-canvas/90 backdrop-blur-sm border-b border-border flex items-center px-6">
        <span className="font-mono text-sm tracking-[0.2em] uppercase" style={{ color: '#333232' }}>Swells Lab</span>
        <span className="ml-3 text-border">·</span>
        <span className="ml-3 font-sans text-xs text-muted uppercase tracking-widest">Preview</span>
      </header>

      <main className="pt-12">
        <div className="max-w-screen-xl mx-auto px-6 pt-10 pb-8">
          <div className="max-w-xl">
            <p className="text-2xs uppercase tracking-widest text-muted mb-3">{shootMeta(gallery)}</p>
            <h1 className="font-display text-4xl md:text-5xl text-ink font-light leading-none">{gallery.title}</h1>
            {gallery.description && (
              <p className="mt-4 text-sm text-muted leading-relaxed max-w-sm">{gallery.description}</p>
            )}
          </div>
        </div>

        {assets.length > 0 ? (
          <MasonryGrid assets={assets} gallery={{ title: gallery.title, location: gallery.location, shoot_date: gallery.shoot_date, lens: gallery.lens }} />
        ) : (
          <div className="px-6 py-16 text-muted text-sm">Las fotos llegarán pronto.</div>
        )}

        <div className="h-16 flex items-center justify-center">
          <p className="text-2xs text-muted/40 uppercase tracking-widest">Vista previa · Swells Lab</p>
        </div>
      </main>
    </div>
  )
}

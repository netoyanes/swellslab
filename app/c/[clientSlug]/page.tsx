import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { photoUrl, shootMeta } from '@/lib/utils'
import type { Client, Gallery, Asset } from '@/lib/supabase/types'

type GalleryRow = Gallery & { assets: Asset[] }

export default async function ClientHome({ params }: { params: Promise<{ clientSlug: string }> }) {
  const { clientSlug } = await params
  const supabase = await createClient()

  const { data: clientData } = await supabase
    .from('clients').select('*').eq('slug', clientSlug).single()
  if (!clientData) notFound()
  const client = clientData as Client

  const { data } = await supabase
    .from('galleries')
    .select('id, title, slug, shoot_date, location, lens, description, client_id, project_id, cover_asset_id, published, display_order, created_at, assets!assets_gallery_id_fkey(id, storage_path, width, height, display_order)')
    .eq('client_id', client.id)
    .eq('published', true)
    .order('display_order', { ascending: true })

  const galleries = (data ?? []) as unknown as GalleryRow[]
  const enriched = galleries.map((g) => {
    const sorted = [...(g.assets ?? [])].sort((a, b) => a.display_order - b.display_order)
    return { ...g, cover: sorted[0] ?? null, count: sorted.length }
  })

  const { data: brandData } = await supabase
    .from('brands')
    .select('id, name, slug, tagline, accent_color')
    .eq('client_id', client.id)
    .eq('client_visible', true)
    .eq('active', true)
    .order('display_order')
  const brands = (brandData ?? []) as { id: string; name: string; slug: string; tagline: string | null; accent_color: string | null }[]

  return (
    <main className="max-w-screen-xl mx-auto px-6 py-16 md:py-20">
      <div className="mb-16">
        <p className="text-2xs uppercase tracking-widest text-muted mb-3">Portal</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink font-light">{client.name}</h1>
      </div>

      {brands.length > 0 && (
        <section className="mb-16">
          <p className="text-2xs uppercase tracking-widest text-muted mb-5">Marcas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {brands.map((b) => (
              <Link key={b.id} href={`/c/${clientSlug}/marca/${b.slug}`} className="bg-canvas p-6 group hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full flex-none border border-border" style={{ background: b.accent_color || '#E8E7E3' }} />
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate group-hover:opacity-60 transition">{b.name}</p>
                    {b.tagline && <p className="text-2xs text-muted truncate">{b.tagline}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-2xs uppercase tracking-widest text-muted mb-5">Galerías</p>

      {enriched.length === 0 ? (
        <p className="text-muted text-sm">No hay galerías publicadas aún.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {enriched.map((g) => (
            <Link key={g.id} href={`/c/${clientSlug}/g/${g.slug}`} className="group bg-canvas block overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden bg-border">
                {g.cover ? (
                  <Image
                    src={photoUrl(g.cover.storage_path)}
                    alt={g.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={75}
                    className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-border" />
                )}
              </div>
              <div className="px-6 py-5">
                <h2 className="font-display text-2xl text-ink font-light group-hover:opacity-70 transition-opacity">{g.title}</h2>
                <p className="mt-1 text-2xs text-muted tracking-wide">{shootMeta(g)}</p>
                {g.description && <p className="mt-3 text-sm text-muted/80 leading-relaxed line-clamp-2">{g.description}</p>}
                <p className="mt-3 text-2xs uppercase tracking-widest text-muted">{g.count} fotos</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

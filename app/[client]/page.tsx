import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { photoUrl, shootMeta } from '@/lib/utils'

interface PageProps {
  params: Promise<{ client: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { client: slug } = await params
  return { title: slug.toUpperCase() }
}

export default async function DashboardPage({ params }: PageProps) {
  const { client: slug } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!client) notFound()

  const { data: galleries } = await supabase
    .from('galleries')
    .select(`
      id, title, slug, shoot_date, location, lens, description,
      photos(id, storage_path, width, height, display_order)
    `)
    .eq('client_id', client.id)
    .eq('published', true)
    .order('display_order', { ascending: true })

  const enriched = (galleries ?? []).map(g => {
    const sorted = [...(g.photos ?? [])].sort((a, b) => a.display_order - b.display_order)
    const cover = sorted[0]
    return { ...g, photos: sorted, cover }
  })

  return (
    <main className="max-w-screen-xl mx-auto px-6 py-16 md:py-20">
      {/* Header */}
      <div className="mb-16">
        <p className="text-2xs uppercase tracking-widest text-muted mb-3">
          Galerías
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-ink font-light">
          {client.name}
        </h1>
      </div>

      {enriched.length === 0 ? (
        <p className="text-muted text-sm">No hay galerías publicadas aún.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {enriched.map((gallery) => (
            <Link
              key={gallery.id}
              href={`/${slug}/galeria/${gallery.slug}`}
              className="group bg-canvas block overflow-hidden"
            >
              {/* Cover image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-border">
                {gallery.cover ? (
                  <Image
                    src={photoUrl(gallery.cover.storage_path)}
                    alt={gallery.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={75}
                    className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-border" />
                )}
              </div>

              {/* Info */}
              <div className="px-6 py-5">
                <h2 className="font-display text-2xl text-ink font-light group-hover:opacity-70 transition-opacity">
                  {gallery.title}
                </h2>
                <p className="mt-1 text-2xs text-muted tracking-wide">
                  {shootMeta(gallery)}
                </p>
                {gallery.description && (
                  <p className="mt-3 text-sm text-muted/80 leading-relaxed line-clamp-2">
                    {gallery.description}
                  </p>
                )}
                <p className="mt-3 text-2xs uppercase tracking-widest text-muted">
                  {gallery.photos.length} fotos
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

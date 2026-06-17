import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { imageUrl, objectUrl } from '@/lib/utils'
import type { Client, Brand, BrandAsset, DesignRef } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function ClientBrandPage({ params }: { params: Promise<{ clientSlug: string; brandSlug: string }> }) {
  const { clientSlug, brandSlug } = await params
  const supabase = await createClient()

  const { data: cData } = await supabase.from('clients').select('id, name').eq('slug', clientSlug).single()
  if (!cData) notFound()
  const client = cData as Pick<Client, 'id' | 'name'>

  const { data: bData } = await supabase
    .from('brands')
    .select('*')
    .eq('client_id', client.id)
    .eq('slug', brandSlug)
    .eq('client_visible', true)
    .single()
  if (!bData) notFound()
  const brand = bData as Brand

  const [{ data: assetData }, { data: refData }] = await Promise.all([
    supabase.from('brand_assets').select('*').eq('brand_id', brand.id).eq('client_visible', true).order('display_order'),
    supabase.from('design_refs').select('*').eq('brand_id', brand.id).eq('client_visible', true).order('display_order'),
  ])
  const assets = (assetData ?? []) as BrandAsset[]
  const refs = (refData ?? []) as DesignRef[]

  const colors = refs.filter((r) => r.kind === 'color')
  const fonts = refs.filter((r) => r.kind === 'font')
  const links = refs.filter((r) => ['figma', 'drive', 'link'].includes(r.kind))

  return (
    <main className="max-w-screen-xl mx-auto px-6 py-16">
      <Link href={`/c/${clientSlug}`} className="text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors">← {client.name}</Link>
      <div className="mt-4 flex items-center gap-4 mb-14">
        <span className="w-12 h-12 rounded-full flex-none border border-border" style={{ background: brand.accent_color || '#E8E7E3' }} />
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-ink font-light leading-none">{brand.name}</h1>
          {brand.tagline && <p className="mt-1.5 text-sm text-muted">{brand.tagline}</p>}
        </div>
      </div>

      {colors.length > 0 && (
        <section className="mb-14">
          <p className="text-2xs uppercase tracking-widest text-muted mb-5">Colores</p>
          <div className="flex flex-wrap gap-5">
            {colors.map((c) => (
              <div key={c.id}>
                <div className="w-24 h-24 rounded-sm border border-border" style={{ background: c.value ?? '#fff' }} />
                <p className="mt-2 text-2xs text-ink">{c.label}</p>
                <p className="text-2xs text-muted font-mono uppercase">{c.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {fonts.length > 0 && (
        <section className="mb-14">
          <p className="text-2xs uppercase tracking-widest text-muted mb-5">Tipografías</p>
          <div className="space-y-4">
            {fonts.map((f) => (
              <div key={f.id} className="border-b border-border pb-4">
                <p className="text-3xl text-ink" style={{ fontFamily: f.value ?? 'inherit' }}>{f.value}</p>
                <p className="text-2xs uppercase tracking-widest text-muted">{f.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {assets.length > 0 && (
        <section className="mb-14">
          <p className="text-2xs uppercase tracking-widest text-muted mb-5">Assets</p>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {assets.map((a) => {
              const isImg = a.bucket === 'images'
              const url = isImg ? imageUrl(a.storage_path) : objectUrl(a.bucket, a.storage_path)
              return (
                <a key={a.id} href={a.downloadable ? url : undefined} target="_blank" rel="noreferrer" className="group block">
                  <div className="aspect-square bg-surface border border-border overflow-hidden flex items-center justify-center">
                    {isImg ? (
                      <Image src={url} alt={a.label ?? ''} width={200} height={200} className="object-contain w-full h-full p-2" />
                    ) : (
                      <span className="text-2xs uppercase tracking-widest text-muted px-2 text-center">{(a.mime_type?.split('/')[1] || 'file').slice(0, 8)}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-2xs text-muted truncate">{a.label}</p>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {links.length > 0 && (
        <section className="mb-14">
          <p className="text-2xs uppercase tracking-widest text-muted mb-5">Enlaces</p>
          <ul className="divide-y divide-border border-y border-border">
            {links.map((l) => (
              <li key={l.id} className="py-4">
                <a href={l.url ?? '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-ink hover:opacity-60 transition">
                  <span className="text-2xs uppercase tracking-widest px-2 py-0.5 rounded-full bg-border text-muted">{l.kind}</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {refs.length === 0 && assets.length === 0 && (
        <p className="text-muted text-sm">Aún no hay material compartido para esta marca.</p>
      )}
    </main>
  )
}

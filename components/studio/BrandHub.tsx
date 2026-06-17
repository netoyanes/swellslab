'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { imageUrl, objectUrl } from '@/lib/utils'
import type { Brand, BrandAsset, DesignRef, DesignRefKind, Gallery } from '@/lib/supabase/types'

interface Props {
  brand: Brand
  clientName: string
  clientSlug: string
  initialAssets: BrandAsset[]
  initialRefs: DesignRef[]
  galleries: Pick<Gallery, 'id' | 'title' | 'slug' | 'published' | 'brand_id'>[]
}

type Tab = 'assets' | 'design' | 'galleries'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']

export function BrandHub({ brand, clientName, clientSlug, initialAssets, initialRefs, galleries }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('assets')

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <Link href="/studio/brands" className="text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors">
            ← Marcas
          </Link>
          <div className="mt-3 flex items-center gap-4">
            <span className="w-12 h-12 rounded-full flex-none border border-border" style={{ background: brand.accent_color || '#E8E7E3' }} />
            <div>
              <h1 className="font-display text-4xl text-ink font-light leading-none">{brand.name}</h1>
              <p className="mt-1.5 text-2xs text-muted uppercase tracking-widest">{clientName}{brand.tagline ? ` · ${brand.tagline}` : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-7 border-b border-border mb-10">
        {([['assets', 'Assets'], ['design', 'Design System'], ['galleries', 'Galerías']] as [Tab, string][]).map(([key, lbl]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={['pb-3 -mb-px text-2xs uppercase tracking-widest border-b transition-colors', tab === key ? 'text-ink border-ink' : 'text-muted border-transparent hover:text-ink'].join(' ')}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'assets' && <AssetsTab brand={brand} supabase={supabase} router={router} initial={initialAssets} />}
      {tab === 'design' && <DesignTab brand={brand} supabase={supabase} router={router} initial={initialRefs} />}
      {tab === 'galleries' && <GalleriesTab brand={brand} clientSlug={clientSlug} galleries={galleries} />}
    </main>
  )
}

/* ----------------------------- Assets ----------------------------- */
function AssetsTab({ brand, supabase, router, initial }: { brand: Brand; supabase: ReturnType<typeof createClient>; router: ReturnType<typeof useRouter>; initial: BrandAsset[] }) {
  const [assets, setAssets] = useState<BrandAsset[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [dragOver, setDragOver] = useState(false)
  const [category, setCategory] = useState('Logos')
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    setUploading(true)
    setProgress({ done: 0, total: list.length })
    const inserted: BrandAsset[] = []
    let order = assets.length

    for (const file of list) {
      const isImage = IMAGE_TYPES.includes(file.type)
      const bucket = isImage ? 'images' : 'documents'
      const kind: BrandAsset['kind'] = isImage ? (category.toLowerCase().includes('logo') ? 'logo' : 'photo') : 'file'
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const path = `brands/${brand.id}/${crypto.randomUUID()}.${ext}`

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
      if (upErr) { setProgress((p) => ({ ...p, done: p.done + 1 })); continue }

      const { data: row } = await supabase.from('brand_assets').insert({
        brand_id: brand.id,
        client_id: brand.client_id,
        kind,
        label: file.name,
        bucket,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        category,
        display_order: order++,
      }).select('*').single()

      if (row) inserted.push(row as BrandAsset)
      setProgress((p) => ({ ...p, done: p.done + 1 }))
    }

    setAssets((prev) => [...prev, ...inserted])
    setUploading(false)
    router.refresh()
  }, [assets.length, brand.id, brand.client_id, category, supabase, router])

  async function deleteAsset(a: BrandAsset) {
    setAssets((prev) => prev.filter((x) => x.id !== a.id))
    await supabase.storage.from(a.bucket).remove([a.storage_path])
    await supabase.from('brand_assets').delete().eq('id', a.id)
    router.refresh()
  }

  const categories = ['Logos', 'Fotos', 'Brandbook', 'Plantillas', 'Recursos', 'Otro']
  const grouped = categories.map((c) => ({ category: c, items: assets.filter((a) => (a.category ?? 'Otro') === c) })).filter((g) => g.items.length > 0)

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-2xs uppercase tracking-widest text-muted">Categoría:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-xs bg-transparent border-b border-border pb-1 outline-none focus:border-ink">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files) }}
        onClick={() => fileInput.current?.click()}
        className={['mb-10 border border-dashed rounded-sm py-12 text-center cursor-pointer transition-colors', dragOver ? 'border-ink bg-ink/[0.03]' : 'border-border hover:border-muted'].join(' ')}
      >
        <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
        {uploading ? (
          <p className="text-sm text-ink">Subiendo {progress.done} / {progress.total}…</p>
        ) : (
          <>
            <p className="text-sm text-ink">Arrastra archivos a «{category}» o haz clic</p>
            <p className="mt-1 text-2xs text-muted uppercase tracking-widest">Logos · fotos · PDFs · cualquier archivo</p>
          </>
        )}
      </div>

      {assets.length === 0 ? (
        <p className="text-muted text-sm">Aún no hay assets. Sube los primeros arriba.</p>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ category: cat, items }) => (
            <section key={cat}>
              <p className="text-2xs uppercase tracking-widest text-muted mb-4">{cat} · {items.length}</p>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {items.map((a) => {
                  const isImg = a.bucket === 'images'
                  const url = isImg ? imageUrl(a.storage_path) : objectUrl(a.bucket, a.storage_path)
                  return (
                    <div key={a.id} className="group relative">
                      <div className="aspect-square bg-surface border border-border overflow-hidden flex items-center justify-center">
                        {isImg ? (
                          <Image src={url} alt={a.label ?? ''} width={200} height={200} className="object-contain w-full h-full p-2" />
                        ) : (
                          <span className="text-2xs uppercase tracking-widest text-muted px-2 text-center">{(a.mime_type?.split('/')[1] || 'file').slice(0, 8)}</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-2xs text-muted truncate">{a.label}</p>
                      <button onClick={() => deleteAsset(a)} title="Eliminar" className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-ink/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition text-xs">✕</button>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------- Design System -------------------------- */
function DesignTab({ brand, supabase, router, initial }: { brand: Brand; supabase: ReturnType<typeof createClient>; router: ReturnType<typeof useRouter>; initial: DesignRef[] }) {
  const [refs, setRefs] = useState<DesignRef[]>(initial)
  const [kind, setKind] = useState<DesignRefKind>('color')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('#1C1C1A')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function add() {
    if (!label) return
    setSaving(true)
    const { data } = await supabase.from('design_refs').insert({
      brand_id: brand.id,
      kind,
      label,
      value: (kind === 'color' || kind === 'font') ? value : null,
      url: (kind === 'figma' || kind === 'drive' || kind === 'link') ? url : null,
      display_order: refs.length,
    }).select('*').single()
    if (data) setRefs((prev) => [...prev, data as DesignRef])
    setLabel(''); setUrl(''); setValue('#1C1C1A'); setSaving(false)
    router.refresh()
  }

  async function remove(id: string) {
    setRefs((prev) => prev.filter((r) => r.id !== id))
    await supabase.from('design_refs').delete().eq('id', id)
    router.refresh()
  }

  const colors = refs.filter((r) => r.kind === 'color')
  const fonts = refs.filter((r) => r.kind === 'font')
  const links = refs.filter((r) => ['figma', 'drive', 'link'].includes(r.kind))
  const field = 'bg-transparent border-b border-border pb-1.5 text-sm text-ink placeholder:text-muted/50 outline-none focus:border-ink transition-colors'

  return (
    <div className="space-y-12">
      {/* Add form */}
      <div className="border border-border p-5 rounded-sm">
        <p className="text-2xs uppercase tracking-widest text-muted mb-4">Agregar al design system</p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-2xs uppercase tracking-widest text-muted mb-1.5">Tipo</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as DesignRefKind)} className={field}>
              <option value="color">Color</option>
              <option value="font">Tipografía</option>
              <option value="figma">Figma</option>
              <option value="drive">Drive</option>
              <option value="link">Link</option>
            </select>
          </div>
          <div>
            <label className="block text-2xs uppercase tracking-widest text-muted mb-1.5">Nombre</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={kind === 'color' ? 'Primario' : kind === 'font' ? 'Display' : 'Brandbook'} className={field} />
          </div>
          {(kind === 'color') && (
            <div className="flex items-center gap-2">
              <input type="color" value={value} onChange={(e) => setValue(e.target.value)} className="w-9 h-9 rounded border border-border cursor-pointer" />
              <input value={value} onChange={(e) => setValue(e.target.value)} className={`${field} w-28`} />
            </div>
          )}
          {(kind === 'font') && (
            <div>
              <label className="block text-2xs uppercase tracking-widest text-muted mb-1.5">Familia</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="IBM Plex Sans" className={field} />
            </div>
          )}
          {(kind === 'figma' || kind === 'drive' || kind === 'link') && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-2xs uppercase tracking-widest text-muted mb-1.5">URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={`${field} w-full`} />
            </div>
          )}
          <button onClick={add} disabled={saving || !label} className="px-4 py-2 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-40 transition-colors">Agregar</button>
        </div>
      </div>

      {/* Colors */}
      {colors.length > 0 && (
        <section>
          <p className="text-2xs uppercase tracking-widest text-muted mb-4">Colores</p>
          <div className="flex flex-wrap gap-4">
            {colors.map((c) => (
              <div key={c.id} className="group relative">
                <button
                  onClick={() => navigator.clipboard.writeText(c.value ?? '')}
                  title="Copiar HEX"
                  className="w-20 h-20 rounded-sm border border-border block"
                  style={{ background: c.value ?? '#fff' }}
                />
                <p className="mt-1.5 text-2xs text-ink">{c.label}</p>
                <p className="text-2xs text-muted font-mono uppercase">{c.value}</p>
                <button onClick={() => remove(c.id)} className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-ink/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition text-2xs">✕</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fonts */}
      {fonts.length > 0 && (
        <section>
          <p className="text-2xs uppercase tracking-widest text-muted mb-4">Tipografías</p>
          <div className="space-y-3">
            {fonts.map((f) => (
              <div key={f.id} className="group flex items-baseline justify-between border-b border-border pb-3">
                <div>
                  <p className="text-2xl text-ink" style={{ fontFamily: f.value ?? 'inherit' }}>{f.value}</p>
                  <p className="text-2xs uppercase tracking-widest text-muted">{f.label}</p>
                </div>
                <button onClick={() => remove(f.id)} className="text-2xs text-muted opacity-0 group-hover:opacity-100 hover:text-red-500 transition">Eliminar</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Links (Figma / Drive / web) */}
      {links.length > 0 && (
        <section>
          <p className="text-2xs uppercase tracking-widest text-muted mb-4">Enlaces</p>
          <ul className="divide-y divide-border border-y border-border">
            {links.map((l) => (
              <li key={l.id} className="group flex items-center justify-between py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xs uppercase tracking-widest px-2 py-0.5 rounded-full bg-border text-muted flex-none">{l.kind}</span>
                  <a href={l.url ?? '#'} target="_blank" rel="noreferrer" className="text-sm text-ink hover:opacity-60 transition truncate">{l.label}</a>
                </div>
                <button onClick={() => remove(l.id)} className="text-2xs text-muted opacity-0 group-hover:opacity-100 hover:text-red-500 transition flex-none ml-4">Eliminar</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {refs.length === 0 && <p className="text-muted text-sm">Aún no hay elementos. Agrega colores, tipografías y enlaces arriba.</p>}
    </div>
  )
}

/* ----------------------------- Galerías ----------------------------- */
function GalleriesTab({ brand, clientSlug, galleries }: { brand: Brand; clientSlug: string; galleries: Pick<Gallery, 'id' | 'title' | 'slug' | 'published' | 'brand_id'>[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-2xs uppercase tracking-widest text-muted">Galerías de esta marca</p>
        <Link href={`/studio/galleries/new?brand=${brand.id}`} className="px-4 py-2 border border-border text-ink text-2xs uppercase tracking-widest hover:border-ink transition-colors">
          Nueva galería
        </Link>
      </div>
      {galleries.length === 0 ? (
        <p className="text-muted text-sm">Esta marca aún no tiene galerías.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {galleries.map((g) => (
            <li key={g.id}>
              <Link href={`/studio/galleries/${g.id}`} className="flex items-center justify-between py-4 group">
                <span className="text-sm text-ink group-hover:opacity-60 transition">{g.title}</span>
                <span className={['text-2xs uppercase tracking-widest px-2 py-0.5 rounded-full', g.published ? 'bg-emerald-100 text-emerald-700' : 'bg-border text-muted'].join(' ')}>
                  {g.published ? 'Publicada' : 'Borrador'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {clientSlug && <p className="mt-6 text-2xs text-muted uppercase tracking-widest">Portal: /c/{clientSlug}</p>}
    </div>
  )
}

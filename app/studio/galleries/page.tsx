import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { shootMeta } from '@/lib/utils'
import type { Gallery, Client, Asset } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type Row = Gallery & { clients: Pick<Client, 'name' | 'slug'> | null; assets: Pick<Asset, 'id'>[] }

export default async function GalleriesList() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('galleries')
    .select('id, title, slug, shoot_date, location, lens, published, display_order, client_id, clients(name, slug), assets(id)')
    .order('created_at', { ascending: false })

  if (error) console.error('galleries query error:', error)

  const galleries = (data ?? []) as unknown as Row[]

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-2xs uppercase tracking-widest text-muted mb-3">Galerías</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Todas las galerías</h1>
        </div>
        <Link href="/studio/galleries/new" className="px-5 py-3 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 transition-colors">
          Nueva galería
        </Link>
      </div>

      {galleries.length === 0 ? (
        <p className="text-muted text-sm">Aún no hay galerías. Crea la primera.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {galleries.map((g) => (
            <li key={g.id}>
              <Link href={`/studio/galleries/${g.id}`} className="flex items-center justify-between py-5 group">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink group-hover:opacity-60 transition-opacity">{g.title}</span>
                    <span className={['text-2xs uppercase tracking-widest px-2 py-0.5 rounded-full', g.published ? 'bg-emerald-100 text-emerald-700' : 'bg-border text-muted'].join(' ')}>
                      {g.published ? 'Publicada' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-2xs text-muted uppercase tracking-widest">
                    {g.clients?.name ?? '—'} · {g.assets?.length ?? 0} fotos · {shootMeta(g) || 'sin fecha'}
                  </p>
                </div>
                <svg className="text-muted group-hover:text-ink transition-colors flex-none ml-6" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

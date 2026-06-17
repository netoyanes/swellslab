import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Brand, Client } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Marcas' }

type Row = Brand & { clients: Pick<Client, 'name' | 'slug'> | null }

export default async function BrandsList() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*, clients(name, slug)')
    .order('created_at', { ascending: false })

  if (error) console.error('brands query error:', error)
  const brands = (data ?? []) as unknown as Row[]

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-2xs uppercase tracking-widest text-muted mb-3">Brand Hub</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Marcas</h1>
        </div>
        <Link href="/studio/brands/new" className="px-5 py-3 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 transition-colors">
          Nueva marca
        </Link>
      </div>

      {brands.length === 0 ? (
        <p className="text-muted text-sm">Aún no hay marcas. Crea la primera.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {brands.map((b) => (
            <Link key={b.id} href={`/studio/brands/${b.id}`} className="bg-canvas p-7 group hover:bg-surface transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="w-9 h-9 rounded-full flex-none border border-border"
                  style={{ background: b.accent_color || '#E8E7E3' }}
                />
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate group-hover:opacity-60 transition-opacity">{b.name}</p>
                  <p className="text-2xs text-muted uppercase tracking-widest truncate">{b.clients?.name ?? '—'}</p>
                </div>
              </div>
              {b.tagline && <p className="text-xs text-muted leading-relaxed line-clamp-2">{b.tagline}</p>}
              <div className="mt-5 flex items-center gap-2">
                <span className={['text-2xs uppercase tracking-widest px-2 py-0.5 rounded-full', b.active ? 'bg-emerald-100 text-emerald-700' : 'bg-border text-muted'].join(' ')}>
                  {b.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

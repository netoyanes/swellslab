import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientUsers } from '@/components/studio/ClientUsers'
import { formatDate } from '@/lib/utils'
import type { Client, Profile } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type UserRow = { user_id: string; profiles: Pick<Profile, 'email' | 'full_name'> | null }

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: cData }, { data: uData }, { data: gData }, { data: bData }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('client_users').select('user_id, profiles(email, full_name)').eq('client_id', id),
    supabase.from('galleries').select('id, title, published').eq('client_id', id).order('created_at', { ascending: false }).limit(5),
    supabase.from('brands').select('id, name, active').eq('client_id', id).order('name'),
  ])

  if (!cData) notFound()
  const client = cData as Client
  const users = ((uData ?? []) as unknown as UserRow[]).map((r) => ({
    user_id: r.user_id,
    email: r.profiles?.email ?? null,
    full_name: r.profiles?.full_name ?? null,
  }))

  return (
    <main className="max-w-screen-xl mx-auto px-6 py-16 space-y-14">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/studio/clients" className="text-2xs uppercase tracking-widest text-muted hover:text-ink">← Clientes</Link>
          <div className="flex items-center gap-4 mt-4">
            {client.accent_color && (
              <span className="w-8 h-8 rounded-full border border-border flex-none" style={{ background: client.accent_color }} />
            )}
            <h1 className="font-display text-4xl text-ink font-light">{client.name}</h1>
          </div>
          <p className="font-mono text-xs text-muted mt-2">/c/{client.slug}{client.onboarded_at ? ` · desde ${formatDate(client.onboarded_at)}` : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/c/${client.slug}`} target="_blank" className="px-4 py-2.5 border border-border text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors">
            Ver portal →
          </Link>
          <Link href={`/studio/clients/${id}/edit`} className="px-4 py-2.5 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 transition-colors">
            Editar
          </Link>
        </div>
      </div>

      <ClientUsers clientId={id} users={users} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xs uppercase tracking-widest text-muted">Marcas</h2>
            <Link href={`/studio/brands/new`} className="text-2xs uppercase tracking-widest text-ink hover:opacity-60">+ Nueva</Link>
          </div>
          {!bData || bData.length === 0 ? (
            <p className="text-sm text-muted">Sin marcas.</p>
          ) : (
            <ul className="border border-border divide-y divide-border">
              {(bData as { id: string; name: string; active: boolean }[]).map((b) => (
                <li key={b.id}>
                  <Link href={`/studio/brands/${b.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors">
                    <span className="text-sm text-ink">{b.name}</span>
                    <span className={['text-2xs uppercase tracking-widest', b.active ? 'text-emerald-700' : 'text-muted'].join(' ')}>{b.active ? 'Activa' : 'Inactiva'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xs uppercase tracking-widest text-muted">Últimas galerías</h2>
            <Link href="/studio/galleries" className="text-2xs uppercase tracking-widest text-ink hover:opacity-60">Ver todas</Link>
          </div>
          {!gData || gData.length === 0 ? (
            <p className="text-sm text-muted">Sin galerías.</p>
          ) : (
            <ul className="border border-border divide-y divide-border">
              {(gData as { id: string; title: string; published: boolean }[]).map((g) => (
                <li key={g.id}>
                  <Link href={`/studio/galleries/${g.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors">
                    <span className="text-sm text-ink">{g.title}</span>
                    <span className={['text-2xs uppercase tracking-widest', g.published ? 'text-emerald-700' : 'text-muted'].join(' ')}>{g.published ? 'Publicada' : 'Borrador'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}

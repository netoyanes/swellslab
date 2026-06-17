import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { Client } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Clientes' }

export default async function ClientsList() {
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('*').order('name')
  const clients = (data ?? []) as Client[]

  return (
    <main className="max-w-screen-xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-2xs uppercase tracking-widest text-muted mb-3">Studio</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Clientes</h1>
        </div>
        <Link href="/studio/clients/new" className="px-5 py-3 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 transition-colors">
          Nuevo cliente
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="text-muted text-sm">Aún no hay clientes. Crea el primero.</p>
      ) : (
        <ul className="border border-border divide-y divide-border">
          {clients.map((c) => (
            <li key={c.id}>
              <Link href={`/studio/clients/${c.id}`} className="flex items-center justify-between py-5 px-4 hover:bg-surface transition-colors group">
                <div className="flex items-center gap-4">
                  {c.accent_color && (
                    <span className="w-7 h-7 rounded-full border border-border flex-none" style={{ background: c.accent_color }} />
                  )}
                  <div>
                    <p className="text-sm text-ink group-hover:opacity-70 transition-opacity">{c.name}</p>
                    <p className="text-2xs text-muted uppercase tracking-widest">
                      /c/{c.slug}{c.onboarded_at ? ` · desde ${formatDate(c.onboarded_at)}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-2xs uppercase tracking-widest text-muted group-hover:text-ink transition-colors">Ver →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

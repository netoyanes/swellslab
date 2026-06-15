import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { Client } from '@/lib/supabase/types'

export const metadata = { title: 'Clientes' }

export default async function ClientsList() {
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('*').order('name')
  const clients = (data ?? []) as Client[]

  return (
    <main className="max-w-screen-xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-2xs uppercase tracking-widest text-muted mb-3">Clientes</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Tus clientes</h1>
      </div>

      {clients.length === 0 ? (
        <p className="text-muted text-sm">Aún no hay clientes.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-5">
              <div>
                <p className="text-sm text-ink">{c.name}</p>
                <p className="text-2xs text-muted uppercase tracking-widest">
                  /c/{c.slug}{c.onboarded_at ? ` · desde ${formatDate(c.onboarded_at)}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-10 text-2xs text-muted uppercase tracking-widest">Crear y editar clientes — próximamente</p>
    </main>
  )
}

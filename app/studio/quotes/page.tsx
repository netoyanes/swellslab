import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import type { Quote, Client } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cotizaciones' }

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Borrador', cls: 'bg-border text-muted' },
  sent: { label: 'Enviada', cls: 'bg-sky-100 text-sky-700' },
  accepted: { label: 'Aceptada', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rechazada', cls: 'bg-red-100 text-red-700' },
  expired: { label: 'Vencida', cls: 'bg-amber-100 text-amber-700' },
}

type Row = Quote & { clients: Pick<Client, 'name'> | null }

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('quotes')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })
  const quotes = (data ?? []) as unknown as Row[]

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-2xs uppercase tracking-widest text-muted mb-3">Facturación</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Cotizaciones</h1>
        </div>
        <Link href="/studio/quotes/new" className="px-5 py-3 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 transition-colors">
          Nueva cotización
        </Link>
      </div>

      {quotes.length === 0 ? (
        <p className="text-muted text-sm">Aún no hay cotizaciones.</p>
      ) : (
        <div className="border border-border divide-y divide-border">
          {quotes.map((q) => {
            const s = STATUS[q.status] ?? STATUS.draft
            return (
              <Link key={q.id} href={`/studio/quotes/${q.id}`} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-surface transition-colors">
                <span className="col-span-2 font-mono text-xs text-muted">{q.number ?? '—'}</span>
                <span className="col-span-4 text-sm text-ink truncate">{q.title}</span>
                <span className="col-span-2 text-xs text-muted truncate">{q.clients?.name ?? '—'}</span>
                <span className="col-span-2 text-sm tabular-nums text-ink text-right">{formatCurrency(q.total, q.currency)}</span>
                <span className="col-span-2 flex justify-end">
                  <span className={['text-2xs uppercase tracking-widest px-2 py-0.5 rounded-full', s.cls].join(' ')}>{s.label}</span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}

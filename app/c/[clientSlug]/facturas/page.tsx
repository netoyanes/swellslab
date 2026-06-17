import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PayButton } from './PayButton'
import type { Client, Quote, Invoice, Receipt } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Facturas' }

export default async function ClientBilling({ params }: { params: Promise<{ clientSlug: string }> }) {
  const { clientSlug } = await params
  const supabase = await createClient()

  const { data: c } = await supabase.from('clients').select('id, name').eq('slug', clientSlug).single()
  if (!c) notFound()
  const client = c as Pick<Client, 'id' | 'name'>

  const [{ data: quoteData }, { data: invoiceData }, { data: receiptData }] = await Promise.all([
    supabase.from('quotes').select('*').eq('client_id', client.id).in('status', ['sent', 'accepted']).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('client_id', client.id).neq('status', 'draft').order('created_at', { ascending: false }),
    supabase.from('receipts').select('*').eq('client_id', client.id).order('paid_at', { ascending: false }),
  ])

  const quotes = (quoteData ?? []) as Quote[]
  const invoices = (invoiceData ?? []) as Invoice[]
  const receipts = (receiptData ?? []) as Receipt[]

  return (
    <main className="max-w-screen-lg mx-auto px-6 py-16 space-y-16">
      <header>
        <p className="text-2xs uppercase tracking-widest text-muted mb-3">{client.name}</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Facturación</h1>
      </header>

      {quotes.length > 0 && (
        <section>
          <h2 className="text-2xs uppercase tracking-widest text-muted mb-4">Cotizaciones</h2>
          <div className="border border-border divide-y divide-border">
            {quotes.map((q) => (
              <div key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 sm:px-5 py-4">
                <span className="font-mono text-xs text-muted">{q.number}</span>
                <span className="text-sm text-ink sm:flex-1">{q.title}</span>
                <div className="flex items-center justify-between sm:contents gap-4">
                  <span className="text-sm tabular-nums text-ink">{formatCurrency(q.total, q.currency)}</span>
                  {q.status === 'accepted'
                    ? <span className="text-2xs uppercase tracking-widest text-emerald-700">Aceptada ✓</span>
                    : q.share_token && <a href={`/q/${q.share_token}`} className="text-2xs uppercase tracking-widest text-ink hover:opacity-60">Revisar →</a>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xs uppercase tracking-widest text-muted mb-4">Facturas</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted">No tienes facturas pendientes.</p>
        ) : (
          <div className="border border-border divide-y divide-border">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 sm:px-5 py-4">
                <span className="font-mono text-xs text-muted">{inv.number}</span>
                <span className="text-sm text-ink sm:flex-1">{inv.title}</span>
                {inv.due_date && <span className="text-2xs text-muted">Vence {formatDate(inv.due_date)}</span>}
                <div className="flex items-center justify-between sm:contents gap-4">
                  <span className="text-sm tabular-nums text-ink">{formatCurrency(inv.amount, inv.currency)}</span>
                  {inv.status === 'paid'
                    ? <span className="text-2xs uppercase tracking-widest text-emerald-700">Pagada ✓</span>
                    : <PayButton invoiceId={inv.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {receipts.length > 0 && (
        <section>
          <h2 className="text-2xs uppercase tracking-widest text-muted mb-4">Recibos</h2>
          <div className="border border-border divide-y divide-border">
            {receipts.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-4 sm:px-5 py-4">
                <span className="font-mono text-xs text-muted">{r.number}</span>
                <span className="text-sm text-muted flex-1">{formatDate(r.paid_at)}</span>
                <span className="text-sm tabular-nums text-ink">{formatCurrency(r.amount, r.currency)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

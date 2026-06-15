import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Pagos' }

const statusLabel: Record<string, { text: string; color: string }> = {
  draft:   { text: 'Borrador',  color: 'text-muted' },
  sent:    { text: 'Pendiente', color: 'text-amber-600' },
  paid:    { text: 'Pagado',    color: 'text-emerald-600' },
  overdue: { text: 'Vencido',   color: 'text-red-500' },
}

export default async function BillingPage({
  params,
}: {
  params: Promise<{ client: string }>
}) {
  const { client: slug } = await params
  const supabase = await createClient()

  const { data: clientData } = await supabase
    .from('clients')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!clientData) notFound()
  const client = clientData as { id: string; name: string }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', client.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  const pending = (invoices ?? []).filter(i => i.status === 'sent' || i.status === 'overdue')
  const totalPending = pending.reduce((s, i) => s + i.amount, 0)

  return (
    <main className="max-w-screen-lg mx-auto px-6 py-16 md:py-20">
      <div className="mb-14">
        <p className="text-2xs uppercase tracking-widest text-muted mb-3">
          {client.name}
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-ink font-light">
          Pagos
        </h1>
      </div>

      {/* Pending summary */}
      {pending.length > 0 && (
        <div className="mb-12 p-6 border border-border bg-surface">
          <p className="text-2xs uppercase tracking-widest text-muted mb-1">
            Total pendiente
          </p>
          <p className="font-display text-4xl text-ink font-light mt-1">
            {formatCurrency(totalPending)}
          </p>
        </div>
      )}

      {!invoices?.length ? (
        <p className="text-muted text-sm">No hay facturas registradas.</p>
      ) : (
        <ul className="divide-y divide-border">
          {invoices.map((invoice) => {
            const status = statusLabel[invoice.status] ?? statusLabel.sent
            return (
              <li key={invoice.id} className="py-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm text-ink">{invoice.title}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-2xs uppercase tracking-widest ${status.color}`}>
                        {status.text}
                      </span>
                      {invoice.due_date && (
                        <span className="text-2xs text-muted">
                          Vence {formatDate(invoice.due_date)}
                        </span>
                      )}
                      {invoice.paid_at && (
                        <span className="text-2xs text-muted">
                          Pagado {formatDate(invoice.paid_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-none">
                    <span className="font-display text-xl text-ink font-light">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </span>
                    {invoice.stripe_payment_url && invoice.status !== 'paid' && (
                      <a
                        href={invoice.stripe_payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/80 transition-colors"
                      >
                        Pagar
                      </a>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

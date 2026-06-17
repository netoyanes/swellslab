import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocView } from '@/components/studio/DocView'
import { InvoiceActions } from '@/components/studio/InvoiceActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice, InvoiceItem, Client, Brand, Receipt } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type Row = Invoice & {
  invoice_items: InvoiceItem[]
  clients: Pick<Client, 'name'> | null
  brands: Pick<Brand, 'name'> | null
  receipts: Receipt[]
}

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), clients(name), brands(name), receipts(*)')
    .eq('id', id)
    .single()
  if (!data) notFound()
  const inv = data as unknown as Row
  const items = [...(inv.invoice_items ?? [])].sort((a, b) => a.display_order - b.display_order)

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-16">
      <Link href="/studio/invoices" className="text-2xs uppercase tracking-widest text-muted hover:text-ink">← Facturas</Link>
      <div className="mt-6 mb-6">
        <InvoiceActions id={inv.id} status={inv.status} paymentUrl={inv.stripe_payment_url} />
      </div>
      <DocView
        kind="invoice"
        number={inv.number}
        title={inv.title}
        clientName={inv.clients?.name}
        brandName={inv.brands?.name}
        dateLabel="Vence"
        dateValue={inv.due_date}
        items={items}
        subtotal={inv.subtotal}
        taxRate={inv.tax_rate}
        taxAmount={inv.tax_amount}
        total={inv.amount}
        currency={inv.currency}
        notes={inv.notes}
      />

      {inv.receipts && inv.receipts.length > 0 && (
        <div className="mt-8 max-w-3xl">
          <p className="text-2xs uppercase tracking-widest text-muted mb-3">Recibos</p>
          <div className="border border-border divide-y divide-border">
            {inv.receipts.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-mono text-xs text-muted">{r.number}</span>
                <span className="text-muted">{formatDate(r.paid_at)} · {r.method}</span>
                <span className="tabular-nums text-ink">{formatCurrency(r.amount, r.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

import { formatCurrency, formatDate } from '@/lib/utils'
import type { LineItem } from '@/lib/supabase/types'

interface Props {
  kind: 'quote' | 'invoice' | 'receipt'
  number: string | null
  title: string
  clientName?: string | null
  brandName?: string | null
  dateLabel?: string
  dateValue?: string | null
  items?: LineItem[]
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  total: number
  currency?: string
  notes?: string | null
}

const HEAD: Record<Props['kind'], string> = { quote: 'Cotización', invoice: 'Factura', receipt: 'Recibo' }

export function DocView(p: Props) {
  const cur = p.currency ?? 'MXN'
  return (
    <article className="bg-canvas border border-border p-8 md:p-12 max-w-3xl">
      <header className="flex items-start justify-between mb-10 pb-8 border-b border-border">
        <div>
          <p className="font-mono text-sm tracking-[0.2em] uppercase" style={{ color: '#333232' }}>Swells Lab</p>
          <p className="text-2xs uppercase tracking-widest text-muted mt-1">{HEAD[p.kind]}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-ink">{p.number ?? '—'}</p>
          {p.dateValue && <p className="text-2xs text-muted mt-1">{p.dateLabel}: {formatDate(p.dateValue)}</p>}
        </div>
      </header>

      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink font-light mb-2">{p.title}</h1>
        <p className="text-sm text-muted">
          {p.clientName ?? '—'}{p.brandName ? ` · ${p.brandName}` : ''}
        </p>
      </div>

      {p.items && p.items.length > 0 && (
        <div className="border-t border-border mb-6">
          <div className="grid grid-cols-12 gap-2 py-2 text-2xs uppercase tracking-widest text-muted border-b border-border">
            <span className="col-span-6">Concepto</span>
            <span className="col-span-2 text-right">Cant.</span>
            <span className="col-span-2 text-right">P. unit.</span>
            <span className="col-span-2 text-right">Importe</span>
          </div>
          {p.items.map((it) => (
            <div key={it.id} className="grid grid-cols-12 gap-2 py-2.5 text-sm border-b border-border/60">
              <span className="col-span-6 text-ink">{it.description}</span>
              <span className="col-span-2 text-right tabular-nums text-muted">{it.qty}</span>
              <span className="col-span-2 text-right tabular-nums text-muted">{formatCurrency(it.unit_price, cur)}</span>
              <span className="col-span-2 text-right tabular-nums text-ink">{formatCurrency(it.amount, cur)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1.5 text-sm">
          {p.subtotal !== undefined && <div className="flex justify-between text-muted"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(p.subtotal, cur)}</span></div>}
          {p.taxAmount !== undefined && p.taxAmount > 0 && <div className="flex justify-between text-muted"><span>IVA ({p.taxRate}%)</span><span className="tabular-nums">{formatCurrency(p.taxAmount, cur)}</span></div>}
          <div className="flex justify-between text-ink font-medium text-base pt-1.5 border-t border-border"><span>Total</span><span className="tabular-nums">{formatCurrency(p.total, cur)}</span></div>
        </div>
      </div>

      {p.notes && (
        <div className="pt-6 border-t border-border">
          <p className="text-2xs uppercase tracking-widest text-muted mb-2">Notas</p>
          <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">{p.notes}</p>
        </div>
      )}
    </article>
  )
}

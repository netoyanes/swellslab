'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import type { Client, Brand } from '@/lib/supabase/types'

export interface Row {
  description: string
  qty: number
  unit_price: number
}

export interface DocFormValues {
  title: string
  client_id: string
  brand_id: string
  notes: string
  date: string // valid_until (quote) | due_date (invoice)
  tax_rate: number
  items: Row[]
}

interface Props {
  kind: 'quote' | 'invoice'
  clients: Pick<Client, 'id' | 'name'>[]
  brands: Pick<Brand, 'id' | 'name' | 'client_id'>[]
  initial?: Partial<DocFormValues>
  onSubmit: (v: DocFormValues) => Promise<string | void | null>
}

const blankRow = (): Row => ({ description: '', qty: 1, unit_price: 0 })

export function DocForm({ kind, clients, brands, initial, onSubmit }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [clientId, setClientId] = useState(initial?.client_id ?? '')
  const [brandId, setBrandId] = useState(initial?.brand_id ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [taxRate, setTaxRate] = useState<number>(initial?.tax_rate ?? 16)
  const [rows, setRows] = useState<Row[]>(initial?.items?.length ? initial.items : [blankRow()])

  const brandOpts = brands.filter((b) => !clientId || b.client_id === clientId)

  const totals = useMemo(() => {
    const subtotal = rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.unit_price) || 0), 0)
    const tax = subtotal * ((Number(taxRate) || 0) / 100)
    return { subtotal, tax, total: subtotal + tax }
  }, [rows, taxRate])

  function setRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  async function handleSubmit() {
    if (!title.trim()) { alert('Falta el título'); return }
    if (kind === 'invoice' && !clientId) { alert('Selecciona un cliente'); return }
    setSaving(true)
    try {
      const id = await onSubmit({
        title: title.trim(),
        client_id: clientId,
        brand_id: brandId,
        notes,
        date,
        tax_rate: Number(taxRate) || 0,
        items: rows.filter((r) => r.description.trim()),
      })
      const base = kind === 'quote' ? '/studio/quotes' : '/studio/invoices'
      router.push(typeof id === 'string' ? `${base}/${id}` : base)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const label = 'block text-2xs uppercase tracking-widest text-muted mb-2'
  const input = 'w-full bg-canvas border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition-colors'

  return (
    <div className="max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div className="sm:col-span-2">
          <label className={label}>Título</label>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Sesión editorial — Primavera" />
        </div>
        <div>
          <label className={label}>Cliente {kind === 'invoice' && '*'}</label>
          <select className={input} value={clientId} onChange={(e) => { setClientId(e.target.value); setBrandId('') }}>
            <option value="">—</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Marca</label>
          <select className={input} value={brandId} onChange={(e) => setBrandId(e.target.value)} disabled={!clientId}>
            <option value="">—</option>
            {brandOpts.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>{kind === 'quote' ? 'Válida hasta' : 'Vence'}</label>
          <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className={label}>IVA (%)</label>
          <input type="number" className={input} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} min={0} step={0.01} />
        </div>
      </div>

      <label className={label}>Conceptos</label>
      <div className="border border-border divide-y divide-border mb-3">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-surface text-2xs uppercase tracking-widest text-muted">
          <span className="col-span-6">Descripción</span>
          <span className="col-span-2 text-right">Cant.</span>
          <span className="col-span-2 text-right">P. unit.</span>
          <span className="col-span-2 text-right">Importe</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
            <input className="col-span-6 bg-transparent text-sm focus:outline-none" placeholder="Concepto" value={r.description} onChange={(e) => setRow(i, { description: e.target.value })} />
            <input type="number" className="col-span-2 bg-transparent text-sm text-right focus:outline-none" value={r.qty} onChange={(e) => setRow(i, { qty: Number(e.target.value) })} />
            <input type="number" className="col-span-2 bg-transparent text-sm text-right focus:outline-none" value={r.unit_price} onChange={(e) => setRow(i, { unit_price: Number(e.target.value) })} />
            <div className="col-span-2 flex items-center justify-end gap-2">
              <span className="text-sm tabular-nums text-ink">{formatCurrency((Number(r.qty) || 0) * (Number(r.unit_price) || 0))}</span>
              {rows.length > 1 && (
                <button onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} className="text-muted hover:text-red-500" aria-label="Eliminar">×</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setRows((rs) => [...rs, blankRow()])} className="text-2xs uppercase tracking-widest text-ink hover:opacity-60 mb-8">+ Agregar concepto</button>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(totals.subtotal)}</span></div>
          <div className="flex justify-between text-muted"><span>IVA ({taxRate}%)</span><span className="tabular-nums">{formatCurrency(totals.tax)}</span></div>
          <div className="flex justify-between text-ink font-medium pt-1.5 border-t border-border"><span>Total</span><span className="tabular-nums">{formatCurrency(totals.total)}</span></div>
        </div>
      </div>

      <div className="mb-8">
        <label className={label}>Notas</label>
        <textarea className={input} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condiciones, forma de pago, etc." />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={saving} className="px-6 py-3 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-50 transition-colors">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button onClick={() => router.back()} className="text-2xs uppercase tracking-widest text-muted hover:text-ink">Cancelar</button>
      </div>
    </div>
  )
}

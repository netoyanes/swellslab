import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocForm, type DocFormValues } from '@/components/studio/DocForm'
import { updateInvoice } from '../../actions'
import type { Invoice, InvoiceItem, Client, Brand } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Editar factura' }

export default async function EditInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data }, { data: clients }, { data: brands }] = await Promise.all([
    supabase.from('invoices').select('*, invoice_items(*)').eq('id', id).single(),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('brands').select('id, name, client_id').order('name'),
  ])
  if (!data) notFound()
  const inv = data as unknown as Invoice & { invoice_items: InvoiceItem[] }
  const items = [...(inv.invoice_items ?? [])].sort((a, b) => a.display_order - b.display_order)

  async function submit(v: DocFormValues) {
    'use server'
    await updateInvoice(id, {
      title: v.title,
      client_id: v.client_id,
      brand_id: v.brand_id || null,
      notes: v.notes || null,
      due_date: v.date || null,
      tax_rate: v.tax_rate,
      items: v.items,
    })
    return id
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-16">
      <p className="text-2xs uppercase tracking-widest text-muted mb-3">Facturas · {inv.number}</p>
      <h1 className="font-display text-4xl text-ink font-light mb-12">Editar factura</h1>
      <DocForm
        kind="invoice"
        clients={(clients ?? []) as Client[]}
        brands={(brands ?? []) as Brand[]}
        initial={{
          title: inv.title,
          client_id: inv.client_id ?? '',
          brand_id: inv.brand_id ?? '',
          notes: inv.notes ?? '',
          date: inv.due_date ?? '',
          tax_rate: inv.tax_rate,
          items: items.map((i) => ({ description: i.description, qty: i.qty, unit_price: i.unit_price })),
        }}
        onSubmit={submit}
      />
    </main>
  )
}

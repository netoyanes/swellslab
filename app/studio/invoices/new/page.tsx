import { createClient } from '@/lib/supabase/server'
import { DocForm, type DocFormValues } from '@/components/studio/DocForm'
import { createInvoice } from '../actions'
import type { Client, Brand } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Nueva factura' }

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const [{ data: clients }, { data: brands }] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('brands').select('id, name, client_id').order('name'),
  ])

  async function submit(v: DocFormValues) {
    'use server'
    return createInvoice({
      title: v.title,
      client_id: v.client_id,
      brand_id: v.brand_id || null,
      notes: v.notes || null,
      due_date: v.date || null,
      tax_rate: v.tax_rate,
      items: v.items,
    })
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-16">
      <p className="text-2xs uppercase tracking-widest text-muted mb-3">Facturas</p>
      <h1 className="font-display text-4xl text-ink font-light mb-12">Nueva factura</h1>
      <DocForm kind="invoice" clients={(clients ?? []) as Client[]} brands={(brands ?? []) as Brand[]} onSubmit={submit} />
    </main>
  )
}

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocForm, type DocFormValues } from '@/components/studio/DocForm'
import { updateQuote } from '../../actions'
import type { Quote, QuoteItem, Client, Brand } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Editar cotización' }

export default async function EditQuote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data }, { data: clients }, { data: brands }] = await Promise.all([
    supabase.from('quotes').select('*, quote_items(*)').eq('id', id).single(),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('brands').select('id, name, client_id').order('name'),
  ])
  if (!data) notFound()
  const q = data as unknown as Quote & { quote_items: QuoteItem[] }
  const items = [...(q.quote_items ?? [])].sort((a, b) => a.display_order - b.display_order)

  async function submit(v: DocFormValues) {
    'use server'
    await updateQuote(id, {
      title: v.title,
      client_id: v.client_id || null,
      brand_id: v.brand_id || null,
      notes: v.notes || null,
      valid_until: v.date || null,
      tax_rate: v.tax_rate,
      items: v.items,
    })
    return id
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-16">
      <p className="text-2xs uppercase tracking-widest text-muted mb-3">Cotizaciones · {q.number}</p>
      <h1 className="font-display text-4xl text-ink font-light mb-12">Editar cotización</h1>
      <DocForm
        kind="quote"
        clients={(clients ?? []) as Client[]}
        brands={(brands ?? []) as Brand[]}
        initial={{
          title: q.title,
          client_id: q.client_id ?? '',
          brand_id: q.brand_id ?? '',
          notes: q.notes ?? '',
          date: q.valid_until ?? '',
          tax_rate: q.tax_rate,
          items: items.map((i) => ({ description: i.description, qty: i.qty, unit_price: i.unit_price })),
        }}
        onSubmit={submit}
      />
    </main>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocView } from '@/components/studio/DocView'
import { QuoteActions } from '@/components/studio/QuoteActions'
import type { Quote, QuoteItem, Client, Brand } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type Row = Quote & { quote_items: QuoteItem[]; clients: Pick<Client, 'name'> | null; brands: Pick<Brand, 'name'> | null }

export default async function QuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('quotes')
    .select('*, quote_items(*), clients(name), brands(name)')
    .eq('id', id)
    .single()
  if (!data) notFound()
  const q = data as unknown as Row
  const items = [...(q.quote_items ?? [])].sort((a, b) => a.display_order - b.display_order)

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-16">
      <Link href="/studio/quotes" className="text-2xs uppercase tracking-widest text-muted hover:text-ink">← Cotizaciones</Link>
      <div className="mt-6 mb-6">
        <QuoteActions id={q.id} status={q.status} />
      </div>
      <DocView
        kind="quote"
        number={q.number}
        title={q.title}
        clientName={q.clients?.name}
        brandName={q.brands?.name}
        dateLabel="Válida hasta"
        dateValue={q.valid_until}
        items={items}
        subtotal={q.subtotal}
        taxRate={q.tax_rate}
        taxAmount={q.tax_amount}
        total={q.total}
        currency={q.currency}
        notes={q.notes}
      />
    </main>
  )
}

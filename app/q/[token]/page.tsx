import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { DocView } from '@/components/studio/DocView'
import { AcceptButton } from './AcceptButton'
import type { Quote, QuoteItem, Client, Brand } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cotización' }

type Row = Quote & { quote_items: QuoteItem[]; clients: Pick<Client, 'name'> | null; brands: Pick<Brand, 'name'> | null }

export default async function PublicQuote({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  // Service-role read: this page is public, gated only by the unguessable token.
  const admin = createAdminClient()
  const { data } = await admin
    .from('quotes')
    .select('*, quote_items(*), clients(name), brands(name)')
    .eq('share_token', token)
    .single()
  if (!data) notFound()
  const q = data as unknown as Row
  const items = [...(q.quote_items ?? [])].sort((a, b) => a.display_order - b.display_order)
  const accepted = q.status === 'accepted'

  return (
    <main className="min-h-screen bg-surface py-12 px-4 flex flex-col items-center">
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
      <div className="mt-8">
        {accepted ? (
          <p className="text-2xs uppercase tracking-widest text-emerald-700 bg-emerald-100 px-5 py-3 rounded-full">✓ Cotización aceptada</p>
        ) : (
          <AcceptButton token={token} />
        )}
      </div>
    </main>
  )
}

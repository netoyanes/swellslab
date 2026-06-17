'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { computeTotals, nextNumber, type RawItem } from '@/lib/billing'
import { notify } from '@/lib/notify'

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export interface QuoteInput {
  title: string
  client_id?: string | null
  brand_id?: string | null
  notes?: string | null
  valid_until?: string | null
  tax_rate?: number
  items: RawItem[]
}

async function writeItems(quoteId: string, items: RawItem[], taxRate: number) {
  const supabase = await createClient()
  const totals = computeTotals(items, taxRate)
  await supabase.from('quote_items').delete().eq('quote_id', quoteId)
  if (totals.items.length > 0) {
    await supabase.from('quote_items').insert(totals.items.map((i) => ({ quote_id: quoteId, ...i })))
  }
  await supabase
    .from('quotes')
    .update({
      subtotal: totals.subtotal,
      tax_rate: taxRate,
      tax_amount: totals.tax_amount,
      total: totals.total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)
  return totals
}

export async function createQuote(input: QuoteInput): Promise<string | null> {
  const supabase = await createClient()
  const user = await currentUser()
  const number = await nextNumber('quotes', 'COT')

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      number,
      title: input.title,
      client_id: input.client_id ?? null,
      brand_id: input.brand_id ?? null,
      notes: input.notes ?? null,
      valid_until: input.valid_until ?? null,
      tax_rate: input.tax_rate ?? 0,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return null
  const id = (data as { id: string }).id
  await writeItems(id, input.items, input.tax_rate ?? 0)
  revalidatePath('/studio/quotes')
  return id
}

export async function updateQuote(id: string, input: QuoteInput): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('quotes')
    .update({
      title: input.title,
      client_id: input.client_id ?? null,
      brand_id: input.brand_id ?? null,
      notes: input.notes ?? null,
      valid_until: input.valid_until ?? null,
    })
    .eq('id', id)
  await writeItems(id, input.items, input.tax_rate ?? 0)
  revalidatePath('/studio/quotes')
  revalidatePath(`/studio/quotes/${id}`)
}

export async function setQuoteStatus(id: string, status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'): Promise<void> {
  const supabase = await createClient()
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'accepted') patch.accepted_at = new Date().toISOString()
  await supabase.from('quotes').update(patch).eq('id', id)
  revalidatePath('/studio/quotes')
  revalidatePath(`/studio/quotes/${id}`)
}

// Generates (or returns) a public share token to send the quote for approval.
export async function shareQuote(id: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase.from('quotes').select('share_token').eq('id', id).single()
  let token = (data as { share_token: string | null } | null)?.share_token
  if (!token) {
    token = randomUUID()
    await supabase.from('quotes').update({ share_token: token, status: 'sent', updated_at: new Date().toISOString() }).eq('id', id)
    revalidatePath(`/studio/quotes/${id}`)
  }
  return token
}

export async function deleteQuote(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('quotes').delete().eq('id', id)
  revalidatePath('/studio/quotes')
}

// Converts an accepted quote into a draft invoice (copies line items + totals).
export async function convertToInvoice(quoteId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: q } = await supabase.from('quotes').select('*, quote_items(*)').eq('id', quoteId).single()
  if (!q) return null
  const quote = q as Record<string, unknown> & { quote_items: { description: string; qty: number; unit_price: number; amount: number; display_order: number }[] }
  if (!quote.client_id) return null

  const number = await nextNumber('invoices', 'FAC')
  const { data: inv, error } = await supabase
    .from('invoices')
    .insert({
      client_id: quote.client_id,
      brand_id: quote.brand_id,
      quote_id: quoteId,
      number,
      title: quote.title,
      notes: quote.notes,
      subtotal: quote.subtotal,
      tax_rate: quote.tax_rate,
      tax_amount: quote.tax_amount,
      amount: quote.total,
      currency: quote.currency,
      status: 'draft',
      issued_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !inv) return null
  const invoiceId = (inv as { id: string }).id

  if (quote.quote_items.length > 0) {
    await supabase.from('invoice_items').insert(
      quote.quote_items.map((i) => ({
        invoice_id: invoiceId,
        description: i.description,
        qty: i.qty,
        unit_price: i.unit_price,
        amount: i.amount,
        display_order: i.display_order,
      })),
    )
  }

  await supabase.from('quotes').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', quoteId)
  revalidatePath('/studio/quotes')
  revalidatePath('/studio/invoices')
  return invoiceId
}

// Public accept (from the share link). No auth — guarded by share_token.
export async function acceptQuoteByToken(token: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.from('quotes').select('id, created_by, title').eq('share_token', token).single()
  if (!data) return false
  const quote = data as { id: string; created_by: string | null; title: string }
  await supabase.from('quotes').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', quote.id)
  if (quote.created_by) {
    await notify({
      userIds: [quote.created_by],
      type: 'quote_accepted',
      title: 'Cotización aceptada',
      body: quote.title,
      link: `/studio/quotes/${quote.id}`,
    })
  }
  revalidatePath(`/q/${token}`)
  return true
}

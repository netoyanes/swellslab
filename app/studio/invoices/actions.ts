'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { computeTotals, nextNumber, type RawItem } from '@/lib/billing'
import { getStripe } from '@/lib/stripe'
import { notify } from '@/lib/notify'
import type { Invoice } from '@/lib/supabase/types'

export interface InvoiceInput {
  title: string
  client_id: string
  brand_id?: string | null
  notes?: string | null
  due_date?: string | null
  tax_rate?: number
  items: RawItem[]
}

async function writeItems(invoiceId: string, items: RawItem[], taxRate: number) {
  const supabase = await createClient()
  const totals = computeTotals(items, taxRate)
  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
  if (totals.items.length > 0) {
    await supabase.from('invoice_items').insert(totals.items.map((i) => ({ invoice_id: invoiceId, ...i })))
  }
  await supabase
    .from('invoices')
    .update({
      subtotal: totals.subtotal,
      tax_rate: taxRate,
      tax_amount: totals.tax_amount,
      amount: totals.total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
}

export async function createInvoice(input: InvoiceInput): Promise<string | null> {
  const supabase = await createClient()
  const number = await nextNumber('invoices', 'FAC')
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      number,
      title: input.title,
      client_id: input.client_id,
      brand_id: input.brand_id ?? null,
      notes: input.notes ?? null,
      due_date: input.due_date ?? null,
      tax_rate: input.tax_rate ?? 0,
      status: 'draft',
      issued_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error || !data) return null
  const id = (data as { id: string }).id
  await writeItems(id, input.items, input.tax_rate ?? 0)
  revalidatePath('/studio/invoices')
  return id
}

export async function updateInvoice(id: string, input: InvoiceInput): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('invoices')
    .update({
      title: input.title,
      client_id: input.client_id,
      brand_id: input.brand_id ?? null,
      notes: input.notes ?? null,
      due_date: input.due_date ?? null,
    })
    .eq('id', id)
  await writeItems(id, input.items, input.tax_rate ?? 0)
  revalidatePath('/studio/invoices')
  revalidatePath(`/studio/invoices/${id}`)
}

export async function setInvoiceStatus(id: string, status: 'draft' | 'sent' | 'paid' | 'overdue'): Promise<void> {
  const supabase = await createClient()
  if (status === 'paid') return void (await markPaid(id, 'manual'))
  await supabase.from('invoices').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/studio/invoices')
  revalidatePath(`/studio/invoices/${id}`)
}

// Marks an invoice paid and generates a receipt + notifies client users.
export async function markPaid(id: string, method = 'manual', paymentIntent?: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('*').eq('id', id).single()
  if (!data) return
  const inv = data as Invoice
  if (inv.status === 'paid') return

  const now = new Date().toISOString()
  await supabase.from('invoices').update({ status: 'paid', paid_at: now, updated_at: now }).eq('id', id)

  const recNumber = await nextNumber('receipts', 'REC')
  await supabase.from('receipts').insert({
    invoice_id: id,
    client_id: inv.client_id,
    number: recNumber,
    amount: inv.amount,
    currency: inv.currency,
    method,
    paid_at: now,
    stripe_payment_intent: paymentIntent ?? null,
  })

  // Notify the client's portal users.
  const { data: cu } = await supabase.from('client_users').select('user_id').eq('client_id', inv.client_id)
  const userIds = ((cu ?? []) as { user_id: string }[]).map((r) => r.user_id)
  if (userIds.length > 0) {
    await notify({
      userIds,
      type: 'invoice_paid',
      title: 'Pago confirmado',
      body: `${inv.title} · recibo ${recNumber}`,
      link: '/c',
    })
  }

  revalidatePath('/studio/invoices')
  revalidatePath(`/studio/invoices/${id}`)
}

export async function deleteInvoice(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('invoices').delete().eq('id', id)
  revalidatePath('/studio/invoices')
}

// Creates a Stripe Checkout payment link for an invoice. Returns the URL,
// or null when Stripe isn't configured (manual flow stays available).
export async function createPaymentLink(id: string): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('*').eq('id', id).single()
  if (!data) return null
  const inv = data as Invoice
  if (inv.stripe_payment_url && inv.status !== 'paid') return inv.stripe_payment_url

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swellslab.vercel.app'
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: inv.currency.toLowerCase(),
          unit_amount: Math.round(inv.amount * 100),
          product_data: { name: `${inv.number ?? 'Factura'} — ${inv.title}` },
        },
      },
    ],
    metadata: { invoice_id: id },
    success_url: `${appUrl}/pago/exito?inv=${id}`,
    cancel_url: `${appUrl}/pago/cancelado?inv=${id}`,
  })

  await supabase
    .from('invoices')
    .update({ stripe_invoice_id: session.id, stripe_payment_url: session.url, status: inv.status === 'draft' ? 'sent' : inv.status })
    .eq('id', id)
  revalidatePath(`/studio/invoices/${id}`)
  return session.url
}

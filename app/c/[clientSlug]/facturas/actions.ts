'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import type { Invoice } from '@/lib/supabase/types'

// Client-portal checkout: generates (or reuses) a Stripe payment link for an
// invoice the signed-in client owns. Returns null if Stripe isn't configured.
export async function startCheckout(invoiceId: string): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('invoices').select('*').eq('id', invoiceId).single()
  if (!data) return null
  const inv = data as Invoice
  if (inv.status === 'paid') return null

  // Verify the user belongs to this invoice's client.
  const { data: cu } = await supabase
    .from('client_users')
    .select('user_id')
    .eq('client_id', inv.client_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!cu) return null

  if (inv.stripe_payment_url) return inv.stripe_payment_url

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
    metadata: { invoice_id: invoiceId },
    success_url: `${appUrl}/pago/exito?inv=${invoiceId}`,
    cancel_url: `${appUrl}/pago/cancelado?inv=${invoiceId}`,
  })

  await supabase
    .from('invoices')
    .update({ stripe_invoice_id: session.id, stripe_payment_url: session.url })
    .eq('id', invoiceId)

  return session.url
}

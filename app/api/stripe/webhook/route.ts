import { NextResponse, type NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { nextNumber } from '@/lib/billing'
import { notify } from '@/lib/notify'
import type { Invoice } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) return NextResponse.json({ ok: false, reason: 'stripe_not_configured' }, { status: 200 })

  const sig = req.headers.get('stripe-signature')
  const body = await req.text()
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? '', secret)
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${(err as Error).message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { invoice_id?: string }; payment_intent?: string }
    const invoiceId = session.metadata?.invoice_id
    if (invoiceId) await fulfillPaidInvoice(invoiceId, session.payment_intent)
  }

  return NextResponse.json({ received: true })
}

async function fulfillPaidInvoice(id: string, paymentIntent?: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('invoices').select('*').eq('id', id).single()
  if (!data) return
  const inv = data as Invoice
  if (inv.status === 'paid') return

  const now = new Date().toISOString()
  await admin.from('invoices').update({ status: 'paid', paid_at: now, updated_at: now }).eq('id', id)

  const recNumber = await nextNumber('receipts', 'REC')
  await admin.from('receipts').insert({
    invoice_id: id,
    client_id: inv.client_id,
    number: recNumber,
    amount: inv.amount,
    currency: inv.currency,
    method: 'stripe',
    paid_at: now,
    stripe_payment_intent: paymentIntent ?? null,
  })

  const { data: cu } = await admin.from('client_users').select('user_id').eq('client_id', inv.client_id)
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
}

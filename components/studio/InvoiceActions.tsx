'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setInvoiceStatus, markPaid, deleteInvoice, createPaymentLink } from '@/app/studio/invoices/actions'
import type { InvoiceStatus } from '@/lib/supabase/types'

export function InvoiceActions({ id, status, paymentUrl }: { id: string; status: InvoiceStatus; paymentUrl: string | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState(paymentUrl)

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    try { await fn() } finally { setBusy(false); router.refresh() }
  }

  async function payLink() {
    setBusy(true)
    const link = await createPaymentLink(id)
    setBusy(false)
    if (!link) { alert('Stripe no está configurado. Agrega STRIPE_SECRET_KEY para generar enlaces de pago.'); return }
    setUrl(link)
    await navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    router.refresh()
  }

  const btn = 'px-4 py-2.5 text-2xs uppercase tracking-widest transition-colors disabled:opacity-50'
  const paid = status === 'paid'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!paid && (
        <button onClick={() => run(() => markPaid(id, 'manual'))} disabled={busy} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
          Marcar pagada
        </button>
      )}
      {!paid && (
        <button onClick={payLink} disabled={busy} className={`${btn} bg-ink text-canvas hover:bg-ink/90`}>
          {copied ? 'Enlace copiado ✓' : url ? 'Copiar enlace de pago' : 'Generar enlace de pago'}
        </button>
      )}
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`${btn} border border-border text-muted hover:text-ink`}>Abrir pago</a>
      )}
      {!paid && status !== 'sent' && (
        <button onClick={() => run(() => setInvoiceStatus(id, 'sent'))} disabled={busy} className={`${btn} border border-border text-muted hover:text-ink`}>
          Marcar enviada
        </button>
      )}
      <a href={`/studio/invoices/${id}/edit`} className={`${btn} border border-border text-muted hover:text-ink`}>Editar</a>
      <button
        onClick={() => { if (confirm('¿Eliminar esta factura?')) run(async () => { await deleteInvoice(id); router.push('/studio/invoices') }) }}
        disabled={busy}
        className={`${btn} text-red-500 hover:text-red-600 ml-auto`}
      >
        Eliminar
      </button>
    </div>
  )
}

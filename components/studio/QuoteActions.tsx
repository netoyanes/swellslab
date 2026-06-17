'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setQuoteStatus, shareQuote, deleteQuote, convertToInvoice } from '@/app/studio/quotes/actions'
import type { QuoteStatus } from '@/lib/supabase/types'

export function QuoteActions({ id, status }: { id: string; status: QuoteStatus }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    try { await fn() } finally { setBusy(false); router.refresh() }
  }

  async function share() {
    const token = await shareQuote(id)
    const url = `${window.location.origin}/q/${token}`
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    router.refresh()
  }

  async function convert() {
    setBusy(true)
    const invId = await convertToInvoice(id)
    setBusy(false)
    if (invId) router.push(`/studio/invoices/${invId}`)
    else alert('Asigna un cliente antes de convertir a factura.')
  }

  const btn = 'px-4 py-2.5 text-2xs uppercase tracking-widest transition-colors disabled:opacity-50'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={share} disabled={busy} className={`${btn} bg-ink text-canvas hover:bg-ink/90`}>
        {copied ? 'Enlace copiado ✓' : 'Compartir enlace'}
      </button>
      <button onClick={convert} disabled={busy || status === 'rejected'} className={`${btn} border border-ink text-ink hover:bg-ink hover:text-canvas`}>
        Convertir a factura
      </button>
      {status !== 'accepted' && (
        <button onClick={() => run(() => setQuoteStatus(id, 'accepted'))} disabled={busy} className={`${btn} border border-border text-muted hover:text-ink`}>
          Marcar aceptada
        </button>
      )}
      {status !== 'rejected' && (
        <button onClick={() => run(() => setQuoteStatus(id, 'rejected'))} disabled={busy} className={`${btn} border border-border text-muted hover:text-ink`}>
          Rechazar
        </button>
      )}
      <a href={`/studio/quotes/${id}/edit`} className={`${btn} border border-border text-muted hover:text-ink`}>Editar</a>
      <button
        onClick={() => { if (confirm('¿Eliminar esta cotización?')) run(async () => { await deleteQuote(id); router.push('/studio/quotes') }) }}
        disabled={busy}
        className={`${btn} text-red-500 hover:text-red-600 ml-auto`}
      >
        Eliminar
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { startCheckout } from './actions'

export function PayButton({ invoiceId }: { invoiceId: string }) {
  const [busy, setBusy] = useState(false)

  async function pay() {
    setBusy(true)
    const url = await startCheckout(invoiceId)
    if (url) { window.location.href = url; return }
    setBusy(false)
    alert('El pago en línea no está disponible por el momento. Te contactaremos para coordinar el pago.')
  }

  return (
    <button onClick={pay} disabled={busy} className="px-4 py-2 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-50 transition-colors">
      {busy ? 'Redirigiendo…' : 'Pagar'}
    </button>
  )
}

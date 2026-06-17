'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptQuoteByToken } from '@/app/studio/quotes/actions'

export function AcceptButton({ token }: { token: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function accept() {
    setBusy(true)
    const ok = await acceptQuoteByToken(token)
    setBusy(false)
    if (ok) router.refresh()
    else alert('No se pudo aceptar. Contacta al estudio.')
  }

  return (
    <button onClick={accept} disabled={busy} className="px-8 py-4 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-50 transition-colors">
      {busy ? 'Procesando…' : 'Aceptar cotización'}
    </button>
  )
}

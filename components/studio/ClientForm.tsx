'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientRecord, updateClientRecord, type ClientInput } from '@/app/studio/clients/actions'

interface Props {
  id?: string
  initial?: Partial<ClientInput>
}

const field = 'w-full bg-canvas border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition-colors'
const lbl = 'block text-2xs uppercase tracking-widest text-muted mb-2'

export function ClientForm({ id, initial }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? '')
  const [accent, setAccent] = useState(initial?.accent_color ?? '#1C1C1A')
  const [onboarded, setOnboarded] = useState(initial?.onboarded_at ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const input: ClientInput = { name: name.trim(), accent_color: accent || null, onboarded_at: onboarded || null }
    if (id) {
      const err = await updateClientRecord(id, input)
      if (err) { setError(err.error); setSaving(false); return }
      router.push(`/studio/clients/${id}`)
    } else {
      const res = await createClientRecord(input)
      if ('error' in res) { setError(res.error); setSaving(false); return }
      router.push(`/studio/clients/${res.id}`)
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className={lbl}>Nombre del cliente *</label>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Casa Cielo" required />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className={lbl}>Color acento</label>
          <div className="flex items-center gap-3">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 border border-border cursor-pointer bg-transparent" />
            <input className={field} value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#1C1C1A" />
          </div>
        </div>
        <div>
          <label className={lbl}>Cliente desde</label>
          <input type="date" className={field} value={onboarded} onChange={(e) => setOnboarded(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="px-6 py-3 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-50 transition-colors">
          {saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear cliente'}
        </button>
        <button type="button" onClick={() => router.back()} className="text-2xs uppercase tracking-widest text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  )
}

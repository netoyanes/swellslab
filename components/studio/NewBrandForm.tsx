'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface Props {
  clients: { id: string; name: string; slug: string }[]
}

const field = 'w-full bg-transparent border-b border-border pb-2.5 text-sm text-ink placeholder:text-muted/50 outline-none focus:border-ink transition-colors'
const label = 'block text-2xs uppercase tracking-widest text-muted mb-1.5'

export function NewBrandForm({ clients }: Props) {
  const router = useRouter()
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [accent, setAccent] = useState('#1C1C1A')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !name) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('brands')
      .insert({
        client_id: clientId,
        name,
        slug: slugify(name),
        tagline: tagline || null,
        accent_color: accent || null,
        active: true,
      })
      .select('id')
      .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }
    router.push(`/studio/brands/${(data as { id: string }).id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {clients.length === 0 ? (
        <p className="text-sm text-amber-600">Primero crea un cliente.</p>
      ) : (
        <div>
          <label className={label}>Cliente</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={field}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className={label}>Nombre de la marca</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Casa Cielo" className={field} />
        {name && <p className="mt-1.5 text-2xs text-muted">slug: {slugify(name)}</p>}
      </div>

      <div>
        <label className={label}>Tagline (opcional)</label>
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Arquitectura que dialoga con el horizonte" className={field} />
      </div>

      <div>
        <label className={label}>Color de acento</label>
        <div className="flex items-center gap-3">
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded border border-border bg-transparent cursor-pointer" />
          <input value={accent} onChange={(e) => setAccent(e.target.value)} className={field} />
        </div>
      </div>

      {error && <p className="text-2xs text-red-500">{error}</p>}

      <button type="submit" disabled={saving || !clientId || !name} className="px-6 py-3.5 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-40 transition-colors">
        {saving ? 'Creando…' : 'Crear marca'}
      </button>
    </form>
  )
}

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

export function NewGalleryForm({ clients }: Props) {
  const router = useRouter()
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [shootDate, setShootDate] = useState('')
  const [location, setLocation] = useState('')
  const [lens, setLens] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !title) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('galleries')
      .insert({
        client_id: clientId,
        title,
        slug: slugify(title),
        shoot_date: shootDate || null,
        location: location || null,
        lens: lens || null,
        description: description || null,
        published: false,
      })
      .select('id')
      .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }
    router.push(`/studio/galleries/${(data as { id: string }).id}`)
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
        <label className={label}>Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Casa Cielo" className={field} />
        {title && <p className="mt-1.5 text-2xs text-muted">URL: /g/{slugify(title)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={label}>Fecha del shoot</label>
          <input type="date" value={shootDate} onChange={(e) => setShootDate(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Lente</label>
          <input value={lens} onChange={(e) => setLens(e.target.value)} placeholder="50mm" className={field} />
        </div>
      </div>

      <div>
        <label className={label}>Ubicación</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mazatlán, Sinaloa" className={field} />
      </div>

      <div>
        <label className={label}>Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${field} resize-none`} />
      </div>

      {error && <p className="text-2xs text-red-500">{error}</p>}

      <button type="submit" disabled={saving || !clientId || !title} className="px-6 py-3.5 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-40 transition-colors">
        {saving ? 'Creando…' : 'Crear y subir fotos'}
      </button>
    </form>
  )
}

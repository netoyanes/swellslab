'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inviteClientUser, removeClientUser } from '@/app/studio/clients/actions'

interface User {
  user_id: string
  email: string | null
  full_name: string | null
}

export function ClientUsers({ clientId, users }: { clientId: string; users: User[] }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setMsg(null)
    const res = await inviteClientUser(clientId, email.trim().toLowerCase())
    setBusy(false)
    if ('error' in res) { setMsg({ ok: false, text: res.error }); return }
    setMsg({ ok: true, text: `Invitación enviada a ${email}. Recibirá un enlace por correo.` })
    setEmail('')
    router.refresh()
  }

  async function remove(userId: string, userEmail: string | null) {
    if (!confirm(`¿Quitar acceso a ${userEmail ?? userId}?`)) return
    await removeClientUser(clientId, userId)
    router.refresh()
  }

  return (
    <div>
      <h2 className="text-2xs uppercase tracking-widest text-muted mb-5">Acceso al portal</h2>

      {users.length === 0 ? (
        <p className="text-sm text-muted mb-6">Sin usuarios con acceso aún.</p>
      ) : (
        <ul className="border border-border divide-y divide-border mb-6">
          {users.map((u) => (
            <li key={u.user_id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-ink">{u.full_name ?? u.email ?? u.user_id}</p>
                {u.full_name && <p className="text-2xs text-muted">{u.email}</p>}
              </div>
              <button onClick={() => remove(u.user_id, u.email)} className="text-2xs uppercase tracking-widest text-muted hover:text-red-500 transition-colors">
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={invite} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@cliente.com"
          required
          className="flex-1 bg-canvas border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors"
        />
        <button type="submit" disabled={busy} className="px-5 py-2.5 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-50 transition-colors whitespace-nowrap">
          {busy ? '…' : 'Dar acceso'}
        </button>
      </form>
      {msg && <p className={['mt-3 text-sm', msg.ok ? 'text-emerald-700' : 'text-red-500'].join(' ')}>{msg.text}</p>}
    </div>
  )
}

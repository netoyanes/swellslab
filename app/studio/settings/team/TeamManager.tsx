'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inviteStaffMember, updateStaffRole, removeStaffMember, type StaffRole } from './actions'

interface Member {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  confirmed: boolean
}

const ROLE_LABEL: Record<string, string> = { master: 'Master', admin: 'Admin', staff: 'Staff' }
const ROLE_CLS: Record<string, string> = {
  master: 'text-ink bg-ink/10',
  admin: 'text-sky-700 bg-sky-100',
  staff: 'text-muted bg-border',
}

export function TeamManager({ currentUserId, members }: { currentUserId: string; members: Member[] }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffRole>('staff')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setMsg(null)
    const res = await inviteStaffMember(email.trim().toLowerCase(), role)
    setBusy(false)
    if ('error' in res) { setMsg({ ok: false, text: res.error }); return }
    setMsg({ ok: true, text: `Invitación enviada a ${email}.` })
    setEmail('')
    router.refresh()
  }

  async function changeRole(userId: string, newRole: StaffRole) {
    await updateStaffRole(userId, newRole)
    router.refresh()
  }

  async function remove(userId: string, userEmail: string | null) {
    if (!confirm(`¿Eliminar acceso de ${userEmail ?? userId}? Esta acción no se puede deshacer.`)) return
    await removeStaffMember(userId)
    router.refresh()
  }

  const label = 'block text-2xs uppercase tracking-widest text-muted mb-2'
  const inputCls = 'w-full bg-canvas border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition-colors'

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xs uppercase tracking-widest text-muted mb-5">Miembros activos</h2>
        <div className="border border-border divide-y divide-border">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-ink truncate">{m.full_name ?? m.email ?? m.id}</p>
                {m.full_name && <p className="text-2xs text-muted truncate">{m.email}</p>}
                {!m.confirmed && <p className="text-2xs text-amber-600 mt-0.5">Invitación pendiente</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {m.role !== 'master' ? (
                  <select
                    value={m.role ?? 'staff'}
                    onChange={(e) => changeRole(m.id, e.target.value as StaffRole)}
                    className="bg-canvas border border-border px-2 py-1 text-2xs uppercase tracking-widest focus:outline-none focus:border-ink"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </select>
                ) : (
                  <span className={['text-2xs uppercase tracking-widest px-2 py-0.5 rounded-full', ROLE_CLS[m.role ?? 'staff']].join(' ')}>
                    {ROLE_LABEL[m.role ?? 'staff']}
                  </span>
                )}
                {m.id !== currentUserId && m.role !== 'master' && (
                  <button
                    onClick={() => remove(m.id, m.email)}
                    className="text-2xs uppercase tracking-widest text-muted hover:text-red-500 transition-colors"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xs uppercase tracking-widest text-muted mb-5">Invitar miembro</h2>
        <form onSubmit={invite} className="space-y-4 max-w-md">
          <div>
            <label className={label}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@swells.mx"
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={label}>Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={inputCls}>
              <option value="staff">Staff — acceso estándar al estudio</option>
              <option value="admin">Admin — puede gestionar clientes y facturas</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-3 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Enviando…' : 'Enviar invitación'}
            </button>
          </div>
          {msg && <p className={['text-sm', msg.ok ? 'text-emerald-700' : 'text-red-500'].join(' ')}>{msg.text}</p>}
        </form>
      </section>
    </div>
  )
}

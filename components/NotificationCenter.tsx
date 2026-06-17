'use client'

import { useEffect, useState, useCallback } from 'react'

interface Item {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function NotificationCenter({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [unread, setUnread] = useState(0)
  const [pushState, setPushState] = useState<'unknown' | 'on' | 'off' | 'unsupported'>('unknown')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      const json = await res.json()
      setItems(json.items ?? [])
      setUnread(json.unread ?? 0)
    } catch {}
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  // Register service worker + detect push state
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported')
      return
    }
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setPushState(sub ? 'on' : 'off')
    }).catch(() => setPushState('unsupported'))
  }, [])

  async function enablePush() {
    if (!VAPID_PUBLIC) { alert('Falta configurar VAPID_PUBLIC_KEY'); return }
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      setPushState('on')
    } catch (e) {
      console.error('push subscribe failed', e)
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    setUnread(0)
    setItems((prev) => prev.map((i) => ({ ...i, read_at: new Date().toISOString() })))
  }

  async function sendTest() {
    await fetch('/api/push/test', { method: 'POST' })
    setTimeout(load, 800)
  }

  const muted = dark ? 'text-canvas/50' : 'text-muted'
  const fg = dark ? 'text-canvas' : 'text-ink'

  return (
    <div className="relative">
      <button onClick={() => { setOpen((o) => !o); if (!open && unread) markAllRead() }} className={['relative transition-colors hover:opacity-80', muted].join(' ')} aria-label="Notificaciones">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        {unread > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center tabular-nums">{unread}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 max-h-[70vh] overflow-y-auto bg-canvas border border-border rounded-sm shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-canvas">
              <span className="text-2xs uppercase tracking-widest text-muted">Notificaciones</span>
              <div className="flex items-center gap-3">
                {pushState === 'off' && <button onClick={enablePush} className="text-2xs uppercase tracking-widest text-ink hover:opacity-60">Activar push</button>}
                {pushState === 'on' && <button onClick={sendTest} className="text-2xs uppercase tracking-widest text-muted hover:text-ink">Probar</button>}
              </div>
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Sin notificaciones</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <li key={n.id}>
                    <a href={n.link ?? '#'} className={['block px-4 py-3 hover:bg-surface transition-colors', !n.read_at ? 'bg-sky-50/40' : ''].join(' ')}>
                      <p className={['text-sm', fg].join(' ')}>{n.title}</p>
                      {n.body && <p className="text-xs text-muted mt-0.5 leading-snug">{n.body}</p>}
                      <p className="text-2xs text-muted/60 mt-1">{new Date(n.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

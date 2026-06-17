'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FLAGS } from '@/lib/flags'
import { NotificationCenter } from '@/components/NotificationCenter'

export function ClientNav({ clientSlug, clientName }: { clientSlug: string; clientName: string }) {
  const pathname = usePathname()
  const base = `/c/${clientSlug}`
  const [open, setOpen] = useState(false)

  const links = [
    { label: 'Galerías', href: base, enabled: true },
    { label: 'Documentos', href: `${base}/documentos`, enabled: FLAGS.documents },
    { label: 'Facturas', href: `${base}/facturas`, enabled: FLAGS.invoices },
    { label: 'Mensajes', href: `${base}/mensajes`, enabled: FLAGS.messaging },
  ]

  async function signOut() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-canvas/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-screen-xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link href={base} className="font-mono text-sm tracking-[0.2em] uppercase hover:opacity-70 transition-opacity shrink-0" style={{ color: '#333232' }}>
              Swells Lab
            </Link>
            <span className="text-border shrink-0">·</span>
            <span className="font-sans text-xs text-muted uppercase tracking-widest truncate">{clientName}</span>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-8">
              {links.map(({ label, href, enabled }) => {
                const active = href === base ? pathname === base : pathname.startsWith(href)
                if (!enabled) {
                  return (
                    <span key={href} className="text-2xs uppercase tracking-widest text-muted/40 cursor-default" title="Próximamente">
                      {label}
                    </span>
                  )
                }
                return (
                  <Link
                    key={href}
                    href={href}
                    className={['text-2xs uppercase tracking-widest transition-colors', active ? 'text-ink' : 'text-muted hover:text-ink'].join(' ')}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
            {FLAGS.notifications && <NotificationCenter />}
            <button onClick={signOut} className="hidden sm:block text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors">
              Salir
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="sm:hidden flex flex-col justify-center gap-1.5 w-6 h-6"
              aria-label="Menú"
            >
              <span className={['block h-px bg-ink transition-all', open ? 'rotate-45 translate-y-[3.5px]' : ''].join(' ')} />
              <span className={['block h-px bg-ink transition-all', open ? 'opacity-0' : ''].join(' ')} />
              <span className={['block h-px bg-ink transition-all', open ? '-rotate-45 -translate-y-[3.5px]' : ''].join(' ')} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setOpen(false)}>
          <div className="absolute top-14 inset-x-0 bg-canvas border-b border-border py-4 px-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            {links.map(({ label, href, enabled }) => {
              const active = href === base ? pathname === base : pathname.startsWith(href)
              if (!enabled) {
                return <span key={href} className="text-sm uppercase tracking-widest text-muted/40 cursor-default">{label}</span>
              }
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={['text-sm uppercase tracking-widest transition-colors', active ? 'text-ink' : 'text-muted'].join(' ')}
                >
                  {label}
                </Link>
              )
            })}
            <button onClick={signOut} className="text-sm uppercase tracking-widest text-muted text-left mt-2 pt-4 border-t border-border">
              Salir
            </button>
          </div>
        </div>
      )}
    </>
  )
}

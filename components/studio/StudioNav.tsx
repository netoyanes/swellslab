'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FLAGS } from '@/lib/flags'
import { NotificationCenter } from '@/components/NotificationCenter'

export function StudioNav({ role }: { role?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links = [
    { label: 'Inicio', href: '/studio', enabled: true, exact: true },
    { label: 'Marcas', href: '/studio/brands', enabled: FLAGS.brands },
    { label: 'Tareas', href: '/studio/tasks', enabled: FLAGS.tasks },
    { label: 'Galerías', href: '/studio/galleries', enabled: true },
    { label: 'Clientes', href: '/studio/clients', enabled: true },
    { label: 'Cotizaciones', href: '/studio/quotes', enabled: FLAGS.quotes },
    { label: 'Facturas', href: '/studio/invoices', enabled: FLAGS.invoices },
    { label: 'Mensajes', href: '/studio/mensajes', enabled: FLAGS.messaging },
    { label: 'Equipo', href: '/studio/settings/team', enabled: role === 'master' },
  ]

  async function signOut() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-ink text-canvas border-b border-white/10">
        <div className="max-w-screen-2xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/studio" className="font-mono text-sm tracking-[0.2em] uppercase text-canvas">
              Swells Lab
            </Link>
            <nav className="hidden md:flex items-center gap-7">
              {links.map(({ label, href, enabled, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href)
                if (!enabled) {
                  return (
                    <span key={href} className="text-2xs uppercase tracking-widest text-canvas/30 cursor-default" title="Próximamente">
                      {label}
                    </span>
                  )
                }
                return (
                  <Link
                    key={href}
                    href={href}
                    className={['text-2xs uppercase tracking-widest transition-colors', active ? 'text-canvas' : 'text-canvas/50 hover:text-canvas'].join(' ')}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {FLAGS.notifications && <NotificationCenter dark />}
            <button onClick={signOut} className="hidden md:block text-2xs uppercase tracking-widest text-canvas/50 hover:text-canvas transition-colors">
              Salir
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden flex flex-col justify-center gap-1.5 w-6 h-6"
              aria-label="Menú"
            >
              <span className={['block h-px bg-canvas transition-all', open ? 'rotate-45 translate-y-[3.5px]' : ''].join(' ')} />
              <span className={['block h-px bg-canvas transition-all', open ? 'opacity-0' : ''].join(' ')} />
              <span className={['block h-px bg-canvas transition-all', open ? '-rotate-45 -translate-y-[3.5px]' : ''].join(' ')} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute top-14 inset-x-0 bg-ink border-b border-white/10 py-4 px-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            {links.map(({ label, href, enabled, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              if (!enabled) {
                return (
                  <span key={href} className="text-2xs uppercase tracking-widest text-canvas/30 cursor-default">{label}</span>
                )
              }
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={['text-sm uppercase tracking-widest transition-colors', active ? 'text-canvas' : 'text-canvas/50'].join(' ')}
                >
                  {label}
                </Link>
              )
            })}
            <button onClick={signOut} className="text-sm uppercase tracking-widest text-canvas/50 text-left mt-2 pt-4 border-t border-white/10">
              Salir
            </button>
          </div>
        </div>
      )}
    </>
  )
}

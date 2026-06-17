'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FLAGS } from '@/lib/flags'
import { NotificationCenter } from '@/components/NotificationCenter'

export function StudioNav() {
  const pathname = usePathname()

  const links = [
    { label: 'Inicio', href: '/studio', enabled: true, exact: true },
    { label: 'Marcas', href: '/studio/brands', enabled: FLAGS.brands },
    { label: 'Tareas', href: '/studio/tasks', enabled: FLAGS.tasks },
    { label: 'Galerías', href: '/studio/galleries', enabled: true },
    { label: 'Clientes', href: '/studio/clients', enabled: true },
    { label: 'Cotizaciones', href: '/studio/quotes', enabled: FLAGS.quotes },
    { label: 'Facturas', href: '/studio/invoices', enabled: FLAGS.invoices },
    { label: 'Mensajes', href: '/studio/mensajes', enabled: FLAGS.messaging },
  ]

  async function signOut() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 bg-ink text-canvas border-b border-white/10">
      <div className="max-w-screen-2xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/studio" className="font-mono text-sm tracking-[0.2em] uppercase text-canvas">
            Swells Lab
          </Link>
          <nav className="hidden sm:flex items-center gap-7">
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
        <div className="flex items-center gap-5">
          {FLAGS.notifications && <NotificationCenter dark />}
          <button onClick={signOut} className="text-2xs uppercase tracking-widest text-canvas/50 hover:text-canvas transition-colors">
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}

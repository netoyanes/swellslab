'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/supabase/types'

interface NavProps {
  client: Client
}

export function Nav({ client }: NavProps) {
  const pathname = usePathname()
  const base = `/${client.slug}`

  const links = [
    { label: 'Galerías', href: base },
    { label: 'Documentos', href: `${base}/documentos` },
    { label: 'Pagos', href: `${base}/pagos` },
  ]

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 bg-canvas/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-screen-xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Client name */}
        <Link
          href={base}
          className="font-display text-base tracking-wide text-ink hover:text-ink/70 transition-colors"
        >
          {client.name}
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-8">
          {links.map(({ label, href }) => {
            const active = href === base
              ? pathname === base
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'text-2xs uppercase tracking-widest transition-colors',
                  active ? 'text-ink' : 'text-muted hover:text-ink',
                ].join(' ')}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
        >
          Salir
        </button>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden border-t border-border flex">
        {links.map(({ label, href }) => {
          const active = href === base
            ? pathname === base
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex-1 py-2.5 text-center text-2xs uppercase tracking-widest transition-colors',
                active ? 'text-ink' : 'text-muted',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}

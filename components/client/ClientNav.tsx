'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FLAGS } from '@/lib/flags'

export function ClientNav({ clientSlug, clientName }: { clientSlug: string; clientName: string }) {
  const pathname = usePathname()
  const base = `/c/${clientSlug}`

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
    <header className="fixed top-0 inset-x-0 z-40 h-14 bg-canvas/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-screen-xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={base} className="font-mono text-sm tracking-[0.2em] uppercase hover:opacity-70 transition-opacity" style={{ color: '#333232' }}>
            Swells Lab
          </Link>
          <span className="text-border">·</span>
          <span className="font-sans text-xs text-muted uppercase tracking-widest">{clientName}</span>
        </div>

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

        <button onClick={signOut} className="text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors">
          Salir
        </button>
      </div>
    </header>
  )
}

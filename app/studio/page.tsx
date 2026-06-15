import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function StudioDashboard() {
  const supabase = await createClient()

  const [{ count: clientCount }, { count: galleryCount }, { count: assetCount }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('galleries').select('*', { count: 'exact', head: true }),
    supabase.from('assets').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Clientes', value: clientCount ?? 0 },
    { label: 'Galerías', value: galleryCount ?? 0 },
    { label: 'Fotos', value: assetCount ?? 0 },
  ]

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-2xs uppercase tracking-widest text-muted mb-3">Studio</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Buenas tardes</h1>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border mb-12 max-w-lg">
        {stats.map((s) => (
          <div key={s.label} className="bg-canvas px-6 py-8">
            <p className="font-display text-4xl text-ink font-light tabular-nums">{s.value}</p>
            <p className="mt-1 text-2xs uppercase tracking-widest text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/studio/galleries/new" className="px-5 py-3 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 transition-colors">
          Nueva galería
        </Link>
        <Link href="/studio/galleries" className="px-5 py-3 border border-border text-ink text-2xs uppercase tracking-widest hover:border-ink transition-colors">
          Ver galerías
        </Link>
      </div>
    </main>
  )
}

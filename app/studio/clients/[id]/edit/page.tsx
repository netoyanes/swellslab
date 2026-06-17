import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/studio/ClientForm'
import type { Client } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Editar cliente' }

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!data) notFound()
  const c = data as Client

  return (
    <main className="max-w-screen-xl mx-auto px-6 py-16">
      <p className="text-2xs uppercase tracking-widest text-muted mb-3">Clientes · {c.name}</p>
      <h1 className="font-display text-4xl text-ink font-light mb-12">Editar cliente</h1>
      <ClientForm id={id} initial={{ name: c.name, accent_color: c.accent_color, onboarded_at: c.onboarded_at }} />
    </main>
  )
}

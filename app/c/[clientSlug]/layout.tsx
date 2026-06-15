import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientNav } from '@/components/client/ClientNav'
import type { Client } from '@/lib/supabase/types'

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS: a client sees only their own client row; an admin sees all.
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', clientSlug)
    .single()

  if (!data) notFound()
  const client = data as Client

  return (
    <>
      <ClientNav clientSlug={client.slug} clientName={client.name} />
      <div className="pt-14 min-h-screen">{children}</div>
    </>
  )
}

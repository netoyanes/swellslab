import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/Nav'
import type { Client } from '@/lib/supabase/types'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ client: string }>
}) {
  const { client: slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('clients')
    .select('*, client_users!inner(user_id)')
    .eq('slug', slug)
    .eq('client_users.user_id', user.id)
    .single()

  if (!data) notFound()

  const client = data as unknown as Client

  return (
    <>
      <Nav client={client} />
      <div className="pt-14 sm:pt-14 min-h-screen">
        {children}
      </div>
    </>
  )
}

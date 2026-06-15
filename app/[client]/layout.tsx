import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/Nav'

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

  // Fetch client and verify the user belongs to it
  const { data: clientData } = await supabase
    .from('clients')
    .select('*, client_users!inner(user_id)')
    .eq('slug', slug)
    .eq('client_users.user_id', user.id)
    .single()

  if (!clientData) notFound()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { client_users: _, ...client } = clientData as typeof clientData & { client_users: unknown }

  return (
    <>
      <Nav client={client} />
      <div className="pt-14 sm:pt-14 min-h-screen">
        {children}
      </div>
    </>
  )
}

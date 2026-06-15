import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Find the client associated with this user
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('clients(slug)')
    .eq('user_id', user.id)
    .single()

  const slug = (clientUser?.clients as { slug: string } | null)?.slug
  if (slug) redirect(`/${slug}`)

  redirect('/login')
}

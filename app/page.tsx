import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('client_users')
    .select('clients(slug)')
    .eq('user_id', user.id)
    .single()

  const row = data as { clients: { slug: string } | null } | null
  const slug = row?.clients?.slug
  if (slug) redirect(`/${slug}`)

  redirect('/login')
}

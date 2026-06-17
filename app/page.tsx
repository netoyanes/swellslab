import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { isStudioRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  if (isStudioRole(profile.role)) redirect('/studio')

  if (profile.client_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('clients')
      .select('slug')
      .eq('id', profile.client_id)
      .single()
    const slug = (data as { slug: string } | null)?.slug
    if (slug) redirect(`/c/${slug}`)
  }

  redirect('/login')
}

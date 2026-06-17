import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { isMaster } from '@/lib/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { TeamManager } from './TeamManager'
import type { Profile } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Equipo' }

export default async function TeamPage() {
  const profile = await getProfile()
  if (!profile || !isMaster(profile.role)) redirect('/studio')

  const admin = createAdminClient()
  const { data: members } = await admin
    .from('profiles')
    .select('id, email, full_name, role')
    .in('role', ['master', 'admin', 'staff'])
    .order('role')

  const { data: authList } = await admin.auth.admin.listUsers()
  const confirmedIds = new Set(
    (authList?.users ?? []).filter((u) => u.email_confirmed_at).map((u) => u.id),
  )

  const team = ((members ?? []) as Pick<Profile, 'id' | 'email' | 'full_name' | 'role'>[]).map((m) => ({
    ...m,
    confirmed: confirmedIds.has(m.id),
  }))

  return (
    <main className="max-w-screen-md mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-12">
        <p className="text-2xs uppercase tracking-widest text-muted mb-3">Configuración</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Equipo</h1>
      </div>
      <TeamManager currentUserId={profile.id} members={team} />
    </main>
  )
}

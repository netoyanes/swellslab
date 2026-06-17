import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { isStudioRole } from '@/lib/roles'
import { StudioNav } from '@/components/studio/StudioNav'

export const metadata = { title: 'Studio' }

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  // Middleware already gates /studio to studio roles; this is defense-in-depth.
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!isStudioRole(profile.role)) redirect('/')

  return (
    <>
      <StudioNav role={profile.role ?? undefined} />
      <div className="pt-14 min-h-screen bg-canvas">{children}</div>
    </>
  )
}

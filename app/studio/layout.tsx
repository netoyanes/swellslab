import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { StudioNav } from '@/components/studio/StudioNav'

export const metadata = { title: 'Studio' }

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  // Middleware already gates /studio to admins; this is defense-in-depth.
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/')

  return (
    <>
      <StudioNav />
      <div className="pt-14 min-h-screen bg-canvas">{children}</div>
    </>
  )
}

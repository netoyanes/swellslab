import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notify'

// Sends a test notification to the current user (in-app + push).
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  await notify({
    userIds: [user.id],
    type: 'test',
    title: 'Notificación de prueba',
    body: 'Si ves esto, las notificaciones funcionan ✓',
    link: '/studio',
  })
  return NextResponse.json({ ok: true })
}

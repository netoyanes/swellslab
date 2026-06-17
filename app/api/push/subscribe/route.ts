import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Stores a Web Push subscription for the current user.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const sub = await req.json().catch(() => null)
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ ok: false, error: 'invalid subscription' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: req.headers.get('user-agent') ?? null,
    },
    { onConflict: 'endpoint' },
  )
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET → recent notifications for current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [], unread: 0 })

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const items = data ?? []
  const unread = (items as { read_at: string | null }[]).filter((n) => !n.read_at).length
  return NextResponse.json({ items, unread })
}

// POST → mark all (or one) as read. body: { id?: string }
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const now = new Date().toISOString()
  const q = supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null)
  if (body?.id) q.eq('id', body.id)
  await q
  return NextResponse.json({ ok: true })
}

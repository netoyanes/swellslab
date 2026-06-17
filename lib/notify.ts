import 'server-only'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:neto@swells.mx'

let vapidReady = false
function ensureVapid(): boolean {
  if (vapidReady) return true
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  vapidReady = true
  return true
}

interface NotifyInput {
  userIds: string[]
  type: string
  title: string
  body?: string
  link?: string
  push?: boolean
}

// Creates in-app notifications for each recipient and (optionally) fires
// Web Push. Safe to call without VAPID keys — push is skipped silently.
export async function notify({ userIds, type, title, body, link, push = true }: NotifyInput): Promise<void> {
  const recipients = [...new Set(userIds)].filter(Boolean)
  if (recipients.length === 0) return

  const admin = createAdminClient()

  // 1. In-app rows
  await admin.from('notifications').insert(
    recipients.map((user_id) => ({ user_id, type, title, body: body ?? null, link: link ?? null })),
  )

  // 2. Web Push
  if (!push || !ensureVapid()) return

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', recipients)

  const payload = JSON.stringify({ title, body: body ?? '', link: link ?? '/' })

  await Promise.all(
    ((subs ?? []) as { id: string; endpoint: string; p256dh: string; auth: string }[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        )
      } catch (err: unknown) {
        // 404/410 → subscription expired; clean it up
        const code = (err as { statusCode?: number })?.statusCode
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    }),
  )
}

'use server'

import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'
import { isMaster } from '@/lib/roles'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireMaster() {
  const profile = await getProfile()
  if (!profile || !isMaster(profile.role)) throw new Error('unauthorized')
}

export type StaffRole = 'admin' | 'staff'

export async function inviteStaffMember(email: string, role: StaffRole): Promise<{ error: string } | { ok: true }> {
  await requireMaster()
  const admin = createAdminClient()

  // Check if user already exists
  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list?.users.find((u) => u.email === email)

  if (existing) {
    // Just update their role if they're already in the system
    await admin.from('profiles').upsert({ id: existing.id, email, role })
    revalidatePath('/studio/settings/team')
    return { ok: true }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/studio`,
  })
  if (invErr) return { error: invErr.message }

  await admin.from('profiles').upsert({
    id: inv.user.id,
    email,
    role,
  })

  revalidatePath('/studio/settings/team')
  return { ok: true }
}

export async function updateStaffRole(userId: string, role: StaffRole): Promise<void> {
  await requireMaster()
  const admin = createAdminClient()
  await admin.from('profiles').update({ role }).eq('id', userId)
  revalidatePath('/studio/settings/team')
}

export async function removeStaffMember(userId: string): Promise<void> {
  await requireMaster()
  const admin = createAdminClient()
  // Revoke studio access by setting role to null / removing — we delete the auth user
  await admin.auth.admin.deleteUser(userId)
  revalidatePath('/studio/settings/team')
}

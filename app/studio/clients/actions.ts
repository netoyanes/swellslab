'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export interface ClientInput {
  name: string
  accent_color?: string | null
  onboarded_at?: string | null
}

export async function createClientRecord(input: ClientInput): Promise<{ id: string; slug: string } | { error: string }> {
  const supabase = await createClient()
  const slug = slugify(input.name)
  const { data, error } = await supabase
    .from('clients')
    .insert({ name: input.name, slug, accent_color: input.accent_color ?? null, onboarded_at: input.onboarded_at ?? null })
    .select('id, slug')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/studio/clients')
  return data as { id: string; slug: string }
}

export async function updateClientRecord(id: string, input: ClientInput): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({ name: input.name, accent_color: input.accent_color ?? null, onboarded_at: input.onboarded_at ?? null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/studio/clients')
  revalidatePath(`/studio/clients/${id}`)
  return null
}

// Invite a user to the portal: creates the auth user (or reuses) and links
// them to the client. Returns the user's email on success.
export async function inviteClientUser(clientId: string, email: string): Promise<{ error: string } | { ok: true }> {
  const admin = createAdminClient()

  // Check if auth user already exists — use listUsers to search by email.
  const { data: list } = await admin.auth.admin.listUsers()
  let userId = list?.users.find((u) => u.email === email)?.id

  if (!userId) {
    // Send a proper invitation email with a one-click sign-in link.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/`,
    })
    if (invErr) return { error: invErr.message }
    userId = inv.user.id

    // Pre-create profile so the app knows them on first login.
    await admin.from('profiles').upsert({
      id: userId,
      email,
      role: 'client',
      client_id: clientId,
    })
  }

  // Link to client (ignore if already linked)
  const { error: linkErr } = await admin
    .from('client_users')
    .upsert({ client_id: clientId, user_id: userId }, { onConflict: 'client_id,user_id' })
  if (linkErr) return { error: linkErr.message }

  // Update their profile client_id if it wasn't set
  await admin
    .from('profiles')
    .update({ client_id: clientId, role: 'client' })
    .eq('id', userId)
    .is('client_id', null)

  revalidatePath(`/studio/clients/${clientId}`)
  return { ok: true }
}

export async function removeClientUser(clientId: string, userId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('client_users').delete().eq('client_id', clientId).eq('user_id', userId)
  revalidatePath(`/studio/clients/${clientId}`)
}

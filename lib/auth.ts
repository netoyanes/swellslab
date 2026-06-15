import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

// Resolves the current user's profile (role + client_id) server-side.
// Returns null when unauthenticated.
export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return (data as Profile | null) ?? null
  } catch {
    return null
  }
}

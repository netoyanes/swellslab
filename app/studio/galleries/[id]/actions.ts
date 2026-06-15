'use server'

import { createClient } from '@/lib/supabase/server'

export async function generateShareToken(galleryId: string): Promise<string> {
  const supabase = await createClient()

  // Check if token already exists
  const { data } = await supabase
    .from('galleries')
    .select('share_token')
    .eq('id', galleryId)
    .single()

  const existing = (data as { share_token?: string | null } | null)?.share_token
  if (existing) return existing

  // Generate and save a new token
  const token = crypto.randomUUID()
  await supabase
    .from('galleries')
    .update({ share_token: token })
    .eq('id', galleryId)

  return token
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export interface NewBrandInput {
  client_id: string
  name: string
  tagline?: string | null
  accent_color?: string | null
}

export async function createBrand(input: NewBrandInput): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .insert({
      client_id: input.client_id,
      name: input.name,
      slug: slugify(input.name),
      tagline: input.tagline || null,
      accent_color: input.accent_color || null,
      active: true,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/studio/brands')
  return { id: (data as { id: string }).id }
}

'use server'

import { createClient } from '@/lib/supabase/server'

// Returns the brand's conversation, creating one if it doesn't exist.
export async function ensureConversation(brandId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('brand_id', brandId)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (existing) return (existing as { id: string }).id

  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ brand_id: brandId, created_by: user?.id ?? null })
    .select('id')
    .single()
  if (error || !data) return null
  return (data as { id: string }).id
}

export async function saveExchange(conversationId: string, userText: string, assistantText: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('ai_messages').insert([
    { conversation_id: conversationId, role: 'user', content: userText },
    { conversation_id: conversationId, role: 'assistant', content: assistantText },
  ])
  await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
}

export async function clearConversation(conversationId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('ai_messages').delete().eq('conversation_id', conversationId)
}

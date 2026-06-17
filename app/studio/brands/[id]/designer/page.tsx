import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesignerChat } from '@/components/studio/DesignerChat'
import { ensureConversation } from './actions'
import type { Brand, AiMessage } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Diseñador IA' }

export default async function DesignerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: brandData } = await supabase.from('brands').select('id, name').eq('id', id).single()
  if (!brandData) notFound()
  const brand = brandData as Pick<Brand, 'id' | 'name'>

  const conversationId = await ensureConversation(id)

  let initialMessages: { role: 'user' | 'assistant'; content: string }[] = []
  if (conversationId) {
    const { data: msgs } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at')
    initialMessages = (msgs ?? []) as Pick<AiMessage, 'role' | 'content'>[]
  }

  return (
    <DesignerChat
      brandId={brand.id}
      brandName={brand.name}
      conversationId={conversationId}
      initialMessages={initialMessages}
    />
  )
}

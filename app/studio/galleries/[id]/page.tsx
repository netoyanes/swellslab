import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GalleryEditor } from '@/components/studio/GalleryEditor'
import { generateShareToken } from './actions'
import type { Gallery, Asset, Client } from '@/lib/supabase/types'

type Row = Gallery & { clients: Pick<Client, 'name' | 'slug'> | null }

export default async function GalleryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: gData } = await supabase
    .from('galleries')
    .select('*, clients(name, slug)')
    .eq('id', id)
    .single()

  if (!gData) notFound()
  const gallery = gData as unknown as Row

  const { data: aData } = await supabase
    .from('assets')
    .select('*')
    .eq('gallery_id', id)
    .order('display_order', { ascending: true })

  const assets = (aData ?? []) as Asset[]

  return (
    <GalleryEditor
      gallery={gallery}
      clientName={gallery.clients?.name ?? ''}
      clientSlug={gallery.clients?.slug ?? ''}
      initialAssets={assets}
      generateShareToken={generateShareToken}
    />
  )
}

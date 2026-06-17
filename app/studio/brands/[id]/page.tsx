import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandHub } from '@/components/studio/BrandHub'
import type { Brand, BrandAsset, DesignRef, Client, Gallery } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type BrandRow = Brand & { clients: Pick<Client, 'name' | 'slug'> | null }

export default async function BrandHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: bData } = await supabase
    .from('brands')
    .select('*, clients(name, slug)')
    .eq('id', id)
    .single()

  if (!bData) notFound()
  const brand = bData as unknown as BrandRow

  const [{ data: assetData }, { data: refData }, { data: galleryData }] = await Promise.all([
    supabase.from('brand_assets').select('*').eq('brand_id', id).order('display_order'),
    supabase.from('design_refs').select('*').eq('brand_id', id).order('display_order'),
    supabase.from('galleries').select('id, title, slug, published, brand_id').eq('brand_id', id).order('created_at', { ascending: false }),
  ])

  return (
    <BrandHub
      brand={brand}
      clientName={brand.clients?.name ?? ''}
      clientSlug={brand.clients?.slug ?? ''}
      initialAssets={(assetData ?? []) as BrandAsset[]}
      initialRefs={(refData ?? []) as DesignRef[]}
      galleries={(galleryData ?? []) as Pick<Gallery, 'id' | 'title' | 'slug' | 'published' | 'brand_id'>[]}
    />
  )
}

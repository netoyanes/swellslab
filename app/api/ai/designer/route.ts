import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { isStudioRole } from '@/lib/roles'
import { getAnthropic, buildSystemPrompt, DESIGNER_MODEL, type BrandContext } from '@/lib/ai/designer'
import type { Brand, DesignRef, BrandAsset } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface Body {
  brandId: string
  messages: { role: 'user' | 'assistant'; content: string }[]
}

export async function POST(req: NextRequest) {
  const profile = await getProfile()
  if (!profile || !isStudioRole(profile.role)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const anthropic = getAnthropic()
  if (!anthropic) {
    return NextResponse.json({ error: 'AI no configurada. Agrega ANTHROPIC_API_KEY.' }, { status: 503 })
  }

  const body = (await req.json()) as Body
  if (!body.brandId || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const supabase = await createClient()
  const [{ data: brandData }, { data: refData }, { data: assetData }] = await Promise.all([
    supabase.from('brands').select('*, clients(name)').eq('id', body.brandId).single(),
    supabase.from('design_refs').select('*').eq('brand_id', body.brandId),
    supabase.from('brand_assets').select('category').eq('brand_id', body.brandId),
  ])
  if (!brandData) return NextResponse.json({ error: 'brand not found' }, { status: 404 })

  const brand = brandData as unknown as Brand & { clients: { name: string } | null }
  const refs = (refData ?? []) as DesignRef[]
  const assets = (assetData ?? []) as Pick<BrandAsset, 'category'>[]

  const catCounts = new Map<string, number>()
  assets.forEach((a) => {
    const c = a.category || 'Sin categoría'
    catCounts.set(c, (catCounts.get(c) ?? 0) + 1)
  })

  const ctx: BrandContext = {
    brandName: brand.name,
    tagline: brand.tagline,
    clientName: brand.clients?.name ?? '',
    accentColor: brand.accent_color,
    colors: refs.filter((r) => r.kind === 'color').map((r) => ({ label: r.label, value: r.value ?? '' })),
    fonts: refs.filter((r) => r.kind === 'font').map((r) => ({ label: r.label, description: r.description })),
    links: refs.filter((r) => ['figma', 'drive', 'link'].includes(r.kind)).map((r) => ({ kind: r.kind, label: r.label, url: r.url })),
    assetCategories: [...catCounts.entries()].map(([category, count]) => ({ category, count })),
  }

  const system = buildSystemPrompt(ctx)
  const messages = body.messages.slice(-20).map((m) => ({ role: m.role, content: m.content }))

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const run = anthropic.messages.stream({
          model: DESIGNER_MODEL,
          max_tokens: 8000,
          system,
          messages,
        })
        run.on('text', (delta) => controller.enqueue(encoder.encode(delta)))
        await run.finalMessage()
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${(err as Error).message}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

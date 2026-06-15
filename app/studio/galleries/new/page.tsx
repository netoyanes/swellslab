import { createClient } from '@/lib/supabase/server'
import { NewGalleryForm } from '@/components/studio/NewGalleryForm'
import type { Client } from '@/lib/supabase/types'

export const metadata = { title: 'Nueva galería' }

export default async function NewGalleryPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('id, name, slug').order('name')
  const clients = (data ?? []) as Pick<Client, 'id' | 'name' | 'slug'>[]

  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-2xs uppercase tracking-widest text-muted mb-3">Nueva galería</p>
        <h1 className="font-display text-4xl text-ink font-light">Crear galería</h1>
      </div>
      <NewGalleryForm clients={clients} />
    </main>
  )
}

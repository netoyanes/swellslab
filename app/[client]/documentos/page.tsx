import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { documentUrl, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Documentos' }

const typeLabel: Record<string, string> = {
  contract: 'Contrato',
  proposal: 'Propuesta',
  report: 'Reporte',
  other: 'Documento',
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ client: string }>
}) {
  const { client: slug } = await params
  const supabase = await createClient()

  const { data: clientData } = await supabase
    .from('clients')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!clientData) notFound()
  const client = clientData as { id: string; name: string }

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-screen-lg mx-auto px-6 py-16 md:py-20">
      <div className="mb-14">
        <p className="text-2xs uppercase tracking-widest text-muted mb-3">
          {client.name}
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-ink font-light">
          Documentos
        </h1>
      </div>

      {!documents?.length ? (
        <p className="text-muted text-sm">No hay documentos disponibles.</p>
      ) : (
        <ul className="divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.id}>
              <a
                href={documentUrl(doc.storage_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-5 group"
              >
                <div className="space-y-0.5">
                  <p className="text-sm text-ink group-hover:opacity-60 transition-opacity">
                    {doc.title}
                  </p>
                  <p className="text-2xs text-muted uppercase tracking-widest">
                    {typeLabel[doc.document_type] ?? 'Documento'}
                    {' · '}
                    {formatDate(doc.created_at)}
                  </p>
                </div>
                <svg
                  className="text-muted group-hover:text-ink transition-colors flex-none ml-6"
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

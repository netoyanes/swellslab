import { ClientForm } from '@/components/studio/ClientForm'

export const metadata = { title: 'Nuevo cliente' }

export default function NewClientPage() {
  return (
    <main className="max-w-screen-xl mx-auto px-6 py-16">
      <p className="text-2xs uppercase tracking-widest text-muted mb-3">Clientes</p>
      <h1 className="font-display text-4xl text-ink font-light mb-12">Nuevo cliente</h1>
      <ClientForm />
    </main>
  )
}

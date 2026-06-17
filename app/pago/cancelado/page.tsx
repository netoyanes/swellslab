export const metadata = { title: 'Pago cancelado' }

export default function PagoCancelado() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl text-ink font-light mb-3">Pago cancelado</h1>
      <p className="text-sm text-muted max-w-sm">No se realizó ningún cargo. Puedes intentarlo de nuevo desde tu portal.</p>
      <a href="/c" className="mt-8 text-2xs uppercase tracking-widest text-ink hover:opacity-60">Volver a mi portal →</a>
    </main>
  )
}

export const metadata = { title: 'Pago confirmado' }

export default function PagoExito() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-6">✓</div>
      <h1 className="font-display text-3xl text-ink font-light mb-3">Pago confirmado</h1>
      <p className="text-sm text-muted max-w-sm">Gracias. Tu recibo estará disponible en tu portal en unos momentos.</p>
      <a href="/c" className="mt-8 text-2xs uppercase tracking-widest text-ink hover:opacity-60">Ir a mi portal →</a>
    </main>
  )
}

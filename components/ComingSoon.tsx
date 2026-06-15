export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <main className="max-w-screen-lg mx-auto px-6 py-24 md:py-32">
      <p className="text-2xs uppercase tracking-widest text-muted mb-3">{title}</p>
      <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Próximamente</h1>
      <p className="mt-5 text-sm text-muted leading-relaxed max-w-sm">
        {note ?? 'Esta sección estará disponible muy pronto.'}
      </p>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('No pudimos enviar el enlace. Intenta de nuevo.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Wordmark */}
        <div className="mb-14 text-center">
          <span className="font-display text-2xl tracking-widest uppercase text-ink/40 select-none">
            Swells Lab
          </span>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <p className="font-display text-2xl text-ink">Revisa tu correo</p>
            <p className="text-sm text-muted leading-relaxed">
              Enviamos un enlace de acceso a{' '}
              <span className="text-ink">{email}</span>.
              <br />
              Expira en 10 minutos.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="mt-6 text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-2xs uppercase tracking-widest text-muted"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@correo.com"
                className="w-full bg-transparent border-b border-border pb-3 text-sm text-ink placeholder:text-muted/50 outline-none focus:border-ink transition-colors"
              />
            </div>

            {error && (
              <p className="text-2xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full mt-2 py-3.5 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Enviando…' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

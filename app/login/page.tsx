'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'password' | 'magic'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(`No se pudo entrar: ${error.message}`)
          setLoading(false)
          return
        }
        router.push('/')
        router.refresh()
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(`No pudimos enviar el enlace: ${error.message}`)
      else setSent(true)
      setLoading(false)
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  const field = 'w-full bg-transparent border-b border-border pb-3 text-sm text-ink placeholder:text-muted/50 outline-none focus:border-ink transition-colors'
  const lbl = 'block text-2xs uppercase tracking-widest text-muted'

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-14 text-center">
          <span className="font-mono text-xl tracking-[0.22em] uppercase select-none" style={{ color: '#333232' }}>Swells Lab</span>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <p className="font-display text-2xl text-ink">Revisa tu correo</p>
            <p className="text-sm text-muted leading-relaxed">
              Enviamos un enlace de acceso a <span className="text-ink">{email}</span>.
            </p>
            <button onClick={() => setSent(false)} className="mt-6 text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors">
              Volver
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className={lbl}>Correo electrónico</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="tu@correo.com" className={field} />
            </div>

            {mode === 'password' && (
              <div className="space-y-1.5">
                <label htmlFor="password" className={lbl}>Contraseña</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" className={field} />
              </div>
            )}

            {error && <p className="text-2xs text-red-500">{error}</p>}

            <button type="submit" disabled={loading || !email || (mode === 'password' && !password)} className="w-full mt-2 py-3.5 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-40 transition-colors">
              {loading ? 'Entrando…' : mode === 'password' ? 'Entrar' : 'Enviar enlace de acceso'}
            </button>

            <button
              type="button"
              onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError(null) }}
              className="w-full text-center text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
            >
              {mode === 'password' ? 'Prefiero un enlace por correo' : 'Usar contraseña'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { saveExchange, clearConversation } from '@/app/studio/brands/[id]/designer/actions'

interface Msg { role: 'user' | 'assistant'; content: string }

interface Props {
  brandId: string
  brandName: string
  conversationId: string | null
  initialMessages: Msg[]
}

const SUGGESTIONS = [
  'Escribe 5 captions para Instagram con el tono de la marca',
  'Propón 3 direcciones creativas para la próxima campaña',
  'Nombra la paleta de color y describe cada tono',
  'Dame un brief para una sesión de fotos editorial',
]

export function DesignerChat({ brandId, brandName, conversationId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  const send = useCallback(async (text: string) => {
    const prompt = text.trim()
    if (!prompt || streaming) return
    setInput('')
    const history = [...messages, { role: 'user' as const, content: prompt }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, messages: history }),
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Error de conexión' }))
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: `⚠ ${err.error ?? 'Error'}` }; return c })
        setStreaming(false)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: acc }; return c })
      }
      if (conversationId && acc) await saveExchange(conversationId, prompt, acc).catch(() => {})
    } catch (e) {
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: `⚠ ${(e as Error).message}` }; return c })
    } finally {
      setStreaming(false)
    }
  }, [brandId, conversationId, messages, streaming])

  async function clearAll() {
    if (!confirm('¿Borrar toda la conversación?')) return
    setMessages([])
    if (conversationId) await clearConversation(conversationId).catch(() => {})
  }

  return (
    <main className="max-w-3xl mx-auto px-6 pt-8 pb-40 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/studio/brands/${brandId}`} className="text-2xs uppercase tracking-widest text-muted hover:text-ink">← {brandName}</Link>
          <h1 className="font-display text-3xl text-ink font-light mt-2">✦ Diseñador IA</h1>
        </div>
        {messages.length > 0 && (
          <button onClick={clearAll} className="text-2xs uppercase tracking-widest text-muted hover:text-red-500">Limpiar</button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6">
        {messages.length === 0 ? (
          <div className="py-10">
            <p className="text-sm text-muted mb-6">Tu director creativo, con todo el sistema de diseño de <span className="text-ink">{brandName}</span> en contexto. Prueba con:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-left p-4 border border-border text-sm text-ink hover:bg-surface transition-colors leading-snug">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={[
                'max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                m.role === 'user' ? 'bg-ink text-canvas rounded-2xl rounded-br-sm' : 'bg-surface text-ink rounded-2xl rounded-bl-sm border border-border',
              ].join(' ')}>
                {m.content || (streaming && i === messages.length - 1 ? <span className="text-muted">escribiendo…</span> : '')}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-canvas via-canvas to-transparent pt-10 pb-6">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-end gap-2 bg-canvas border border-border rounded-2xl px-3 py-2 focus-within:border-ink transition-colors">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              rows={1}
              placeholder={`Pídele algo al diseñador de ${brandName}…`}
              className="flex-1 bg-transparent resize-none text-sm text-ink placeholder:text-muted/60 focus:outline-none py-2 max-h-40"
            />
            <button
              onClick={() => send(input)}
              disabled={streaming || !input.trim()}
              className="flex-none w-9 h-9 rounded-full bg-ink text-canvas flex items-center justify-center disabled:opacity-30 hover:bg-ink/90 transition-colors"
              aria-label="Enviar"
            >
              ↑
            </button>
          </div>
          <p className="text-2xs text-muted/60 text-center mt-2">El Diseñador IA puede cometer errores. Revisa lo importante.</p>
        </div>
      </div>
    </main>
  )
}

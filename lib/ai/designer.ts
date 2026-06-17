import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

// Default model — Anthropic's most capable Opus-tier model.
export const DESIGNER_MODEL = 'claude-opus-4-8'

let _client: Anthropic | null | undefined
export function getAnthropic(): Anthropic | null {
  if (_client !== undefined) return _client
  const key = process.env.ANTHROPIC_API_KEY
  _client = key ? new Anthropic({ apiKey: key }) : null
  return _client
}

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY

export interface BrandContext {
  brandName: string
  tagline: string | null
  clientName: string
  accentColor: string | null
  colors: { label: string; value: string }[]
  fonts: { label: string; description: string | null }[]
  links: { kind: string; label: string; url: string | null }[]
  assetCategories: { category: string; count: number }[]
}

// Builds the system prompt that gives the agent its persona + the brand's
// full design-system context, so its output is on-brand by construction.
export function buildSystemPrompt(ctx: BrandContext): string {
  const lines: string[] = []
  lines.push(
    `Eres el Diseñador IA de Swells Lab, un estudio de fotografía y arquitectura. ` +
      `Trabajas como director creativo y copywriter para la marca "${ctx.brandName}"` +
      (ctx.clientName ? ` del cliente ${ctx.clientName}.` : '.'),
  )
  if (ctx.tagline) lines.push(`Tagline de la marca: "${ctx.tagline}".`)

  lines.push('\n## Sistema de diseño de la marca')
  if (ctx.accentColor) lines.push(`- Color de acento principal: ${ctx.accentColor}`)
  if (ctx.colors.length) {
    lines.push('- Paleta de color:')
    ctx.colors.forEach((c) => lines.push(`  · ${c.label || 'color'}: ${c.value}`))
  }
  if (ctx.fonts.length) {
    lines.push('- Tipografías:')
    ctx.fonts.forEach((f) => lines.push(`  · ${f.label}${f.description ? ` — ${f.description}` : ''}`))
  }
  if (ctx.links.length) {
    lines.push('- Referencias y enlaces:')
    ctx.links.forEach((l) => lines.push(`  · ${l.kind} — ${l.label}${l.url ? ` (${l.url})` : ''}`))
  }
  if (ctx.assetCategories.length) {
    lines.push('- Assets disponibles:')
    ctx.assetCategories.forEach((a) => lines.push(`  · ${a.category}: ${a.count} archivo(s)`))
  }

  lines.push(
    `\n## Cómo trabajas\n` +
      `- Respondes en español, con voz refinada, editorial y techy a la vez — el tono de Swells Lab.\n` +
      `- Toda propuesta debe ser coherente con el sistema de diseño de arriba. Si sugieres color o tipografía, justifícalo con la paleta y fuentes de la marca.\n` +
      `- Ayudas con: copy y captions, conceptos de campaña, naming de paletas, briefs creativos, ideas de sesión de fotos, estructura de moodboards, textos para web/redes, y dirección de arte.\n` +
      `- Cuando entregues varias opciones, numéralas y sé conciso. Lidera con la propuesta, no con preámbulo.\n` +
      `- Si te falta contexto crítico, haz una sola pregunta breve; si no, propón y avanza.\n` +
      `- Responde solo con tu respuesta final, sin narrar tu razonamiento ni meta-comentarios sobre tu proceso.`,
  )

  return lines.join('\n')
}

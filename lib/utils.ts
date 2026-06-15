const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export function photoUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/render/image/public/photos/${storagePath}`
}

export function documentUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/documents/${storagePath}`
}

export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function shootMeta(gallery: {
  shoot_date: string | null
  location: string | null
  lens: string | null
}): string {
  const parts: string[] = []
  if (gallery.shoot_date) parts.push(formatDate(gallery.shoot_date))
  if (gallery.location) parts.push(gallery.location)
  if (gallery.lens) parts.push(gallery.lens)
  return parts.join(' · ')
}

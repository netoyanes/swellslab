const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Public CDN render endpoint for the images bucket (transforms + srcset).
export function imageUrl(storagePath: string, width?: number): string {
  const base = `${SUPABASE_URL}/storage/v1/render/image/public/images/${storagePath}`
  return width ? `${base}?width=${width}&resize=contain` : base
}

// Back-compat alias used by gallery components.
export const photoUrl = (storagePath: string) => imageUrl(storagePath)

// Public object URL (non-transformed), for downloads.
export function objectUrl(bucket: string, storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`
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

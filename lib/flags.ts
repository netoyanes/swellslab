// Feature flags. The gallery ships; everything else is scaffolded
// behind "coming soon" states so the IA is in place but nothing
// half-built is exposed.
export const FLAGS = {
  galleries: true,
  brands: true,
  tasks: true,
  notifications: true,
  documents: false,
  videos: false,
  invoices: false,
  messaging: false,
} as const

export type FeatureFlag = keyof typeof FLAGS
export const isEnabled = (f: FeatureFlag) => FLAGS[f]

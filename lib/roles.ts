import type { Role } from '@/lib/supabase/types'

// Studio-side roles can access /studio/*. Client is portal-only.
const STUDIO_ROLES: Role[] = ['master', 'staff', 'admin']

export const isStudioRole = (role: Role | null | undefined): boolean =>
  !!role && STUDIO_ROLES.includes(role)

export const isMaster = (role: Role | null | undefined): boolean => role === 'master'

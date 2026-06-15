import { createClient } from '@supabase/supabase-js'

// Service-role client. SERVER-ONLY. Bypasses RLS — never import in
// client components. Used for signed-URL generation and trusted ops.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

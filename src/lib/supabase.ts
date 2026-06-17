import { createClient } from '@supabase/supabase-js'

// Cliente para uso en el browser (respeta RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

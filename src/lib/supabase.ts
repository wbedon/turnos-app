import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente para uso en el browser (respeta RLS)
export const supabase = createClient(url, anon)

// Cliente para uso en el servidor / API routes (bypasea RLS)
export const supabaseAdmin = createClient(url, service)

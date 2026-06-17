import { createSupabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import LoginForm from './LoginForm'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <LoginForm />

  const { data: queues } = await supabaseAdmin
    .from('queues')
    .select('*')
    .eq('is_active', true)
    .order('prefix')

  return <AdminClient queues={queues ?? []} userEmail={user.email ?? ''} />
}

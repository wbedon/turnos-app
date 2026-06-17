'use server'

import { createSupabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendPushToTokens } from '@/lib/push'
import { redirect } from 'next/navigation'

export async function resetDailyQueues(): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin.rpc('reset_daily_queues')
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function login(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Email o contraseña incorrectos.' }

  redirect('/admin')
}

export async function logout() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  redirect('/admin')
}

export async function callNext(
  queueId: string
): Promise<{ ok: boolean; error?: string; nextTokens?: { token: string; number: number }[] }> {
  const { data, error } = await supabaseAdmin.rpc('call_next_ticket', { q_id: queueId })
  if (error) return { ok: false, error: error.message }

  const nextTokens: { token: string; number: number }[] = data ?? []

  if (nextTokens.length > 0) {
    // Obtener info de la cola para armar el mensaje
    const { data: queue } = await supabaseAdmin
      .from('queues')
      .select('prefix, name, current_serving')
      .eq('id', queueId)
      .single()

    if (queue) {
      // Notificar a los próximos en espera (los devuelve call_next_ticket)
      await sendPushToTokens(
        nextTokens.map((t) => t.token),
        {
          title: '⚠️ ¡Tu turno se acerca!',
          body: `Estamos en ${queue.prefix}-${String(queue.current_serving).padStart(3, '0')} — ${queue.name}. Acercate al mostrador.`,
          url:   '/ticket/',   // el SW abre la URL guardada en data.url del token
          tag:   `queue-${queueId}`,
        }
      )
    }
  }

  return { ok: true, nextTokens }
}

export async function markAbsent(queueId: string) {
  await supabaseAdmin
    .from('tickets')
    .update({ status: 'cancelled' })
    .eq('queue_id', queueId)
    .eq('status', 'called')

  return callNext(queueId)
}

export async function getQueueStats(queueId: string) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count: attended } = await supabaseAdmin
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('queue_id', queueId)
    .eq('status', 'attended')
    .gte('created_at', todayStart.toISOString())

  const { count: waiting } = await supabaseAdmin
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('queue_id', queueId)
    .eq('status', 'waiting')

  return { attended: attended ?? 0, waiting: waiting ?? 0 }
}

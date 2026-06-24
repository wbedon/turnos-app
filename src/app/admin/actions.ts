'use server'

import { createSupabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
    const { data: queue } = await supabaseAdmin
      .from('queues')
      .select('prefix, name, current_serving')
      .eq('id', queueId)
      .single()

    if (queue) {
      const serving = `${queue.prefix}-${String(queue.current_serving).padStart(3, '0')}`

      // Envío personalizado por ticket: índice = personas adelante
      await Promise.allSettled(
        nextTokens.map((t, ahead) => {
          const title =
            ahead === 0 ? '🔔 ¡Sos el siguiente!' :
            ahead === 1 ? '⏳ Te falta 1 turno'   :
                          `⏳ Te faltan ${ahead} turnos`

          return sendPushToTokens([t.token], {
            title,
            body: `Estamos en ${serving} — ${queue.name}. Preparate.`,
            url:  `/ticket/${t.token}`,
            tag:  `queue-${queueId}`,
          })
        })
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
  const { data } = await supabaseAdmin
    .from('tickets')
    .select('status')
    .eq('queue_id', queueId)
    .in('status', ['attended', 'waiting'])

  const rows = data ?? []
  return {
    attended: rows.filter((r) => r.status === 'attended').length,
    waiting:  rows.filter((r) => r.status === 'waiting').length,
  }
}

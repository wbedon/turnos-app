'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { PushSubscriptionJSON } from '@/types'

export async function cancelTicket(ticketId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('tickets')
    .update({ status: 'cancelled' })
    .eq('id', ticketId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function savePushSubscription(
  ticketId: string,
  subscription: PushSubscriptionJSON
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('tickets')
    .update({ push_sub: subscription })
    .eq('id', ticketId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

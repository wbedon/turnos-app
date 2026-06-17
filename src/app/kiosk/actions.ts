'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { Queue, Ticket } from '@/types'

export type CreateTicketResult =
  | { ok: true; ticket: Ticket & { queue: Queue } }
  | { ok: false; error: string }

export async function createTicket(queueId: string): Promise<CreateTicketResult> {
  const { data: numberData, error: numError } = await supabaseAdmin
    .rpc('next_ticket_number', { q_id: queueId })

  if (numError) return { ok: false, error: numError.message }

  const { data: ticket, error: insertError } = await supabaseAdmin
    .from('tickets')
    .insert({ queue_id: queueId, number: numberData })
    .select('*, queue:queues(*)')
    .single()

  if (insertError) return { ok: false, error: insertError.message }

  return { ok: true, ticket }
}

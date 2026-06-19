import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { QueueTiming } from '@/types'
import TicketClient from './TicketClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function TicketPage({ params }: Props) {
  const { token } = await params

  const { data: ticket } = await supabaseAdmin
    .from('tickets')
    .select('*, queue:queues(*)')
    .eq('token', token)
    .single()

  if (!ticket) notFound()

  const [{ count: waitingAhead }, { data: timing }] = await Promise.all([
    supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', ticket.queue_id)
      .eq('status', 'waiting')
      .lt('number', ticket.number),
    supabaseAdmin
      .rpc('get_queue_timing', { p_queue_id: ticket.queue_id }),
  ])

  const queueTiming: QueueTiming = timing ?? {
    avg_service_minutes: 5,
    avg_wait_minutes: 5,
    sample_count: 0,
    is_historical: false,
  }

  return (
    <TicketClient
      ticket={ticket}
      waitingAhead={waitingAhead ?? 0}
      timing={queueTiming}
    />
  )
}

import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
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

  // Cuántos tickets waiting están adelante en la misma cola
  const { count: waitingAhead } = await supabaseAdmin
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('queue_id', ticket.queue_id)
    .eq('status', 'waiting')
    .lt('number', ticket.number)

  return <TicketClient ticket={ticket} waitingAhead={waitingAhead ?? 0} />
}

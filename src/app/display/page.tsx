import { supabaseAdmin } from '@/lib/supabase'
import DisplayClient from './DisplayClient'

export const dynamic = 'force-dynamic'

export default async function DisplayPage() {
  const [{ data: queues }, { data: tickets }] = await Promise.all([
    supabaseAdmin.from('queues').select('*').order('prefix'),
    supabaseAdmin
      .from('tickets')
      .select('queue_id, number')
      .eq('status', 'waiting')
      .order('number', { ascending: true }),
  ])

  const byQueue = new Map<string, number[]>()
  for (const t of tickets ?? []) {
    if (!byQueue.has(t.queue_id)) byQueue.set(t.queue_id, [])
    byQueue.get(t.queue_id)!.push(t.number)
  }

  const initialWaiting = (queues ?? []).map((q) => ({
    queueId: q.id,
    count: byQueue.get(q.id)?.length ?? 0,
    nextNumbers: byQueue.get(q.id)?.slice(0, 3) ?? [],
  }))

  if (!queues) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-4xl mb-4">⚠️</p>
          <p>No se pudo conectar con el servidor.</p>
        </div>
      </div>
    )
  }

  return <DisplayClient initialQueues={queues} initialWaiting={initialWaiting} />
}

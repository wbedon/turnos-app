'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Queue } from '@/types'

interface WaitingInfo {
  queueId: string
  count: number
  nextNumbers: number[]
}

interface Props {
  initialQueues: Queue[]
  initialWaiting: WaitingInfo[]
}

export default function DisplayClient({ initialQueues, initialWaiting }: Props) {
  const [queues, setQueues]         = useState<Queue[]>(initialQueues)
  const [waiting, setWaiting]       = useState<Map<string, WaitingInfo>>(
    new Map(initialWaiting.map((w) => [w.queueId, w]))
  )
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const [now, setNow]               = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const refreshWaiting = useCallback(async () => {
    const { data } = await supabase
      .from('tickets')
      .select('queue_id, number')
      .eq('status', 'waiting')
      .order('number', { ascending: true })

    if (!data) return

    const byQueue = new Map<string, number[]>()
    for (const t of data) {
      if (!byQueue.has(t.queue_id)) byQueue.set(t.queue_id, [])
      byQueue.get(t.queue_id)!.push(t.number)
    }

    setWaiting((prev) => {
      const next = new Map(prev)
      for (const [queueId] of prev) {
        const numbers = byQueue.get(queueId) ?? []
        next.set(queueId, { queueId, count: numbers.length, nextNumbers: numbers.slice(0, 3) })
      }
      return next
    })
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('display-board')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queues' }, (payload) => {
        const updated = payload.new as Queue
        setQueues((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
        setHighlighted((prev) => new Set(prev).add(updated.id))
        setTimeout(() => {
          setHighlighted((prev) => { const n = new Set(prev); n.delete(updated.id); return n })
        }, 3000)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, refreshWaiting)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [refreshWaiting])

  const timeStr = now
    ? now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'
  const dateStr = now
    ? now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  const activeQueues = queues.filter((q) => q.is_active)

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden select-none">

      {/* Header */}
      <header className="bg-orange-500 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏪</span>
          <span className="font-black tracking-wide text-[clamp(1.1rem,2.5vw,2rem)] uppercase">
            Turnos en Atención
          </span>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold tabular-nums text-[clamp(1.4rem,3vw,2.5rem)]">
            {timeStr}
          </div>
          <div className="text-xs text-orange-100 capitalize">{dateStr}</div>
        </div>
      </header>

      {/* Columnas */}
      <main
        aria-label="Panel de turnos en atención"
        className="flex-1 grid gap-2 p-2 min-h-0"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(240px, 100%), 1fr))` }}
      >
        {activeQueues.length === 0 ? (
          <div className="col-span-full flex items-center justify-center text-gray-700 text-xl">
            No hay colas activas
          </div>
        ) : (
          activeQueues.map((queue) => {
            const info          = waiting.get(queue.id)
            const isHighlighted = highlighted.has(queue.id)

            return (
              <div
                key={queue.id}
                className={`flex flex-col bg-gray-900 rounded-xl overflow-hidden transition-all duration-500
                  ${isHighlighted
                    ? 'ring-4 ring-orange-400 scale-[1.015] shadow-2xl shadow-orange-900/50'
                    : 'ring-1 ring-gray-800'}`}
              >
                {/* Nombre de la cola */}
                <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
                  <span className="text-[clamp(1.2rem,3vw,2rem)]" aria-hidden="true">{queue.icon}</span>
                  <h2 className="font-bold text-gray-100 uppercase tracking-wider text-[clamp(0.8rem,1.8vw,1.3rem)]">
                    {queue.name}
                  </h2>
                </div>

                {/* Número en atención — el más importante, usa el espacio disponible */}
                <div aria-live="polite" aria-label={`Atendiendo: ${queue.prefix}-${String(queue.current_serving).padStart(3,'0')}`} className="flex-1 flex items-center justify-center min-h-0 py-4">
                  {queue.current_serving > 0 ? (
                    <div className={`text-center transition-transform duration-300 ${isHighlighted ? 'scale-110' : ''}`}>
                      <div
                        className="font-black text-orange-400 tabular-nums leading-none"
                        style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}
                      >
                        {queue.prefix}-{String(queue.current_serving).padStart(3, '0')}
                      </div>
                      <div className="text-gray-600 mt-2 uppercase tracking-widest text-xs">
                        En atención
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-700">
                      <div className="text-5xl mb-2">⏳</div>
                      <div className="text-sm tracking-wider">Sin llamados aún</div>
                    </div>
                  )}
                </div>

                {/* Próximos */}
                <div className="bg-gray-800 px-4 py-3 shrink-0 min-h-[5rem]">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                    Próximos
                  </div>
                  {info && info.nextNumbers.length > 0 ? (
                    <div className="flex gap-2 flex-wrap items-center">
                      {info.nextNumbers.map((n) => (
                        <span
                          key={n}
                          className="bg-gray-700 text-gray-200 rounded-lg px-3 py-1.5 font-mono font-semibold"
                          style={{ fontSize: 'clamp(0.75rem,1.5vw,1.1rem)' }}
                        >
                          {queue.prefix}-{String(n).padStart(3, '0')}
                        </span>
                      ))}
                      {info.count > 3 && (
                        <span className="text-gray-500 text-sm">+{info.count - 3} más</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-600 text-sm">Sin espera</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-2 text-center shrink-0">
        <p className="text-gray-600 text-xs tracking-wider">
          ¡Gracias por su paciencia! &nbsp;•&nbsp; Escaneá el QR del kiosco para seguir tu turno desde el celular
        </p>
      </footer>
    </div>
  )
}

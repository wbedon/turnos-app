'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Queue } from '@/types'

interface WaitingInfo { queueId: string; count: number; nextNumbers: number[] }
interface Props { initialQueues: Queue[]; initialWaiting: WaitingInfo[] }

const spring = { type: "spring", stiffness: 280, damping: 22 } as const

export default function DisplayClient({ initialQueues, initialWaiting }: Props) {
  const [queues, setQueues]           = useState<Queue[]>(initialQueues)
  const [waiting, setWaiting]         = useState<Map<string, WaitingInfo>>(
    new Map(initialWaiting.map((w) => [w.queueId, w]))
  )
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const [now, setNow]                 = useState<Date | null>(null)

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
    <div className="scanlines h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none">

      {/* Header — departure board style */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0 bg-zinc-950">
        <div className="flex items-center gap-4">
          <div className="w-1 h-8 bg-amber-400" aria-hidden="true" />
          <div>
            <p className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.3em]">◆ Sistema de Turnos</p>
            <p className="font-black text-[clamp(0.9rem,2vw,1.6rem)] uppercase tracking-tight text-zinc-100">
              TURNOS EN ATENCIÓN
            </p>
          </div>
        </div>
        <div className="text-right" aria-label={`Hora: ${timeStr}`}>
          <div className="font-mono font-bold tabular-nums text-[clamp(1.4rem,3vw,2.5rem)] tracking-tight text-cyan-400">
            {timeStr}
          </div>
          <div className="text-[10px] font-mono text-zinc-600 capitalize tracking-widest">{dateStr}</div>
        </div>
      </header>

      {/* Columnas — departure board */}
      <main
        aria-label="Panel de turnos en atención"
        className="flex-1 grid gap-px p-px bg-zinc-800 min-h-0"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(280px, 100%), 1fr))` }}
      >
        {activeQueues.length === 0 ? (
          <div className="col-span-full flex items-center justify-center bg-zinc-950 text-zinc-700 font-mono text-xl uppercase tracking-widest">
            NO HAY COLAS ACTIVAS
          </div>
        ) : (
          activeQueues.map((queue, i) => {
            const info          = waiting.get(queue.id)
            const isHighlighted = highlighted.has(queue.id)

            return (
              <motion.div
                key={queue.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`flex flex-col bg-zinc-950 overflow-hidden transition-all duration-500
                  ${isHighlighted ? 'bg-zinc-900' : ''}`}
              >
                {/* Cola header */}
                <div className={`px-4 py-3 flex items-center gap-3 shrink-0 border-b
                  ${isHighlighted ? 'border-amber-400/30 bg-zinc-900' : 'border-zinc-800 bg-zinc-950'}`}
                >
                  <span className="text-xl" aria-hidden="true">{queue.icon}</span>
                  <h2 className="font-mono font-bold text-zinc-300 uppercase tracking-wider text-[clamp(0.7rem,1.5vw,1rem)]">
                    {queue.name}
                  </h2>
                  {isHighlighted && (
                    <span className="ml-auto text-[10px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                      ● LIVE
                    </span>
                  )}
                </div>

                {/* Número grande — departure board */}
                <div
                  aria-live="polite"
                  aria-label={queue.current_serving > 0
                    ? `Atendiendo: ${queue.prefix}-${String(queue.current_serving).padStart(3,'0')}`
                    : `${queue.name}: sin llamados aún`}
                  className="flex-1 flex items-center justify-center min-h-0 py-6 overflow-hidden"
                >
                  {queue.current_serving > 0 ? (
                    <div className="text-center">
                      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-2">EN ATENCIÓN</p>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={queue.current_serving}
                          initial={{ y: -60, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 60, opacity: 0 }}
                          transition={spring}
                          className={`font-mono font-bold tabular-nums leading-none
                            ${isHighlighted ? 'text-amber-300' : 'text-amber-400'}`}
                          style={{ fontSize: 'clamp(4rem, 12vw, 10rem)' }}
                        >
                          {queue.prefix}-{String(queue.current_serving).padStart(3, '0')}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="font-mono text-zinc-800 uppercase tracking-widest text-sm">
                        --- ---
                      </div>
                      <p className="text-[10px] font-mono text-zinc-700 mt-2 uppercase tracking-widest">Sin llamados</p>
                    </div>
                  )}
                </div>

                {/* Próximos */}
                <div className="border-t border-zinc-800 px-4 py-3 shrink-0">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em] mb-2">PRÓXIMOS</p>
                  {info && info.nextNumbers.length > 0 ? (
                    <div className="flex gap-2 flex-wrap items-center">
                      {info.nextNumbers.map((n) => (
                        <span
                          key={n}
                          className="border border-zinc-700 bg-zinc-900 text-zinc-400 font-mono text-xs px-2.5 py-1 tabular-nums"
                        >
                          {queue.prefix}-{String(n).padStart(3, '0')}
                        </span>
                      ))}
                      {info.count > 3 && (
                        <span className="text-zinc-600 font-mono text-xs">+{info.count - 3}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-700 font-mono text-xs uppercase tracking-widest">SIN ESPERA</span>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-2 text-center shrink-0 bg-zinc-950">
        <p className="text-zinc-700 font-mono text-[10px] uppercase tracking-[0.2em]">
          GRACIAS POR SU PACIENCIA &nbsp;◆&nbsp; ESCANEÁ EL QR DEL KIOSCO PARA SEGUIR TU TURNO DESDE EL CELULAR
        </p>
      </footer>
    </div>
  )
}

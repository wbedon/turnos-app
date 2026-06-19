'use client'

import { useEffect, useState, useTransition } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Queue, Ticket, TicketStatus, QueueTiming } from '@/types'
import { cancelTicket } from './actions'
import PushSubscriber from '@/components/PushSubscriber'
import {
  StatusPill,
  CalledStatusScreen,
  AttendedStatusScreen,
  CancelledStatusScreen,
} from '@/components/TicketStatus'

interface Props {
  ticket: Ticket & { queue: Queue }
  waitingAhead: number
  timing: QueueTiming
}

const SPRING = { type: 'spring', stiffness: 380, damping: 30 } as const
const EASE   = [0.16, 1, 0.3, 1] as const

const pad = (n: number) => String(n).padStart(3, '0')

export default function TicketClient({ ticket: initialTicket, waitingAhead: initialAhead, timing }: Props) {
  const [currentServing, setCurrentServing] = useState(initialTicket.queue.current_serving)
  const [status, setStatus]                 = useState<TicketStatus>(initialTicket.status)
  const [waitingAhead, setWaitingAhead]     = useState(initialAhead)
  const [isPending, startTransition]        = useTransition()
  const [cancelled, setCancelled]           = useState(false)

  const queue    = initialTicket.queue
  const myNumber = initialTicket.number

  const isCalled    = status === 'called' || currentServing === myNumber
  const isAttended  = status === 'attended'
  const isCancelled = status === 'cancelled' || cancelled

  const estimatedMinutes = Math.round(waitingAhead * timing.avg_service_minutes)
  const isNextUp         = waitingAhead <= 1 && !isCalled

  useEffect(() => {
    const ch = supabase
      .channel(`ticket-${initialTicket.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'queues', filter: `id=eq.${queue.id}` },
        async (payload) => {
          const updated = payload.new as Queue
          setCurrentServing(updated.current_serving)
          const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('queue_id', queue.id)
            .eq('status', 'waiting')
            .lt('number', myNumber)
          setWaitingAhead(count ?? 0)
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${initialTicket.id}` },
        (payload) => setStatus((payload.new as Ticket).status)
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [initialTicket.id, queue.id, myNumber])

  function handleCancel() {
    startTransition(async () => {
      const r = await cancelTicket(initialTicket.id)
      if (r.ok) setCancelled(true)
    })
  }

  return (
    <AnimatePresence mode="wait">

      {isCancelled && (
        <CancelledStatusScreen key="cancelled" ticketLabel={`${queue.prefix}-${pad(myNumber)}`} />
      )}

      {!isCancelled && isAttended && (
        <AttendedStatusScreen key="attended" ticketLabel={`${queue.prefix}-${pad(myNumber)}`} />
      )}

      {!isCancelled && !isAttended && isCalled && (
        <CalledStatusScreen
          key="called"
          ticketLabel={`${queue.prefix}-${pad(myNumber)}`}
          queueName={`${queue.icon} ${queue.name}`}
        />
      )}

      {!isCancelled && !isAttended && !isCalled && (
        <motion.div
          key="tracking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-zinc-950 flex flex-col pb-8"
        >
          {/* ── Hero: mi número ── */}
          <div className="relative overflow-hidden pt-10 pb-8 px-6 text-center">
            {isNextUp && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-amber-400/5 pointer-events-none"
              />
            )}
            <div className="flex justify-center mb-4">
              <StatusPill status="waiting" />
            </div>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, ...SPRING }}
              className={`font-mono font-black tabular-nums leading-none ${isNextUp ? 'text-amber-400' : 'text-zinc-100'}`}
              style={{ fontSize: 'clamp(4.5rem, 22vw, 7rem)' }}
            >
              {queue.prefix}-{pad(myNumber)}
            </motion.div>
            <p className="text-xs font-mono text-zinc-600 mt-3 uppercase tracking-widest">
              {queue.icon} {queue.name}
            </p>

            {isNextUp && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 px-4 py-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </span>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-[0.2em]">
                  {waitingAhead === 0 ? '¡Sos el siguiente!' : '¡Casi es tu turno!'}
                </span>
              </motion.div>
            )}
          </div>

          {/* ── Live status ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
            className="mx-5 border border-zinc-800 bg-zinc-900 px-5 py-3.5 flex items-center gap-3"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Atendiendo</span>
            <div className="ml-auto">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentServing}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={SPRING}
                  className="font-mono font-bold text-cyan-400 tabular-nums text-xl"
                >
                  {currentServing > 0 ? `${queue.prefix}-${pad(currentServing)}` : '---'}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Queue progress ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
            className="mx-5 mt-3 border border-zinc-800 bg-zinc-900 p-5"
          >
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em] mb-6">
              Posición en cola
            </p>

            <QueueTrack
              current={currentServing}
              mine={myNumber}
              prefix={queue.prefix}
            />

            {/* People ahead — número grande */}
            <div className="mt-8 flex items-end justify-center gap-3">
              <AnimatePresence mode="wait">
                <motion.span
                  key={waitingAhead}
                  initial={{ opacity: 0, y: -16, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.8 }}
                  transition={SPRING}
                  className={`font-mono font-black tabular-nums leading-none ${
                    waitingAhead === 0 ? 'text-amber-400' : 'text-zinc-100'
                  }`}
                  style={{ fontSize: 'clamp(3rem, 16vw, 4.5rem)' }}
                >
                  {waitingAhead}
                </motion.span>
              </AnimatePresence>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest pb-2">
                {waitingAhead === 1 ? 'persona\ndelante' : 'personas\ndelante'}
              </p>
            </div>
          </motion.div>

          {/* ── Tiempo estimado ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: EASE }}
            className="mx-5 mt-3 border border-zinc-800 bg-zinc-900 p-5 flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em]">Tiempo estimado</p>
              {estimatedMinutes > 0 ? (
                <p className="font-mono font-bold text-zinc-100 text-2xl mt-1 tabular-nums">~{estimatedMinutes} min</p>
              ) : (
                <p className="font-mono font-bold text-amber-400 text-xl mt-1">¡Muy pronto!</p>
              )}
              <p className={`text-[10px] font-mono mt-1.5 uppercase tracking-widest ${timing.is_historical ? 'text-cyan-400' : 'text-zinc-700'}`}>
                {timing.is_historical
                  ? `${timing.sample_count} turnos reales`
                  : 'Estimación general'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em]">Prom/turno</p>
              <p className="font-mono font-bold text-zinc-400 text-xl mt-1 tabular-nums">
                {timing.avg_service_minutes}<span className="text-sm text-zinc-600"> min</span>
              </p>
              {timing.is_historical && (
                <div className="mt-1 flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">Real</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Push notifications ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: EASE }}
            className="mx-5 mt-3"
          >
            <PushSubscriber ticketId={initialTicket.id} />
          </motion.div>

          {/* ── Cancelar ── */}
          <div className="mt-auto pt-6 text-center">
            <motion.button
              onClick={handleCancel}
              disabled={isPending}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
              className="text-xs font-mono text-zinc-700 uppercase tracking-widest hover:text-zinc-500 transition-colors disabled:opacity-40"
            >
              {isPending ? 'Cancelando...' : '¿Ya no venís? Cancelar turno'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Queue Track ─────────────────────────────────────────────────────

function QueueTrack({ current, mine, prefix }: { current: number; mine: number; prefix: string }) {
  const pct = current === 0 ? 0 : Math.min((current / mine) * 100, 93)

  // spring-animated progress value
  const springPct = useSpring(pct, { stiffness: 120, damping: 20 })
  useEffect(() => { springPct.set(pct) }, [pct, springPct])
  const barWidth = useTransform(springPct, v => `${v}%`)
  const dotLeft  = useTransform(springPct, v => `${v}%`)

  // clamp label so it doesn't collide with the right end
  const labelLeft = useTransform(springPct, v => `${Math.min(v, 72)}%`)

  return (
    <div className="relative select-none" aria-hidden="true">

      {/* ── Track bar ── */}
      <div className="relative h-[3px] bg-zinc-800 mx-2">
        {/* Fill */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
          style={{ width: barWidth }}
        />

        {/* Current serving dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          style={{ left: dotLeft }}
        >
          <div className="w-4 h-4 rounded-full bg-cyan-400 ring-[5px] ring-cyan-400/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
          </div>
        </motion.div>

        {/* My dot (fixed at right) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20">
          <div className={`w-5 h-5 bg-amber-400 flex items-center justify-center ring-[6px] transition-shadow duration-500 ${pct > 75 ? 'ring-amber-400/40' : 'ring-amber-400/15'}`}>
            <div className="w-2 h-2 bg-zinc-950" />
          </div>
        </div>
      </div>

      {/* ── Labels below track ── */}
      <div className="relative h-10 mt-3 mx-2">
        {/* Current label — slides */}
        <motion.div
          className="absolute -translate-x-1/2 text-center"
          style={{ left: labelLeft }}
        >
          <p className="text-[10px] font-mono font-bold text-cyan-400 tabular-nums whitespace-nowrap">
            {current > 0 ? `${prefix}-${pad(current)}` : '—'}
          </p>
          <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider mt-0.5">Ahora</p>
        </motion.div>

        {/* My label — fixed right */}
        <div className="absolute right-0 text-right">
          <p className="text-[10px] font-mono font-bold text-amber-400 tabular-nums whitespace-nowrap">
            {prefix}-{pad(mine)}
          </p>
          <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider mt-0.5">Vos</p>
        </div>
      </div>

      {/* ── SR text ── */}
      <p className="sr-only" aria-live="polite">
        {current > 0
          ? `Atendiendo ${prefix}-${pad(current)}. Tu turno: ${prefix}-${pad(mine)}.`
          : `Esperando el primer llamado. Tu turno: ${prefix}-${pad(mine)}.`}
      </p>
    </div>
  )
}


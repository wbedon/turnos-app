'use client'

import { useEffect, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Queue, Ticket, TicketStatus } from '@/types'
import { cancelTicket } from './actions'
import PushSubscriber from '@/components/PushSubscriber'

interface Props { ticket: Ticket & { queue: Queue }; waitingAhead: number }

const MINUTES_PER_TURN = 5
const spring = { type: "spring", stiffness: 400, damping: 28 } as const
const ease   = [0.16, 1, 0.3, 1] as const

export default function TicketClient({ ticket: initialTicket, waitingAhead: initialAhead }: Props) {
  const [currentServing, setCurrentServing] = useState(initialTicket.queue.current_serving)
  const [status, setStatus]   = useState<TicketStatus>(initialTicket.status)
  const [waitingAhead, setWaitingAhead] = useState(initialAhead)
  const [isPending, startTransition]    = useTransition()
  const [cancelled, setCancelled]       = useState(false)

  const queue      = initialTicket.queue
  const myNumber   = initialTicket.number
  const remaining  = Math.max(0, myNumber - currentServing - 1)
  const isCalled   = status === 'called' || currentServing === myNumber
  const isAttended = status === 'attended'
  const isCancelled = status === 'cancelled' || cancelled

  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${initialTicket.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queues', filter: `id=eq.${queue.id}` },
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${initialTicket.id}` },
        (payload) => { setStatus((payload.new as Ticket).status) }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [initialTicket.id, queue.id, myNumber])

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelTicket(initialTicket.id)
      if (result.ok) setCancelled(true)
    })
  }

  const estimatedMinutes = remaining * MINUTES_PER_TURN

  return (
    <AnimatePresence mode="wait">

      {/* ── Cancelado ── */}
      {isCancelled && (
        <StatusScreen key="cancelled" icon="✗" title="TURNO CANCELADO" subtitle="Tu turno fue cancelado." variant="muted" />
      )}

      {/* ── Atendido ── */}
      {!isCancelled && isAttended && (
        <StatusScreen key="attended" icon="✓" title="¡ATENDIDO!" subtitle="Tu turno fue atendido. ¡Hasta la próxima!" variant="success" />
      )}

      {/* ── Llamado ── */}
      {!isCancelled && !isAttended && isCalled && (
        <motion.div
          key="called"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-amber-400 flex flex-col items-center justify-center gap-6 p-8 text-zinc-950"
        >
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
            className="text-6xl animate-bounce"
            aria-hidden="true"
          >
            🔔
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-700"
          >
            ◆ Llamado al mostrador
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ...spring }}
            className="text-5xl font-black text-center tracking-tight uppercase"
          >
            ¡Es tu turno!
          </motion.h1>

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 18 }}
            className="border-2 border-zinc-950/20 px-12 py-6 text-center"
          >
            <div className="font-mono font-bold tabular-nums text-6xl tracking-tight">
              {queue.prefix}-{String(myNumber).padStart(3, '0')}
            </div>
            <div className="text-sm font-mono text-zinc-700 mt-2 uppercase tracking-widest">
              <span aria-hidden="true">{queue.icon}</span> {queue.name}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base font-mono text-zinc-700 uppercase tracking-wider"
          >
            Acercate al mostrador ahora
          </motion.p>
        </motion.div>
      )}

      {/* ── Seguimiento / Boarding Pass ── */}
      {!isCancelled && !isAttended && !isCalled && (
        <motion.div
          key="tracking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-zinc-950 flex flex-col"
        >
          {/* Header — boarding pass top stub */}
          <header className="border-b border-zinc-800 px-6 py-5 text-center bg-zinc-950">
            <p className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.3em] mb-2">◆ Tu Turno</p>
            <div
              className="font-mono font-bold text-amber-400 tabular-nums leading-none"
              style={{ fontSize: 'clamp(3rem, 12vw, 5rem)' }}
            >
              {queue.prefix}-{String(myNumber).padStart(3, '0')}
            </div>
            <div className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
              <span aria-hidden="true">{queue.icon}</span> {queue.name}
            </div>
          </header>

          <div className="flex-1 flex flex-col gap-3 p-5">

            {/* Estado actual — boarding pass row */}
            <Card delay={0.05}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em]">ATENDIENDO</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentServing}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={spring}
                      className="font-mono font-bold text-zinc-100 tabular-nums mt-1"
                      style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)' }}
                    >
                      {currentServing > 0
                        ? `${queue.prefix}-${String(currentServing).padStart(3, '0')}`
                        : '---'}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em]">FALTAN</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={waitingAhead}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      transition={spring}
                      className="font-mono font-bold text-cyan-400 mt-1"
                      style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)' }}
                    >
                      {waitingAhead}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">TURNOS</p>
                </div>
              </div>
            </Card>

            {/* Posición */}
            <Card delay={0.1}>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em] mb-4">TU POSICIÓN</p>
              <ProgressDots current={currentServing} mine={myNumber} prefix={queue.prefix} />
            </Card>

            {/* Tiempo estimado */}
            <Card delay={0.15} className="flex items-center gap-4">
              <span className="text-2xl" aria-hidden="true">⏱️</span>
              <div>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em]">TIEMPO ESTIMADO</p>
                {estimatedMinutes > 0 ? (
                  <p className="font-mono font-bold text-zinc-100 text-2xl mt-0.5">~{estimatedMinutes} min</p>
                ) : (
                  <p className="font-mono font-bold text-amber-400 text-xl mt-0.5">¡MUY PRONTO!</p>
                )}
              </div>
            </Card>

            {/* Push notifications */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35, ease }}
            >
              <PushSubscriber ticketId={initialTicket.id} />
            </motion.div>

            {/* Cancelar */}
            <div className="mt-auto pt-4 text-center">
              <motion.button
                onClick={handleCancel}
                disabled={isPending}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="text-xs font-mono text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors disabled:opacity-50"
              >
                {isPending ? 'CANCELANDO...' : '¿Ya no venís? Cancelar turno'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Componentes auxiliares ────────────────────────────────────────

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`border border-zinc-800 bg-zinc-900 p-5 ${className}`}
    >
      {children}
    </motion.div>
  )
}

function ProgressDots({ current, mine, prefix }: { current: number; mine: number; prefix: string }) {
  if (current === 0) {
    return <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">Esperando el primer llamado...</p>
  }

  const gap = mine - current
  const srText = gap === 0
    ? `Atendiendo tu turno ${prefix}-${String(mine).padStart(3,'0')}`
    : `Tu turno ${prefix}-${String(mine).padStart(3,'0')} — faltan ${gap} turno${gap === 1 ? '' : 's'}`

  const dots: { number: number; isMine: boolean }[] = []
  if (gap <= 5) {
    for (let n = current; n <= mine; n++) dots.push({ number: n, isMine: n === mine })
  } else {
    dots.push({ number: current, isMine: false })
    dots.push({ number: mine - 2, isMine: false })
    dots.push({ number: mine - 1, isMine: false })
    dots.push({ number: mine,     isMine: true })
  }

  return (
    <div>
      <p className="sr-only" aria-live="polite">{srText}</p>
      <div className="flex items-center gap-2 flex-wrap" aria-hidden="true">
        {dots.map((dot, i) => {
          const showEllipsis = gap > 5 && i === 1
          return (
            <div key={dot.number} className="flex items-center gap-2">
              {showEllipsis && <span className="text-zinc-700 font-mono text-xs" aria-hidden="true">···</span>}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: dot.isMine ? 1.1 : 1, opacity: 1 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 25 }}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-10 h-10 flex items-center justify-center font-mono text-xs font-bold tabular-nums
                  ${dot.isMine
                    ? 'bg-amber-400 text-zinc-950 ring-2 ring-amber-400/30'
                    : dot.number === current
                    ? 'bg-cyan-400/20 border border-cyan-400/60 text-cyan-400'
                    : 'border border-zinc-700 bg-zinc-900 text-zinc-600'}`}
                >
                  {String(dot.number).padStart(3, '0')}
                </div>
                {dot.isMine && <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest">Vos</span>}
                {dot.number === current && !dot.isMine && <span className="text-[9px] font-mono text-cyan-400 uppercase">Ahora</span>}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusScreen({ icon, title, subtitle, variant }: { icon: string; title: string; subtitle: string; variant: 'muted' | 'success' }) {
  const styles = {
    muted:   { bg: 'bg-zinc-950', icon: 'text-zinc-500', text: 'text-zinc-400', sub: 'text-zinc-600' },
    success: { bg: 'bg-zinc-950', icon: 'text-cyan-400',  text: 'text-cyan-400', sub: 'text-zinc-500' },
  }
  const s = styles[variant]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`min-h-screen ${s.bg} flex flex-col items-center justify-center gap-4 p-8 text-center`}
    >
      <div className={`text-5xl font-mono font-black ${s.icon}`} aria-hidden="true">{icon}</div>
      <h1 className={`text-2xl font-black uppercase tracking-widest font-mono ${s.text}`}>{title}</h1>
      <p className={`${s.sub} font-mono text-sm`}>{subtitle}</p>
    </motion.div>
  )
}

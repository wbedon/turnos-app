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
        <StatusScreen key="cancelled" icon="❌" title="Turno cancelado" subtitle="Tu turno fue cancelado." color="stone" />
      )}

      {/* ── Atendido ── */}
      {!isCancelled && isAttended && (
        <StatusScreen key="attended" icon="✅" title="¡Listo!" subtitle="Tu turno fue atendido. ¡Hasta la próxima!" color="green" />
      )}

      {/* ── Llamado ── */}
      {!isCancelled && !isAttended && isCalled && (
        <motion.div
          key="called"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-orange-600 flex flex-col items-center justify-center gap-6 p-8 text-white"
        >
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
            className="text-7xl animate-bounce"
            aria-hidden="true"
          >
            🔔
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ...spring }}
            className="text-4xl font-black text-center tracking-tight"
          >
            ¡Es tu turno!
          </motion.h1>

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 18 }}
            className="bg-white/15 rounded-3xl px-12 py-6 text-center ring-1 ring-white/20"
          >
            <div className="text-6xl font-black tabular-nums tracking-tight">
              {queue.prefix}-{String(myNumber).padStart(3, '0')}
            </div>
            <div className="text-lg text-orange-100 mt-2">
              <span aria-hidden="true">{queue.icon}</span> {queue.name}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-center font-semibold text-orange-100"
          >
            Acercate al mostrador ahora
          </motion.p>
        </motion.div>
      )}

      {/* ── Seguimiento ── */}
      {!isCancelled && !isAttended && !isCalled && (
        <motion.div
          key="tracking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-stone-50 flex flex-col"
        >
          {/* Header */}
          <header className="bg-orange-600 text-white px-6 py-5 text-center">
            <p className="text-xs text-orange-100 uppercase tracking-[0.15em] font-semibold mb-1">Tu turno</p>
            <div className="text-5xl font-black tabular-nums tracking-tight">
              {queue.prefix}-{String(myNumber).padStart(3, '0')}
            </div>
            <div className="text-sm text-orange-100 mt-1">
              <span aria-hidden="true">{queue.icon}</span> {queue.name}
            </div>
          </header>

          <div className="flex-1 flex flex-col gap-4 p-5">

            {/* Estado actual */}
            <Card delay={0.05}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-[0.1em] font-semibold">Atendiendo ahora</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentServing}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={spring}
                      className="text-3xl font-black text-stone-900 tabular-nums mt-1"
                    >
                      {currentServing > 0
                        ? `${queue.prefix}-${String(currentServing).padStart(3, '0')}`
                        : '—'}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400 uppercase tracking-[0.1em] font-semibold">Faltan</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={waitingAhead}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      transition={spring}
                      className="text-3xl font-black text-orange-500 mt-1"
                    >
                      {waitingAhead}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-xs text-stone-400">turnos</p>
                </div>
              </div>
            </Card>

            {/* Barra de progreso */}
            <Card delay={0.1}>
              <p className="text-xs text-stone-400 uppercase tracking-[0.1em] font-semibold mb-4">Tu posición</p>
              <ProgressDots current={currentServing} mine={myNumber} prefix={queue.prefix} />
            </Card>

            {/* Tiempo estimado */}
            <Card delay={0.15} className="flex items-center gap-4">
              <span className="text-3xl" aria-hidden="true">⏱️</span>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-[0.1em] font-semibold">Tiempo estimado</p>
                {estimatedMinutes > 0 ? (
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">~{estimatedMinutes} min</p>
                ) : (
                  <p className="text-lg font-bold text-orange-500 mt-0.5">¡Muy pronto!</p>
                )}
              </div>
            </Card>

            {/* Alertas push */}
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
                className="text-sm text-stone-500 underline hover:text-stone-700 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Cancelando...' : '¿Ya no venís? Cancelar turno'}
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
      className={`bg-white rounded-2xl ring-1 ring-stone-200 shadow-sm p-5 ${className}`}
    >
      {children}
    </motion.div>
  )
}

function ProgressDots({ current, mine, prefix }: { current: number; mine: number; prefix: string }) {
  if (current === 0) {
    return <p className="text-stone-400 text-sm">Esperando el primer llamado...</p>
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
      <div className="flex items-center gap-1.5 flex-wrap" aria-hidden="true">
        {dots.map((dot, i) => {
          const showEllipsis = gap > 5 && i === 1
          return (
            <div key={dot.number} className="flex items-center gap-1.5">
              {showEllipsis && <span className="text-stone-400 text-sm mx-0.5" aria-hidden="true">···</span>}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: dot.isMine ? 1.1 : 1, opacity: 1 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 25 }}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold
                  ${dot.isMine
                    ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                    : dot.number === current
                    ? 'bg-green-500 text-white'
                    : 'bg-stone-100 text-stone-400'}`}
                >
                  {String(dot.number).padStart(3, '0')}
                </div>
                {dot.isMine && <span className="text-[10px] text-orange-500 font-bold">Vos</span>}
                {dot.number === current && !dot.isMine && <span className="text-[10px] text-green-500 font-bold">Ahora</span>}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusScreen({ icon, title, subtitle, color }: { icon: string; title: string; subtitle: string; color: 'stone' | 'green' }) {
  const configs = {
    stone: { bg: 'bg-stone-50', text: 'text-stone-600' },
    green: { bg: 'bg-green-50', text: 'text-green-700' },
  }
  const { bg, text } = configs[color]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`min-h-screen ${bg} flex flex-col items-center justify-center gap-4 p-8 text-center`}
    >
      <div className="text-6xl" aria-hidden="true">{icon}</div>
      <h1 className={`text-2xl font-black tracking-tight ${text}`}>{title}</h1>
      <p className="text-stone-400">{subtitle}</p>
    </motion.div>
  )
}

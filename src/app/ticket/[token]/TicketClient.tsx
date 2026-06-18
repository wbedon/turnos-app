'use client'

import { useEffect, useState, useTransition } from 'react'
import { supabase } from '@/lib/supabase'
import { Queue, Ticket, TicketStatus } from '@/types'
import { cancelTicket } from './actions'
import PushSubscriber from '@/components/PushSubscriber'

interface Props {
  ticket: Ticket & { queue: Queue }
  waitingAhead: number
}

const MINUTES_PER_TURN = 5

export default function TicketClient({ ticket: initialTicket, waitingAhead: initialAhead }: Props) {
  const [currentServing, setCurrentServing] = useState(initialTicket.queue.current_serving)
  const [status, setStatus] = useState<TicketStatus>(initialTicket.status)
  const [waitingAhead, setWaitingAhead] = useState(initialAhead)
  const [isPending, startTransition] = useTransition()
  const [cancelled, setCancelled] = useState(false)

  const queue = initialTicket.queue
  const myNumber = initialTicket.number
  const remaining = Math.max(0, myNumber - currentServing - 1)
  const isCalled = status === 'called' || currentServing === myNumber
  const isAttended = status === 'attended'
  const isCancelled = status === 'cancelled' || cancelled

  // Realtime: escucha cambios en la cola y en el ticket
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${initialTicket.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'queues', filter: `id=eq.${queue.id}` },
        async (payload) => {
          const updated = payload.new as Queue
          setCurrentServing(updated.current_serving)

          // Actualizar cuántos esperan adelante
          const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('queue_id', queue.id)
            .eq('status', 'waiting')
            .lt('number', myNumber)

          setWaitingAhead(count ?? 0)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${initialTicket.id}` },
        (payload) => {
          const updated = payload.new as Ticket
          setStatus(updated.status)
        }
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

  // ── Pantallas de estado ──────────────────────────────────────────

  if (isCancelled) {
    return <StatusScreen icon="❌" title="Turno cancelado" subtitle="Tu turno fue cancelado." color="gray" />
  }

  if (isAttended) {
    return <StatusScreen icon="✅" title="¡Listo!" subtitle="Tu turno fue atendido. ¡Hasta la próxima!" color="green" />
  }

  if (isCalled) {
    return (
      <div role="alert" className="min-h-screen bg-orange-500 flex flex-col items-center justify-center gap-6 p-8 text-white">
        <div className="text-7xl animate-bounce" aria-hidden="true">🔔</div>
        <h1 className="text-4xl font-black text-center">¡Es tu turno!</h1>
        <div className="bg-white/20 rounded-3xl px-12 py-6 text-center">
          <div className="text-6xl font-black tabular-nums">
            {queue.prefix}-{String(myNumber).padStart(3, '0')}
          </div>
          <div className="text-lg opacity-90 mt-2">{queue.icon} {queue.name}</div>
        </div>
        <p className="text-xl text-center font-medium opacity-90">
          Acercate al mostrador ahora
        </p>
      </div>
    )
  }

  // ── Vista de seguimiento ─────────────────────────────────────────

  const estimatedMinutes = remaining * MINUTES_PER_TURN

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      {/* Header */}
      <header className="bg-orange-500 text-white px-6 py-5 text-center">
        <p className="text-sm opacity-80 uppercase tracking-widest mb-1">Tu turno</p>
        <div className="text-5xl font-black tabular-nums">
          {queue.prefix}-{String(myNumber).padStart(3, '0')}
        </div>
        <div className="text-sm opacity-80 mt-1">{queue.icon} {queue.name}</div>
      </header>

      <div className="flex-1 flex flex-col gap-5 p-6">

        {/* Estado actual */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Atendiendo ahora</p>
              <p className="text-3xl font-black text-gray-800 tabular-nums mt-1">
                {currentServing > 0
                  ? `${queue.prefix}-${String(currentServing).padStart(3, '0')}`
                  : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Faltan</p>
              <p className="text-3xl font-black text-orange-500 mt-1">{waitingAhead}</p>
              <p className="text-xs text-gray-400">turnos</p>
            </div>
          </div>
        </Card>

        {/* Barra de progreso */}
        <Card>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Tu posición</p>
          <ProgressDots
            current={currentServing}
            mine={myNumber}
            prefix={queue.prefix}
          />
        </Card>

        {/* Tiempo estimado */}
        <Card className="flex items-center gap-4">
          <span className="text-3xl">⏱️</span>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Tiempo estimado</p>
            {estimatedMinutes > 0 ? (
              <p className="text-2xl font-bold text-gray-800 mt-0.5">~{estimatedMinutes} min</p>
            ) : (
              <p className="text-lg font-bold text-orange-500 mt-0.5">¡Muy pronto!</p>
            )}
          </div>
        </Card>

        {/* Alertas push */}
        <PushSubscriber ticketId={initialTicket.id} />

        {/* Cancelar */}
        <div className="mt-auto pt-4 text-center">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="text-sm text-gray-500 underline hover:text-gray-700 transition disabled:opacity-50"
          >
            {isPending ? 'Cancelando...' : '¿Ya no venís? Cancelar turno'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componentes auxiliares ───────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

function ProgressDots({ current, mine, prefix }: { current: number; mine: number; prefix: string }) {
  if (current === 0) {
    return <p className="text-gray-400 text-sm">Esperando el primer llamado...</p>
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
    // Mostrar los 2 anteriores al mío
    dots.push({ number: mine - 2, isMine: false })
    dots.push({ number: mine - 1, isMine: false })
    dots.push({ number: mine, isMine: true })
  }

  return (
    <div>
      <p className="sr-only" aria-live="polite">{srText}</p>
      <div className="flex items-center gap-1 flex-wrap" aria-hidden="true">
      {dots.map((dot, i) => {
        const showEllipsis = gap > 5 && i === 1
        return (
          <div key={dot.number} className="flex items-center gap-1">
            {showEllipsis && <span className="text-gray-500 text-sm mx-1" aria-hidden="true">···</span>}
            <div
              className={`flex flex-col items-center gap-1 ${dot.isMine ? 'scale-110' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${dot.isMine
                    ? 'bg-orange-500 text-white ring-4 ring-orange-200'
                    : dot.number === current
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                  }`}
              >
                {String(dot.number).padStart(3, '0')}
              </div>
              {dot.isMine && (
                <span className="text-[10px] text-orange-500 font-bold">Vos</span>
              )}
              {dot.number === current && !dot.isMine && (
                <span className="text-[10px] text-green-500 font-bold">Ahora</span>
              )}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

function StatusScreen({
  icon, title, subtitle, color,
}: {
  icon: string
  title: string
  subtitle: string
  color: 'gray' | 'green'
}) {
  const bg = color === 'green' ? 'bg-green-50' : 'bg-gray-50'
  const text = color === 'green' ? 'text-green-700' : 'text-gray-500'
  return (
    <div className={`min-h-screen ${bg} flex flex-col items-center justify-center gap-4 p-8 text-center`}>
      <div className="text-6xl">{icon}</div>
      <h1 className={`text-2xl font-bold ${text}`}>{title}</h1>
      <p className="text-gray-400">{subtitle}</p>
    </div>
  )
}

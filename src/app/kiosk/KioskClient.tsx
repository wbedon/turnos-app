'use client'

import { useState, useEffect, useTransition } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createTicket, CreateTicketResult } from './actions'
import { Queue, Ticket } from '@/types'

interface Props {
  queues: Queue[]
}

type Screen = 'select' | 'confirm'

interface ConfirmedTicket {
  ticket: Ticket & { queue: Queue }
  url: string
}

const RESET_SECONDS = 30

export default function KioskClient({ queues }: Props) {
  const [screen, setScreen]       = useState<Screen>('select')
  const [confirmed, setConfirmed] = useState<ConfirmedTicket | null>(null)
  const [countdown, setCountdown] = useState(RESET_SECONDS)
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (screen !== 'confirm') return
    setCountdown(RESET_SECONDS)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); handleReset(); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [screen])

  function handleReset() {
    setScreen('select')
    setConfirmed(null)
    setError(null)
  }

  function handleSelectQueue(queue: Queue) {
    if (!queue.is_active) return
    setError(null)
    startTransition(async () => {
      const result: CreateTicketResult = await createTicket(queue.id)
      if (!result.ok) { setError(result.error); return }
      const ticketUrl = `${window.location.origin}/ticket/${result.ticket.token}`
      setConfirmed({ ticket: result.ticket, url: ticketUrl })
      setScreen('confirm')
    })
  }

  /* ── Pantalla de confirmación ──────────────────────────────────── */
  if (screen === 'confirm' && confirmed) {
    const { ticket, url } = confirmed
    return (
      <div className="h-screen bg-orange-50 flex flex-col items-center justify-between p-6 overflow-hidden">

        {/* Top */}
        <div className="text-center pt-4">
          <p className="text-gray-400 text-base uppercase tracking-widest">¡Tu turno es!</p>
        </div>

        {/* Número grande */}
        <div className="bg-white rounded-3xl shadow-lg px-10 py-8 text-center border-4 border-orange-400 w-full max-w-sm">
          <div className="text-[clamp(4rem,18vw,7rem)] font-black text-orange-500 leading-none tabular-nums">
            {ticket.queue.prefix}-{String(ticket.number).padStart(3, '0')}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-gray-500 text-lg">
            <span>{ticket.queue.icon}</span>
            <span className="font-semibold">{ticket.queue.name}</span>
          </div>
        </div>

        {/* QR + instrucción */}
        <div className="bg-white rounded-2xl shadow p-5 flex flex-col items-center gap-3 w-full max-w-sm">
          <div role="img" aria-label="Código QR para seguir tu turno desde el celular">
            <QRCodeSVG value={url} size={200} bgColor="#ffffff" fgColor="#1f2937" level="M" includeMargin />
          </div>
          <p className="text-gray-500 text-center text-sm">
            Escaneá con tu celular para seguir el turno sin quedarte esperando acá
          </p>
        </div>

        {/* Footer con countdown */}
        <button
          onClick={handleReset}
          className="text-gray-400 text-sm pb-2 hover:text-gray-600 transition"
        >
          Volver al inicio ({countdown}s)
        </button>
      </div>
    )
  }

  /* ── Pantalla de selección ─────────────────────────────────────── */
  const activeQueues   = queues.filter((q) => q.is_active)
  const inactiveQueues = queues.filter((q) => !q.is_active)

  return (
    <div className="h-screen bg-orange-50 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-orange-500 text-white text-center py-6 px-6 shrink-0">
        <div className="text-4xl mb-1">🏪</div>
        <h1 className="text-2xl font-black tracking-wide">¡Bienvenido!</h1>
        <p className="text-orange-100 text-sm mt-1">¿Qué tipo de atención necesitás?</p>
      </header>

      {/* Grid de colas — ocupa todo el espacio disponible */}
      <main className="flex-1 grid grid-cols-2 gap-3 p-4">
        {activeQueues.map((queue) => (
          <button
            key={queue.id}
            onClick={() => handleSelectQueue(queue)}
            disabled={isPending}
            className="flex flex-col items-center justify-center gap-3
                       bg-white rounded-2xl shadow-md border-2 border-transparent
                       hover:border-orange-400 hover:shadow-xl
                       active:scale-95 transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-[clamp(2.5rem,8vw,4rem)]">{queue.icon}</span>
            <span className="font-black text-gray-700 text-[clamp(1rem,3vw,1.5rem)] text-center px-2">
              {queue.name}
            </span>
          </button>
        ))}

        {inactiveQueues.map((queue) => (
          <div
            key={queue.id}
            aria-disabled="true"
            aria-label={`${queue.name} — no disponible`}
            className="flex flex-col items-center justify-center gap-3
                       bg-white rounded-2xl border-2 border-dashed border-gray-100 opacity-40"
          >
            <span className="text-[clamp(2.5rem,8vw,4rem)] grayscale">{queue.icon}</span>
            <span className="font-bold text-gray-400 text-base text-center px-2">{queue.name}</span>
            <span className="text-xs text-gray-300 uppercase tracking-wider">No disponible</span>
          </div>
        ))}
      </main>

      {/* Spinner de carga */}
      {isPending && (
        <div role="status" aria-label="Generando tu turno" className="absolute inset-0 bg-orange-50/80 flex items-center justify-center">
          <div className="flex items-center gap-3 text-orange-500 text-lg font-semibold">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Generando tu turno...
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="absolute bottom-6 left-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center">
          Hubo un error al generar el turno. Intentá de nuevo.
        </div>
      )}
    </div>
  )
}

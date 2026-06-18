'use client'

import { useState, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { createTicket, CreateTicketResult } from './actions'
import { Queue, Ticket } from '@/types'

interface Props { queues: Queue[] }
type Screen = 'select' | 'confirm'
interface ConfirmedTicket { ticket: Ticket & { queue: Queue }; url: string }

const RESET_SECONDS = 30
const spring = { type: "spring", stiffness: 400, damping: 28 } as const
const ease   = [0.16, 1, 0.3, 1] as const

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const activeQueues   = queues.filter((q) => q.is_active)
  const inactiveQueues = queues.filter((q) => !q.is_active)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">
      <AnimatePresence mode="wait">

        {/* ── Confirmación ── */}
        {screen === 'confirm' && confirmed && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col items-center justify-between p-6"
          >
            {/* Label top */}
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, ...spring }}
              className="text-stone-400 text-sm uppercase tracking-[0.15em] font-medium pt-4"
            >
              ¡Tu turno es!
            </motion.p>

            {/* Número */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
              className="bg-white rounded-3xl ring-1 ring-stone-200 shadow-lg px-10 py-8 text-center w-full max-w-sm"
            >
              <div
                className="font-black text-orange-500 leading-none tabular-nums"
                style={{ fontSize: 'clamp(4rem, 18vw, 7rem)' }}
              >
                {confirmed.ticket.queue.prefix}-{String(confirmed.ticket.number).padStart(3, '0')}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-stone-500 text-base">
                <span aria-hidden="true">{confirmed.ticket.queue.icon}</span>
                <span className="font-semibold">{confirmed.ticket.queue.name}</span>
              </div>
            </motion.div>

            {/* QR */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease }}
              className="bg-white rounded-2xl ring-1 ring-stone-200 p-5 flex flex-col items-center gap-3 w-full max-w-sm"
            >
              <div role="img" aria-label="Código QR para seguir tu turno desde el celular">
                <QRCodeSVG
                  value={confirmed.url}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#1c1917"
                  level="M"
                  includeMargin
                />
              </div>
              <p className="text-stone-500 text-center text-sm leading-snug">
                Escaneá con tu celular para seguir el turno sin quedarte esperando acá
              </p>
            </motion.div>

            {/* Countdown */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, ...spring }}
              onClick={handleReset}
              whileTap={{ scale: 0.97 }}
              className="text-stone-400 text-sm pb-2 hover:text-stone-600 transition-colors"
            >
              Volver al inicio ({countdown}s)
            </motion.button>
          </motion.div>
        )}

        {/* ── Selección ── */}
        {screen === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <header className="bg-orange-600 text-white text-center py-6 px-6 shrink-0">
              <div className="text-4xl mb-1" aria-hidden="true">🏪</div>
              <h1 className="text-2xl font-black tracking-tight">¡Bienvenido!</h1>
              <p className="text-orange-100 text-sm mt-1">¿Qué tipo de atención necesitás?</p>
            </header>

            {/* Grid de colas */}
            <main className="flex-1 grid grid-cols-2 gap-3 p-4">
              {activeQueues.map((queue, i) => (
                <motion.button
                  key={queue.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35, ease }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectQueue(queue)}
                  disabled={isPending}
                  className="flex flex-col items-center justify-center gap-3
                             bg-white rounded-2xl ring-1 ring-stone-200 shadow-sm
                             hover:ring-orange-300 hover:shadow-md
                             active:bg-orange-50 transition-all duration-150
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="text-[clamp(2.5rem,8vw,4rem)]" aria-hidden="true">{queue.icon}</span>
                  <span className="font-bold text-stone-800 text-[clamp(0.95rem,3vw,1.4rem)] text-center px-2 leading-tight">
                    {queue.name}
                  </span>
                </motion.button>
              ))}

              {inactiveQueues.map((queue) => (
                <div
                  key={queue.id}
                  aria-disabled="true"
                  aria-label={`${queue.name} — no disponible`}
                  className="flex flex-col items-center justify-center gap-3
                             bg-white rounded-2xl ring-1 ring-dashed ring-stone-200 opacity-35 select-none"
                >
                  <span className="text-[clamp(2.5rem,8vw,4rem)] grayscale" aria-hidden="true">{queue.icon}</span>
                  <span className="font-semibold text-stone-400 text-base text-center px-2">{queue.name}</span>
                  <span className="text-xs text-stone-300 uppercase tracking-wider">No disponible</span>
                </div>
              ))}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spinner de carga */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-label="Generando tu turno"
            className="absolute inset-0 bg-stone-50/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
              className="flex items-center gap-3 bg-white rounded-2xl ring-1 ring-stone-200 shadow-lg px-6 py-4 text-orange-600 font-semibold"
            >
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generando tu turno...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={spring}
            role="alert"
            className="absolute bottom-6 left-4 right-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm text-center shadow-md"
          >
            Hubo un error al generar el turno. Intentá de nuevo.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

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
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-950 relative">
      <AnimatePresence mode="wait">

        {/* ── Confirmación / Boarding Pass ── */}
        {screen === 'confirm' && confirmed && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col items-center justify-between p-6 overflow-y-auto"
          >
            {/* Top label */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, ...spring }}
              className="text-center pt-4 w-full"
            >
              <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em]">
                ◆ Boarding Pass
              </p>
            </motion.div>

            {/* Número — grande como en pantalla de aeropuerto */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
              className="w-full max-w-sm border border-amber-400/30 bg-zinc-900"
            >
              {/* Header fila */}
              <div className="border-b border-zinc-800 px-5 py-3 flex justify-between items-center">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">TURNO</span>
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">COLA</span>
              </div>
              {/* Valores */}
              <div className="px-5 py-6 flex justify-between items-end">
                <div
                  className="font-mono font-bold text-amber-400 tabular-nums leading-none"
                  style={{ fontSize: 'clamp(4rem, 18vw, 7rem)' }}
                >
                  {confirmed.ticket.queue.prefix}-{String(confirmed.ticket.number).padStart(3, '0')}
                </div>
                <div className="text-right">
                  <div className="text-4xl" aria-hidden="true">{confirmed.ticket.queue.icon}</div>
                  <p className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">
                    {confirmed.ticket.queue.name}
                  </p>
                </div>
              </div>
              {/* Línea perforación */}
              <div className="perforation mt-2" />
              {/* QR row */}
              <div className="px-5 py-5 flex items-center gap-5">
                <div role="img" aria-label="Código QR para seguir tu turno desde el celular">
                  <QRCodeSVG
                    value={confirmed.url}
                    size={96}
                    bgColor="#18181b"
                    fgColor="#fbbf24"
                    level="M"
                  />
                </div>
                <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                  ESCANEÁ CON TU<br />CELULAR PARA<br />SEGUIR EL TURNO
                </p>
              </div>
            </motion.div>

            {/* Countdown volver */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, ...spring }}
              onClick={handleReset}
              whileTap={{ scale: 0.97 }}
              className="text-zinc-600 text-xs font-mono pb-4 hover:text-zinc-400 transition-colors uppercase tracking-widest"
            >
              VOLVER AL INICIO ({countdown}s)
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
            <header className="border-b border-zinc-800 px-6 py-5 shrink-0">
              <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] mb-1">
                ◆ Terminal de Autoservicio
              </p>
              <h1 className="text-xl font-black uppercase tracking-tight text-zinc-100">
                ¿En qué podemos ayudarte?
              </h1>
            </header>

            {/* Grid de colas — ocupan toda la altura disponible */}
            <main className="flex-1 grid p-4 gap-3" style={{
              gridTemplateColumns: `repeat(${Math.min(activeQueues.length + inactiveQueues.length, 2)}, 1fr)`,
              gridTemplateRows: `repeat(${Math.ceil((activeQueues.length + inactiveQueues.length) / 2)}, 1fr)`,
            }}>
              {activeQueues.map((queue, i) => (
                <motion.button
                  key={queue.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectQueue(queue)}
                  disabled={isPending}
                  className="amber-glow-hover flex flex-col items-center justify-center gap-3
                             border border-zinc-800 bg-zinc-900
                             hover:border-amber-400/50 hover:bg-zinc-800
                             transition-colors duration-150
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="text-[clamp(2.5rem,8vw,4rem)]" aria-hidden="true">{queue.icon}</span>
                  <span className="font-bold text-zinc-100 text-[clamp(0.85rem,3vw,1.3rem)] text-center px-2 leading-tight uppercase tracking-wide">
                    {queue.name}
                  </span>
                  <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                    {queue.prefix}
                  </span>
                </motion.button>
              ))}

              {inactiveQueues.map((queue) => (
                <div
                  key={queue.id}
                  aria-disabled="true"
                  aria-label={`${queue.name} — no disponible`}
                  className="flex flex-col items-center justify-center gap-3
                             border border-zinc-800/40 opacity-20 select-none cursor-not-allowed"
                >
                  <span className="text-[clamp(2.5rem,8vw,4rem)] grayscale" aria-hidden="true">{queue.icon}</span>
                  <span className="font-bold text-zinc-600 text-base text-center px-2 uppercase tracking-wide">{queue.name}</span>
                  <span className="text-xs font-mono text-zinc-700 uppercase tracking-widest">NO DISPONIBLE</span>
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
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
              className="flex items-center gap-3 border border-amber-400/30 bg-zinc-900 px-6 py-4 text-amber-400 font-mono text-sm uppercase tracking-widest"
            >
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generando turno...
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
            className="absolute bottom-6 left-4 right-4 border border-red-500/40 bg-zinc-900 p-4 text-red-400 text-xs font-mono text-center uppercase tracking-wider"
          >
            ERROR — Intentá de nuevo
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

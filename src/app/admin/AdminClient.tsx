'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Queue } from '@/types'
import { callNext, markAbsent, getQueueStats, logout } from './actions'
import ResetButton from './ResetButton'

interface Stats { attended: number; waiting: number }
interface Props { queues: Queue[]; userEmail: string }

const spring = { type: "spring", stiffness: 400, damping: 28 } as const
const ease   = [0.16, 1, 0.3, 1] as const

export default function AdminClient({ queues, userEmail }: Props) {
  const [selectedId, setSelectedId]       = useState<string>(queues[0]?.id ?? '')
  const [currentServing, setCurrentServing] = useState<Record<string, number>>(
    Object.fromEntries(queues.map((q) => [q.id, q.current_serving]))
  )
  const [stats, setStats]     = useState<Stats>({ attended: 0, waiting: 0 })
  const [reiterated, setReiterated] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback]     = useState<{ msg: string; ok: boolean } | null>(null)

  const selected = queues.find((q) => q.id === selectedId)
  const serving  = currentServing[selectedId] ?? 0

  const refreshStats = useCallback(async () => {
    if (!selectedId) return
    const s = await getQueueStats(selectedId)
    setStats(s)
  }, [selectedId])

  useEffect(() => { refreshStats() }, [refreshStats])

  useEffect(() => {
    const channel = supabase
      .channel('admin-board')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queues' }, (payload) => {
        const updated = payload.new as Queue
        setCurrentServing((prev) => ({ ...prev, [updated.id]: updated.current_serving }))
        refreshStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => { refreshStats() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [refreshStats])

  function showFeedback(msg: string, ok: boolean) {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleCallNext() {
    setReiterated(false)
    startTransition(async () => {
      const result = await callNext(selectedId)
      if (!result.ok)                     showFeedback(result.error ?? 'Error al llamar turno', false)
      else if (!result.nextTokens?.length) showFeedback('No hay más turnos en espera', false)
      else                                 showFeedback('Turno llamado', true)
    })
  }

  function handleReiterate() {
    setReiterated(true)
    setTimeout(() => setReiterated(false), 2000)
    showFeedback('Llamado reiterado', true)
  }

  function handleMarkAbsent() {
    startTransition(async () => {
      const result = await markAbsent(selectedId)
      if (!result.ok) showFeedback(result.error ?? 'Error', false)
      else             showFeedback('Turno marcado ausente — siguiente llamado', true)
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-4">
          <div className="w-1 h-8 bg-amber-400" aria-hidden="true" />
          <div>
            <p className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.3em]">◆ Panel de Control</p>
            <p className="font-black text-base uppercase tracking-tight text-zinc-100">OPERADOR</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-zinc-600 mb-1">{userEmail}</p>
          <motion.button
            onClick={() => startTransition(() => logout())}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors"
          >
            SALIR →
          </motion.button>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4 p-5 max-w-lg mx-auto w-full">

        {/* Selector de cola */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="border border-zinc-800 bg-zinc-900 p-4"
        >
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em] mb-3">COLA A ATENDER</p>
          <div className="grid grid-cols-2 gap-2">
            {queues.map((q) => (
              <motion.button
                key={q.id}
                onClick={() => setSelectedId(q.id)}
                aria-pressed={selectedId === q.id}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                className={`flex items-center gap-2 px-4 py-3 border transition-colors duration-150 font-mono text-sm uppercase tracking-wide
                  ${selectedId === q.id
                    ? 'border-amber-400/60 bg-amber-400/10 text-amber-400'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}
              >
                <span className="text-base" aria-hidden="true">{q.icon}</span>
                <span>{q.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Turno actual */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3, ease }}
          className={`border bg-zinc-900 p-6 text-center transition-all duration-300
            ${reiterated ? 'border-amber-400/60' : 'border-zinc-800'}`}
        >
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em] mb-4">ATENDIENDO AHORA</p>
          <AnimatePresence mode="wait">
            {serving > 0 ? (
              <motion.div
                key={serving}
                initial={{ scale: 0.85, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.05, opacity: 0, y: 20 }}
                transition={spring}
                className="font-mono font-bold text-amber-400 tabular-nums leading-none"
                style={{ fontSize: 'clamp(3rem, 12vw, 5rem)' }}
              >
                {selected?.prefix}-{String(serving).padStart(3, '0')}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-zinc-700 text-2xl uppercase tracking-widest"
              >
                --- ---
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-5 flex justify-center gap-6 text-xs font-mono text-zinc-600 uppercase tracking-widest">
            <span>ATENDIDOS: <strong className="text-zinc-300">{stats.attended}</strong></span>
            <span>EN ESPERA: <strong className="text-zinc-300">{stats.waiting}</strong></span>
          </div>
        </motion.div>

        {/* Feedback toast */}
        <div className="h-10 flex items-center justify-center">
          <AnimatePresence>
            {feedback && (
              <motion.div
                key={feedback.msg}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={spring}
                role="status"
                aria-live="polite"
                className={`px-5 py-2 border font-mono text-xs uppercase tracking-widest
                  ${feedback.ok
                    ? 'border-cyan-400/40 bg-zinc-900 text-cyan-400'
                    : 'border-red-500/40 bg-zinc-900 text-red-400'}`}
              >
                {feedback.ok ? '✓' : '✗'} {feedback.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botón principal */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease }}
          onClick={handleCallNext}
          disabled={isPending}
          aria-busy={isPending}
          aria-label={isPending ? 'Llamando turno siguiente…' : 'Llamar siguiente turno'}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          className="w-full amber-glow-hover bg-amber-400 hover:bg-amber-300 text-zinc-950
                     font-black py-7 uppercase tracking-widest text-lg
                     transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          {isPending ? '···' : '▶  LLAMAR SIGUIENTE'}
        </motion.button>

        {/* Acciones secundarias */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3, ease }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            onClick={handleReiterate}
            disabled={isPending || serving === 0}
            whileTap={{ scale: 0.96 }}
            transition={spring}
            className="flex flex-col items-center gap-2 py-4 border border-zinc-800 bg-zinc-900
                       hover:border-zinc-700 transition-colors duration-150 disabled:opacity-30
                       focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            <span className="text-xl" aria-hidden="true">🔁</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Reiterar</span>
          </motion.button>

          <motion.button
            onClick={handleMarkAbsent}
            disabled={isPending || serving === 0}
            whileTap={{ scale: 0.96 }}
            transition={spring}
            className="flex flex-col items-center gap-2 py-4 border border-zinc-800 bg-zinc-900
                       hover:border-red-500/40 hover:text-red-400 transition-colors duration-150 disabled:opacity-30
                       focus:outline-none focus:ring-1 focus:ring-red-500/40"
          >
            <span className="text-xl" aria-hidden="true">⏭️</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Ausente</span>
          </motion.button>
        </motion.div>

        {/* Reset */}
        <div className="mt-1 pt-4 border-t border-zinc-800">
          <ResetButton />
        </div>

      </div>
    </div>
  )
}

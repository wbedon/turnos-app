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
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* Header */}
      <header className="bg-orange-600 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">⚙️</span>
          <div>
            <p className="font-black text-lg leading-tight tracking-tight">Panel de Operador</p>
            <p className="text-xs text-orange-100">{userEmail}</p>
          </div>
        </div>
        <motion.button
          onClick={() => startTransition(() => logout())}
          whileTap={{ scale: 0.95 }}
          transition={spring}
          className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors font-medium"
        >
          Salir
        </motion.button>
      </header>

      <div className="flex-1 flex flex-col gap-4 p-5 max-w-lg mx-auto w-full">

        {/* Selector de cola */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="bg-white rounded-2xl ring-1 ring-stone-200 shadow-sm p-4"
        >
          <p className="text-xs text-stone-400 uppercase tracking-[0.12em] font-semibold mb-3">Cola a atender</p>
          <div className="grid grid-cols-2 gap-2">
            {queues.map((q) => (
              <motion.button
                key={q.id}
                onClick={() => setSelectedId(q.id)}
                aria-pressed={selectedId === q.id}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors duration-150 font-semibold text-sm
                  ${selectedId === q.id
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-stone-100 bg-stone-50 text-stone-500 hover:border-stone-200'}`}
              >
                <span className="text-xl" aria-hidden="true">{q.icon}</span>
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
          className={`bg-white rounded-2xl ring-1 ring-stone-200 shadow-sm p-6 text-center transition-all duration-300
            ${reiterated ? 'ring-orange-300 ring-2 scale-[1.01]' : ''}`}
        >
          <p className="text-xs text-stone-400 uppercase tracking-[0.12em] font-semibold mb-3">Atendiendo ahora</p>
          <AnimatePresence mode="wait">
            {serving > 0 ? (
              <motion.div
                key={serving}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                transition={spring}
                className="text-6xl font-black text-orange-500 tabular-nums tracking-tight"
              >
                {selected?.prefix}-{String(serving).padStart(3, '0')}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl text-stone-400 font-semibold"
              >
                — Sin llamados —
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-4 flex justify-center gap-6 text-sm text-stone-400">
            <span><span aria-hidden="true">✅ </span>Atendidos hoy: <strong className="text-stone-700">{stats.attended}</strong></span>
            <span><span aria-hidden="true">⏳ </span>En espera: <strong className="text-stone-700">{stats.waiting}</strong></span>
          </div>
        </motion.div>

        {/* Feedback toast */}
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence>
            {feedback && (
              <motion.div
                key={feedback.msg}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={spring}
                role="status"
                aria-live="polite"
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold ring-1
                  ${feedback.ok
                    ? 'bg-green-50 text-green-700 ring-green-200'
                    : 'bg-red-50 text-red-700 ring-red-200'}`}
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
          className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800
                     text-white text-2xl font-black py-7 rounded-2xl shadow-md
                     transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        >
          {isPending ? '…' : '▶  LLAMAR SIGUIENTE'}
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
            className="flex flex-col items-center gap-1 py-4 bg-white rounded-2xl ring-1 ring-stone-200 shadow-sm
                       hover:ring-orange-200 transition-all duration-150 disabled:opacity-40 text-stone-600
                       focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <span className="text-2xl" aria-hidden="true">🔁</span>
            <span className="text-sm font-semibold">Reiterar llamado</span>
          </motion.button>

          <motion.button
            onClick={handleMarkAbsent}
            disabled={isPending || serving === 0}
            whileTap={{ scale: 0.96 }}
            transition={spring}
            className="flex flex-col items-center gap-1 py-4 bg-white rounded-2xl ring-1 ring-stone-200 shadow-sm
                       hover:ring-red-200 transition-all duration-150 disabled:opacity-40 text-stone-600
                       focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <span className="text-2xl" aria-hidden="true">⏭️</span>
            <span className="text-sm font-semibold">Marcar ausente</span>
          </motion.button>
        </motion.div>

        {/* Reset */}
        <div className="mt-1 pt-4 border-t border-stone-200">
          <ResetButton />
        </div>

      </div>
    </div>
  )
}

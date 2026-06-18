'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Queue } from '@/types'
import { callNext, markAbsent, getQueueStats, logout } from './actions'
import ResetButton from './ResetButton'

interface Stats { attended: number; waiting: number }

interface Props {
  queues: Queue[]
  userEmail: string
}

export default function AdminClient({ queues, userEmail }: Props) {
  const [selectedId, setSelectedId] = useState<string>(queues[0]?.id ?? '')
  const [currentServing, setCurrentServing] = useState<Record<string, number>>(
    Object.fromEntries(queues.map((q) => [q.id, q.current_serving]))
  )
  const [stats, setStats] = useState<Stats>({ attended: 0, waiting: 0 })
  const [reiterated, setReiterated] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const selected = queues.find((q) => q.id === selectedId)
  const serving = currentServing[selectedId] ?? 0

  const refreshStats = useCallback(async () => {
    if (!selectedId) return
    const s = await getQueueStats(selectedId)
    setStats(s)
  }, [selectedId])

  useEffect(() => { refreshStats() }, [refreshStats])

  // Realtime: escucha cambios en cualquier cola
  useEffect(() => {
    const channel = supabase
      .channel('admin-board')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'queues' },
        (payload) => {
          const updated = payload.new as Queue
          setCurrentServing((prev) => ({ ...prev, [updated.id]: updated.current_serving }))
          refreshStats()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => { refreshStats() }
      )
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
      if (!result.ok) {
        showFeedback(result.error ?? 'Error al llamar turno', false)
      } else if (!result.nextTokens?.length) {
        showFeedback('No hay más turnos en espera', false)
      } else {
        showFeedback('Turno llamado', true)
      }
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
      if (!result.ok) {
        showFeedback(result.error ?? 'Error', false)
      } else {
        showFeedback('Turno marcado ausente — siguiente llamado', true)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-orange-500 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <p className="font-bold text-lg leading-tight">Panel de Operador</p>
            <p className="text-xs opacity-75">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => startTransition(() => logout())}
          className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition"
        >
          Salir
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-4 p-5 max-w-lg mx-auto w-full">

        {/* Selector de cola */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Cola a atender</p>
          <div className="grid grid-cols-2 gap-2">
            {queues.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelectedId(q.id)}
                aria-pressed={selectedId === q.id}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition font-semibold text-sm
                  ${selectedId === q.id
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
              >
                <span className="text-xl">{q.icon}</span>
                <span>{q.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Turno actual */}
        <div className={`bg-white rounded-2xl shadow-sm p-6 text-center transition-all duration-300
          ${reiterated ? 'ring-4 ring-orange-300 scale-[1.02]' : ''}`}>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Atendiendo ahora</p>
          {serving > 0 ? (
            <div className="text-6xl font-black text-orange-500 tabular-nums">
              {selected?.prefix}-{String(serving).padStart(3, '0')}
            </div>
          ) : (
            <div className="text-3xl text-gray-500 font-bold">— Sin llamados —</div>
          )}
          <div className="mt-3 flex justify-center gap-6 text-sm text-gray-400">
            <span>✅ Atendidos hoy: <strong className="text-gray-700">{stats.attended}</strong></span>
            <span>⏳ En espera: <strong className="text-gray-700">{stats.waiting}</strong></span>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={`text-center py-3 px-4 rounded-xl text-sm font-medium transition-all
            ${feedback.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
          >
            {feedback.ok ? '✓' : '✗'} {feedback.msg}
          </div>
        )}

        {/* Botón principal */}
        <button
          onClick={handleCallNext}
          disabled={isPending}
          aria-busy={isPending}
          aria-label={isPending ? 'Llamando turno siguiente…' : 'Llamar siguiente turno'}
          className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95
                     text-white text-2xl font-black py-7 rounded-2xl shadow-lg
                     transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? '...' : '▶  LLAMAR SIGUIENTE'}
        </button>

        {/* Acciones secundarias */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleReiterate}
            disabled={isPending || serving === 0}
            className="flex flex-col items-center gap-1 py-4 bg-white rounded-2xl shadow-sm border border-gray-100
                       hover:border-orange-200 active:scale-95 transition-all disabled:opacity-40 text-gray-600"
          >
            <span className="text-2xl">🔁</span>
            <span className="text-sm font-semibold">Reiterar llamado</span>
          </button>

          <button
            onClick={handleMarkAbsent}
            disabled={isPending || serving === 0}
            className="flex flex-col items-center gap-1 py-4 bg-white rounded-2xl shadow-sm border border-gray-100
                       hover:border-red-200 active:scale-95 transition-all disabled:opacity-40 text-gray-600"
          >
            <span className="text-2xl">⏭️</span>
            <span className="text-sm font-semibold">Marcar ausente</span>
          </button>
        </div>

        {/* Reinicio del día */}
        <div className="mt-2 pt-4 border-t border-gray-200">
          <ResetButton />
        </div>

      </div>
    </div>
  )
}

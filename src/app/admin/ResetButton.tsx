'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { resetDailyQueues } from './actions'

const spring = { type: "spring", stiffness: 400, damping: 28 } as const

export default function ResetButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [feedback, setFeedback]       = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showConfirm) return
    cancelRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowConfirm(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showConfirm])

  function handleConfirm() {
    startTransition(async () => {
      const result = await resetDailyQueues()
      setShowConfirm(false)
      setFeedback(result.ok ? '✓ Turnos reiniciados' : '✗ Error al reiniciar')
      setTimeout(() => setFeedback(null), 4000)
    })
  }

  return (
    <>
      <motion.button
        onClick={() => setShowConfirm(true)}
        whileTap={{ scale: 0.97 }}
        transition={spring}
        className="w-full flex items-center justify-center gap-2 py-3 border border-zinc-800 bg-zinc-950
                   text-zinc-600 font-mono text-xs uppercase tracking-widest
                   hover:border-red-500/40 hover:text-red-500 transition-colors duration-150
                   focus:outline-none focus:ring-1 focus:ring-red-500/40"
      >
        <span aria-hidden="true">🔄</span> REINICIAR TURNOS DEL DÍA
      </motion.button>

      <AnimatePresence>
        {feedback && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
            role="status"
            className={`text-center font-mono text-xs mt-2 uppercase tracking-widest
              ${feedback.startsWith('✓') ? 'text-cyan-400' : 'text-red-400'}`}
          >
            {feedback}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false) }}
          >
            <motion.div
              role="dialog"
              aria-labelledby="reset-modal-title"
              aria-describedby="reset-modal-desc"
              aria-modal="true"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="border border-zinc-700 bg-zinc-900 p-6 w-full max-w-sm"
            >
              <div className="mb-5">
                <p className="text-[10px] font-mono text-red-400 uppercase tracking-[0.3em] mb-3">⚠ Acción Destructiva</p>
                <h2 id="reset-modal-title" className="text-lg font-black uppercase tracking-tight text-zinc-100">
                  ¿Reiniciar turnos?
                </h2>
                <p id="reset-modal-desc" className="text-zinc-500 text-xs font-mono mt-3 leading-relaxed">
                  Esto cancelará todos los turnos en espera y pondrá el contador en 0. Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  ref={cancelRef}
                  onClick={() => setShowConfirm(false)}
                  disabled={isPending}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  className="flex-1 py-3 border border-zinc-700 text-zinc-400 font-mono text-xs uppercase tracking-widest
                             hover:border-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-50
                             focus:outline-none focus:ring-1 focus:ring-zinc-600"
                >
                  CANCELAR
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  disabled={isPending}
                  aria-busy={isPending}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600
                             text-white font-black font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50
                             focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
                >
                  {isPending ? '···' : 'SÍ, REINICIAR'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

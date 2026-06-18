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
        className="w-full flex items-center justify-center gap-2 py-3 bg-white
                   ring-1 ring-stone-200 rounded-2xl text-stone-500 text-sm
                   hover:ring-red-200 hover:text-red-500 transition-colors duration-150
                   focus:outline-none focus:ring-2 focus:ring-red-300"
      >
        <span aria-hidden="true">🔄</span> Reiniciar turnos del día
      </motion.button>

      <AnimatePresence>
        {feedback && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
            role="status"
            className={`text-center text-sm mt-2 font-medium ${feedback.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6"
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
              className="bg-white rounded-2xl ring-1 ring-stone-200 shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="text-center mb-5">
                <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
                <h2 id="reset-modal-title" className="text-lg font-black text-stone-900 tracking-tight">
                  ¿Reiniciar turnos?
                </h2>
                <p id="reset-modal-desc" className="text-stone-500 text-sm mt-2 leading-relaxed">
                  Esto cancelará todos los turnos en espera y pondrá el contador en 0.
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  ref={cancelRef}
                  onClick={() => setShowConfirm(false)}
                  disabled={isPending}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  className="flex-1 py-3 rounded-xl ring-1 ring-stone-200 text-stone-600
                             hover:bg-stone-50 transition-colors disabled:opacity-50
                             focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  disabled={isPending}
                  aria-busy={isPending}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600
                             text-white font-bold transition-colors disabled:opacity-50
                             focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                >
                  {isPending ? 'Reiniciando...' : 'Sí, reiniciar'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

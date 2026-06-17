'use client'

import { useState, useTransition } from 'react'
import { resetDailyQueues } from './actions'

export default function ResetButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white
                   border border-gray-200 rounded-2xl text-gray-500 text-sm
                   hover:border-red-200 hover:text-red-500 transition"
      >
        🔄 Reiniciar turnos del día
      </button>

      {feedback && (
        <p className={`text-center text-sm ${feedback.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
          {feedback}
        </p>
      )}

      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="text-lg font-bold text-gray-800">¿Reiniciar turnos?</h2>
              <p className="text-gray-500 text-sm mt-2">
                Esto cancelará todos los turnos en espera y pondrá el contador en 0.
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600
                           hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600
                           text-white font-bold transition disabled:opacity-50"
              >
                {isPending ? 'Reiniciando...' : 'Sí, reiniciar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useActionState } from 'react'
import { motion } from 'framer-motion'
import { login } from './actions'

const ease = [0.16, 1, 0.3, 1] as const

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="bg-white rounded-2xl ring-1 ring-stone-200 shadow-sm p-8 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3" aria-hidden="true">⚙️</div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Panel de Operador</h1>
          <p className="text-stone-500 text-sm mt-1">Ingresá con tu cuenta de staff</p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              aria-describedby={state?.error ? 'login-error' : undefined}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-900
                         focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                         placeholder:text-stone-300 transition-shadow"
              placeholder="operador@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-stone-700 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              aria-describedby={state?.error ? 'login-error' : undefined}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-900
                         focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                         placeholder:text-stone-300 transition-shadow"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <motion.div
              id="login-error"
              role="alert"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium"
            >
              {state.error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={pending}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl
                       transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2
                       focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          >
            {pending ? 'Ingresando...' : 'Ingresar'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

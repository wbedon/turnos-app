'use client'

import { useActionState } from 'react'
import { motion } from 'framer-motion'
import { login } from './actions'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="border border-zinc-800 bg-zinc-900 p-8 w-full max-w-sm"
      >
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] mb-3">◆ Acceso Restringido</p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-100">Panel de Operador</h1>
          <div className="mt-3 h-px w-8 bg-amber-400" />
        </div>

        {/* Demo credentials */}
        <div className="mb-6 border border-zinc-700 border-dashed bg-zinc-950 px-4 py-3">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.25em] mb-2">Demo · Credenciales de prueba</p>
          <p className="text-xs font-mono text-zinc-400">admin@turnos.com</p>
          <p className="text-xs font-mono text-zinc-400">turnos2024!</p>
        </div>

        <form action={action} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              aria-describedby={state?.error ? 'login-error' : undefined}
              className="w-full border border-zinc-700 bg-zinc-950 text-zinc-100 px-4 py-3 font-mono text-sm
                         focus:outline-none focus:border-amber-400 transition-colors
                         placeholder:text-zinc-700"
              placeholder="operador@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              aria-describedby={state?.error ? 'login-error' : undefined}
              className="w-full border border-zinc-700 bg-zinc-950 text-zinc-100 px-4 py-3 font-mono text-sm
                         focus:outline-none focus:border-amber-400 transition-colors
                         placeholder:text-zinc-700"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <motion.div
              id="login-error"
              role="alert"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-red-500/40 bg-zinc-900 px-4 py-3 text-red-400 text-xs font-mono uppercase tracking-wider"
            >
              ✗ {state.error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={pending}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black py-3 uppercase tracking-widest text-sm
                       transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-1
                       focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {pending ? 'VERIFICANDO...' : 'INGRESAR →'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

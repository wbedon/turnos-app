'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

function DisplayMockup() {
  return (
    <div className="scanlines relative w-full border border-zinc-800 bg-zinc-950 overflow-hidden select-none" style={{ aspectRatio: '16/10' }}>
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-5 bg-amber-400" />
          <div>
            <p className="text-[8px] font-mono text-amber-400 uppercase tracking-[0.3em]">◆ Sistema de Turnos</p>
            <p className="font-black text-xs uppercase tracking-tight text-zinc-100">TURNOS EN ATENCIÓN</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold tabular-nums text-lg tracking-tight text-cyan-400">09:42:31</div>
          <div className="text-[8px] font-mono text-zinc-600 capitalize tracking-widest">lunes 23 junio</div>
        </div>
      </div>

      {/* Grid columns */}
      <div className="flex flex-1 gap-px bg-zinc-800" style={{ height: 'calc(100% - 44px - 28px)' }}>
        {[
          { name: 'CAJA',       prefix: 'A', current: 42, icon: '🏦', next: [43,44,45], count: 8  },
          { name: 'CONSULTAS',  prefix: 'B', current: 21, icon: '💬', next: [22,23],    count: 3  },
          { name: 'DEVOLUCIONES', prefix: 'C', current: 17, icon: '🔄', next: [18,19],  count: 5  },
          { name: 'VIP',        prefix: 'D', current: 9,  icon: '⭐', next: [10],       count: 2  },
        ].map((q, i) => (
          <div key={q.prefix} className={`flex-1 flex flex-col bg-zinc-950 ${i === 0 ? 'bg-zinc-900' : ''}`}>
            <div className={`px-2 py-1.5 flex items-center gap-1.5 border-b ${i === 0 ? 'border-amber-400/30' : 'border-zinc-800'}`}>
              <span className="text-sm">{q.icon}</span>
              <span className="font-mono font-bold text-zinc-300 uppercase tracking-wide text-[9px]">{q.name}</span>
              {i === 0 && <span className="ml-auto text-[8px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">● LIVE</span>}
            </div>
            <div className="flex-1 flex items-center justify-center py-2">
              <div className="text-center">
                <p className="text-[7px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-1">EN ATENCIÓN</p>
                <div className={`font-mono font-bold tabular-nums leading-none text-2xl ${i === 0 ? 'text-amber-300' : 'text-amber-400'}`}>
                  {q.prefix}-{String(q.current).padStart(3,'0')}
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-800 px-2 py-1.5">
              <p className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest mb-1">PRÓXIMOS</p>
              <div className="flex gap-1 flex-wrap">
                {q.next.map(n => (
                  <span key={n} className="border border-zinc-700 bg-zinc-900 text-zinc-400 font-mono text-[8px] px-1.5 py-0.5">
                    {q.prefix}-{String(n).padStart(3,'0')}
                  </span>
                ))}
                {q.count > q.next.length && <span className="text-zinc-600 font-mono text-[8px]">+{q.count - q.next.length}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-4 py-1.5 bg-zinc-950 text-center">
        <p className="text-zinc-700 font-mono text-[7px] uppercase tracking-[0.2em]">
          GRACIAS POR SU PACIENCIA &nbsp;◆&nbsp; ESCANEÁ EL QR DEL KIOSCO PARA SEGUIR TU TURNO
        </p>
      </div>
    </div>
  )
}

const spring = { type: 'spring', stiffness: 300, damping: 28 } as const

export default function LandingHero() {
  return (
    <section className="min-h-screen bg-zinc-950 flex flex-col justify-center pt-14 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Copy */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] mb-6"
            >
              ◆ Gestión digital de filas de espera
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="font-black uppercase tracking-tight text-zinc-100 leading-[0.95] mb-6"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.5rem)' }}
            >
              ELIMINÁ<br />
              LA FILA.<br />
              <span className="text-amber-400">ATENDÉ MÁS<br />RÁPIDO.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-zinc-400 text-base leading-relaxed mb-10 max-w-md border-l-2 border-zinc-800 pl-4"
            >
              Turnix digitaliza la gestión de turnos para cualquier negocio. Kiosco táctil, display en sala y notificaciones al celular — en tiempo real, sin hardware costoso.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ...spring }}
              className="flex flex-col sm:flex-row gap-3 mb-12"
            >
              <a href="#demo"
                className="border-2 border-amber-400 bg-amber-400/10 hover:bg-amber-400/20 active:bg-amber-400/30 transition-colors px-8 py-4 text-center font-black text-amber-400 uppercase tracking-widest text-sm">
                SOLICITAR DEMO GRATUITA
              </a>
              <a href="https://turnos-app-lilac.vercel.app/display" target="_blank" rel="noopener noreferrer"
                className="border border-zinc-700 hover:border-zinc-500 bg-zinc-900 hover:bg-zinc-800 transition-colors px-8 py-4 text-center font-black text-zinc-300 uppercase tracking-widest text-sm">
                VER DEMO EN VIVO →
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-3 gap-px bg-zinc-800 border border-zinc-800"
            >
              {[
                { value: '–40%',  label: 'TIEMPO DE ESPERA' },
                { value: '200+',  label: 'NEGOCIOS ACTIVOS'  },
                { value: '5 MIN', label: 'SETUP INICIAL'     },
              ].map(s => (
                <div key={s.label} className="bg-zinc-950 px-4 py-4 text-center">
                  <div className="font-mono font-bold text-amber-400 text-xl tabular-nums">{s.value}</div>
                  <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-4 border border-amber-400/5 pointer-events-none" />
            <DisplayMockup />
            {/* Floating ticket */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, ...spring }}
              className="absolute -bottom-4 -left-4 border border-amber-400/30 bg-zinc-900 px-4 py-3"
            >
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">TU TURNO</p>
              <div className="font-mono font-bold text-amber-400 text-2xl tabular-nums">B-021</div>
              <p className="text-[9px] font-mono text-zinc-500 mt-0.5">~8 min de espera</p>
            </motion.div>
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="absolute -top-3 -right-3 border border-cyan-400/30 bg-zinc-900 px-3 py-1.5 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">EN VIVO</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Fade bottom */}
      <div className="h-16 bg-gradient-to-b from-transparent to-zinc-950 pointer-events-none" />
    </section>
  )
}

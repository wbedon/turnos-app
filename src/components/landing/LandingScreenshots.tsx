'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Kiosk mockup ── */
function KioskMockup() {
  const queues = [
    { prefix: 'A', name: 'CAJA',         icon: '🏦', count: 8  },
    { prefix: 'B', name: 'CONSULTAS',    icon: '💬', count: 3  },
    { prefix: 'C', name: 'DEVOLUCIONES', icon: '🔄', count: 5  },
    { prefix: 'D', name: 'VIP',          icon: '⭐', count: 0, inactive: true },
  ]
  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-950">
      <header className="border-b border-zinc-800 px-5 py-4 shrink-0">
        <p className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.3em] mb-1">◆ Autoatención</p>
        <h2 className="font-black uppercase tracking-tight text-zinc-100 text-lg">¿En qué podemos ayudarte?</h2>
      </header>
      <main className="flex-1 grid grid-cols-2 gap-px bg-zinc-800 p-px">
        {queues.map((q) => (
          q.inactive
            ? <div key={q.prefix} className="flex flex-col items-center justify-center gap-3 border-0 bg-zinc-950 opacity-20 cursor-not-allowed">
                <span className="text-4xl grayscale">{q.icon}</span>
                <span className="font-bold text-zinc-600 text-sm uppercase tracking-wide">{q.name}</span>
                <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">NO DISPONIBLE</span>
              </div>
            : <button key={q.prefix}
                className="amber-glow-hover flex flex-col items-center justify-center gap-3 border-0 bg-zinc-900 hover:border-amber-400/50 hover:bg-zinc-800 transition-colors group">
                <span className="text-4xl">{q.icon}</span>
                <span className="font-bold text-zinc-100 text-sm text-center px-2 uppercase tracking-wide group-hover:text-amber-400 transition-colors">{q.name}</span>
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{q.count} en espera</span>
              </button>
        ))}
      </main>
    </div>
  )
}

/* ── Display mockup ── */
function DisplayMockup() {
  const cols = [
    { name: 'CAJA',       prefix: 'A', current: 42, icon: '🏦', next: [43,44,45], count: 8,  live: true  },
    { name: 'CONSULTAS',  prefix: 'B', current: 21, icon: '💬', next: [22,23],    count: 3,  live: false },
    { name: 'DEVOLUCIONES',prefix: 'C',current: 17, icon: '🔄', next: [18],       count: 5,  live: false },
    { name: 'VIP',        prefix: 'D', current: 9,  icon: '⭐', next: [10],       count: 2,  live: false },
  ]
  return (
    <div className="scanlines h-full flex flex-col overflow-hidden bg-zinc-950">
      <header className="border-b border-zinc-800 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-6 bg-amber-400" />
          <div>
            <p className="text-[9px] font-mono text-amber-400 uppercase tracking-[0.3em]">◆ Sistema de Turnos</p>
            <p className="font-black text-sm uppercase tracking-tight text-zinc-100">TURNOS EN ATENCIÓN</p>
          </div>
        </div>
        <div className="font-mono font-bold text-lg tracking-tight text-cyan-400 tabular-nums">09:42:31</div>
      </header>
      <main className="flex-1 grid gap-px bg-zinc-800 min-h-0" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {cols.map((q) => (
          <div key={q.prefix} className={`flex flex-col bg-zinc-950 ${q.live ? 'bg-zinc-900' : ''}`}>
            <div className={`px-3 py-2 flex items-center gap-2 border-b ${q.live ? 'border-amber-400/30' : 'border-zinc-800'}`}>
              <span className="text-base">{q.icon}</span>
              <span className="font-mono font-bold text-zinc-300 uppercase tracking-wide text-[9px]">{q.name}</span>
              {q.live && <span className="ml-auto text-[8px] font-mono text-cyan-400 animate-pulse">● LIVE</span>}
            </div>
            <div className="flex-1 flex items-center justify-center py-3">
              <div className="text-center">
                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-1">EN ATENCIÓN</p>
                <div className={`font-mono font-bold tabular-nums text-3xl ${q.live ? 'text-amber-300' : 'text-amber-400'}`}>
                  {q.prefix}-{String(q.current).padStart(3,'0')}
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-800 px-3 py-2">
              <p className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest mb-1">PRÓXIMOS</p>
              <div className="flex gap-1 flex-wrap">
                {q.next.map(n => (
                  <span key={n} className="border border-zinc-700 bg-zinc-900 text-zinc-400 font-mono text-[9px] px-1.5 py-0.5 tabular-nums">
                    {q.prefix}-{String(n).padStart(3,'0')}
                  </span>
                ))}
                {q.count > q.next.length && <span className="text-zinc-600 font-mono text-[9px]">+{q.count - q.next.length}</span>}
              </div>
            </div>
          </div>
        ))}
      </main>
      <footer className="border-t border-zinc-800 px-5 py-2 text-center shrink-0">
        <p className="text-zinc-700 font-mono text-[8px] uppercase tracking-[0.2em]">
          GRACIAS POR SU PACIENCIA &nbsp;◆&nbsp; ESCANEÁ EL QR DEL KIOSCO PARA SEGUIR TU TURNO
        </p>
      </footer>
    </div>
  )
}

/* ── Admin mockup ── */
function AdminMockup() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-950">
      <header className="border-b border-zinc-800 px-5 py-3 flex items-center justify-between shrink-0">
        <div>
          <p className="text-[9px] font-mono text-amber-400 uppercase tracking-[0.3em]">◆ Panel Operador</p>
          <p className="font-black text-sm uppercase tracking-tight text-zinc-100">VENTANILLA 1</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">ACTIVO</span>
        </div>
      </header>

      <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
        {/* Current ticket */}
        <div className="border border-amber-400/30 bg-zinc-900 p-4">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">TURNO ACTUAL</p>
          <div className="flex items-center justify-between">
            <div className="font-mono font-bold text-amber-400 text-5xl tabular-nums leading-none">
              A-042
            </div>
            <button className="border-2 border-amber-400 bg-amber-400/10 hover:bg-amber-400/20 transition-colors px-5 py-3 font-black text-amber-400 uppercase tracking-widest text-sm">
              SIGUIENTE →
            </button>
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-800">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">En espera: <span className="text-zinc-400">8</span></span>
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Promedio: <span className="text-zinc-400">3:42 min</span></span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-zinc-800">
          {[
            { label: 'ATENDIDOS', value: '41' },
            { label: 'PROM. TIEMPO', value: '3:42' },
            { label: 'EN ESPERA', value: '28' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-950 px-3 py-3 text-center">
              <div className="font-mono font-bold text-zinc-100 text-xl tabular-nums">{s.value}</div>
              <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Queue */}
        <div className="flex-1 overflow-hidden">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">PRÓXIMOS</p>
          <div className="space-y-1.5">
            {['A-043','A-044','A-045'].map((t,i) => (
              <div key={t} className="flex items-center justify-between border border-zinc-800 bg-zinc-900 px-3 py-2">
                <span className="font-mono font-bold text-zinc-300 text-sm tabular-nums">{t}</span>
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">~{(i+1)*4} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ── */
const tabs = [
  { id: 'display', label: 'DISPLAY TV',   sub: 'Pantalla en sala de espera',  caption: 'Visible para todos los clientes — en cualquier TV o monitor' },
  { id: 'kiosk',   label: 'KIOSCO',       sub: 'Terminal de autoatención',     caption: 'El cliente elige su cola y recibe un boarding pass con QR' },
  { id: 'admin',   label: 'PANEL ADMIN',  sub: 'Gestión del operador',         caption: 'Operado desde cualquier dispositivo — sin instalación' },
]

const mockups: Record<string, React.ReactNode> = {
  display: <DisplayMockup />,
  kiosk:   <KioskMockup  />,
  admin:   <AdminMockup  />,
}

export default function LandingScreenshots() {
  const [active, setActive] = useState('display')
  const current = tabs.find(t => t.id === active)!

  return (
    <section id="producto" className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24">

        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] mb-3">◆ El producto</p>
          <h2 className="font-black uppercase tracking-tight text-zinc-100 text-4xl lg:text-5xl">
            DISEÑADO PARA<br />
            <span className="text-zinc-600">EL MUNDO REAL.</span>
          </h2>
        </div>

        {/* Tab selector */}
        <div className="flex border border-zinc-800 mb-8 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-5 py-3 transition-all border-r border-zinc-800 last:border-r-0 ${
                active === tab.id
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'bg-zinc-950 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest">{tab.label}</div>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5 hidden sm:block">{tab.sub}</div>
            </button>
          ))}
        </div>

        {/* Mockup frame */}
        <div className="border border-zinc-800 relative overflow-hidden" style={{ height: '520px' }}>
          {/* Amber top border */}
          <div className="absolute top-0 left-0 right-0 h-px bg-amber-400/30 z-10" />

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {mockups[active]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Caption */}
        <p className="mt-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center">
          ◆ {current.caption}
        </p>

        {/* Live link */}
        <div className="mt-8 text-center">
          <a
            href="https://turnos-app-lilac.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 border border-zinc-800 hover:border-amber-400/30 bg-zinc-900 hover:bg-zinc-800 transition-all px-6 py-3 group"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-200 uppercase tracking-widest transition-colors">
              PROBÁ EL DEMO EN VIVO EN TURNOS-APP-LILAC.VERCEL.APP
            </span>
            <span className="text-zinc-600 group-hover:text-amber-400 transition-colors">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

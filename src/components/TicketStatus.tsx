'use client'

import { motion } from 'framer-motion'
import type { TicketStatus } from '@/types'

// ── Config de estados ──────────────────────────────────────────────

export const STATUS_CONFIG = {
  waiting: {
    label:    'EN COLA',
    message:  'Tu turno está en cola',
    dot:      'bg-amber-400',
    pill:     'border-amber-400/40 bg-amber-400/10 text-amber-400',
    ping:     true,
  },
  called: {
    label:    'ES TU TURNO',
    message:  'Dirígete al módulo de atención',
    dot:      'bg-zinc-950',
    pill:     'border-zinc-950 bg-zinc-950 text-zinc-950',
    ping:     false,
  },
  attended: {
    label:    'ATENDIDO',
    message:  'Atención completada',
    dot:      'bg-cyan-400',
    pill:     'border-cyan-400/40 bg-cyan-400/10 text-cyan-400',
    ping:     false,
  },
  cancelled: {
    label:    'CANCELADO',
    message:  'Turno cancelado',
    dot:      'bg-zinc-600',
    pill:     'border-zinc-700 bg-zinc-800/50 text-zinc-500',
    ping:     false,
  },
} satisfies Record<TicketStatus, {
  label: string; message: string; dot: string; pill: string; ping: boolean
}>

// ── StatusPill — badge pequeño reutilizable ───────────────────────

export function StatusPill({ status }: { status: TicketStatus }) {
  const c = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 ${c.pill}`}>
      <span className="relative flex h-1.5 w-1.5">
        {c.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${c.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${c.dot}`} />
      </span>
      <span className="text-[9px] font-mono uppercase tracking-[0.2em]">{c.label}</span>
    </span>
  )
}

// ── SVG Icons ────────────────────────────────────────────────────────

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.path
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.3, ease: 'easeOut' }}
      />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── TicketStatusScreen — pantalla completa por estado ─────────────

const SPRING = { type: 'spring', stiffness: 300, damping: 22 } as const

interface ScreenProps {
  ticketLabel: string  // e.g. "A-010"
  queueName:   string
}

export function CalledStatusScreen({ ticketLabel, queueName }: ScreenProps) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-amber-400 flex flex-col items-center justify-center gap-6 p-8 text-zinc-950"
    >
      {/* Icono campana */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 240, damping: 12 }}
        className="relative"
      >
        <motion.div
          animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
          transition={{ delay: 0.4, duration: 0.7, ease: 'easeInOut' }}
        >
          <IconBell className="w-16 h-16" />
        </motion.div>
        {/* Pulso de fondo */}
        <motion.div
          className="absolute inset-0 rounded-full bg-amber-300"
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        />
      </motion.div>

      {/* Pill de estado */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="border border-zinc-950/20 px-3 py-1 flex items-center gap-2"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-800">
          {STATUS_CONFIG.called.label}
        </span>
      </motion.div>

      {/* Mensaje principal */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, ...SPRING }}
        className="text-4xl font-black text-center tracking-tight uppercase leading-tight"
      >
        ¡Es tu turno!
      </motion.h1>

      {/* Número */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 240, damping: 18 }}
        className="border-2 border-zinc-950/20 px-10 py-5 text-center"
      >
        <div className="font-mono font-bold tabular-nums text-6xl tracking-tight">
          {ticketLabel}
        </div>
        <div className="text-sm font-mono text-zinc-700 mt-2 uppercase tracking-widest">
          {queueName}
        </div>
      </motion.div>

      {/* Mensaje acción */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-mono text-zinc-700 uppercase tracking-wider text-center"
      >
        {STATUS_CONFIG.called.message}
      </motion.p>
    </motion.div>
  )
}

export function AttendedStatusScreen({ ticketLabel }: Pick<ScreenProps, 'ticketLabel'>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 p-8 text-center"
    >
      {/* Círculo con check animado */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 20 }}
        className="w-24 h-24 rounded-full border-2 border-cyan-400 flex items-center justify-center relative"
      >
        {/* Pulso */}
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-400"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
        />
        <IconCheck className="w-12 h-12 text-cyan-400" />
      </motion.div>

      {/* Pill */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <StatusPill status="attended" />
      </motion.div>

      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ...SPRING }}
        className="text-3xl font-black uppercase tracking-widest font-mono text-cyan-400"
      >
        ¡Atendido!
      </motion.h1>

      {/* Número */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="font-mono font-bold text-zinc-600 text-2xl tabular-nums"
      >
        {ticketLabel}
      </motion.p>

      {/* Mensaje */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-zinc-600 font-mono text-sm uppercase tracking-wider"
      >
        {STATUS_CONFIG.attended.message} · Gracias por tu visita
      </motion.p>
    </motion.div>
  )
}

export function CancelledStatusScreen({ ticketLabel }: Pick<ScreenProps, 'ticketLabel'>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 p-8 text-center"
    >
      {/* Ícono X */}
      <motion.div
        initial={{ scale: 0.6, rotate: 45, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 280, damping: 20 }}
        className="w-20 h-20 border border-zinc-700 flex items-center justify-center"
      >
        <IconX className="w-10 h-10 text-zinc-600" />
      </motion.div>

      {/* Pill */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <StatusPill status="cancelled" />
      </motion.div>

      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...SPRING }}
        className="text-2xl font-black uppercase tracking-widest font-mono text-zinc-500"
      >
        {STATUS_CONFIG.cancelled.message}
      </motion.h1>

      {/* Número */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="font-mono font-bold text-zinc-700 text-xl tabular-nums"
      >
        {ticketLabel}
      </motion.p>
    </motion.div>
  )
}

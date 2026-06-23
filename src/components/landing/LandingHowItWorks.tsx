'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    label:  'EL CLIENTE TOMA SU TURNO',
    desc:   'Desde el kiosco táctil en la entrada o escaneando el QR con su celular. Recibe un boarding pass digital con número y tiempo estimado.',
    detail: 'KIOSCO TÁCTIL · QR · SIN APP QUE INSTALAR',
    icon:   '📱',
  },
  {
    number: '02',
    label:  'EL DISPLAY AVISA EN TIEMPO REAL',
    desc:   'La pantalla principal muestra el número llamado, la ventanilla y el estado de todas las colas. Sin amontonarse, sin preguntar cuánto falta.',
    detail: 'TV · MONITOR · CUALQUIER PANTALLA',
    icon:   '📺',
  },
  {
    number: '03',
    label:  'EL OPERADOR GESTIONA TODO',
    desc:   'Con un clic llama al siguiente turno. Puede pausar colas, ver métricas del día y gestionar ventanillas — desde cualquier dispositivo.',
    detail: 'WEB · TABLET · SIN INSTALACIÓN',
    icon:   '🖥️',
  },
]

export default function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24">

        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] mb-3">◆ Cómo funciona</p>
          <h2 className="font-black uppercase tracking-tight text-zinc-100 text-4xl lg:text-5xl">
            TRES PASOS.<br />
            <span className="text-zinc-600">SIN COMPLICACIONES.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-px bg-zinc-800">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-zinc-950 p-8 flex flex-col gap-6 group"
            >
              {/* Number + icon */}
              <div className="flex items-start justify-between">
                <span className="font-mono font-bold text-zinc-800 text-6xl leading-none select-none">
                  {step.number}
                </span>
                <span className="text-3xl" aria-hidden="true">{step.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-black uppercase tracking-tight text-zinc-100 text-lg mb-3 group-hover:text-amber-400 transition-colors">
                  {step.label}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed border-l border-zinc-800 pl-3">
                  {step.desc}
                </p>
              </div>

              {/* Detail badge */}
              <p className="text-[9px] font-mono text-amber-400/60 uppercase tracking-widest border-t border-zinc-800 pt-4">
                {step.detail}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a href="#demo" className="text-xs font-mono text-zinc-500 hover:text-amber-400 uppercase tracking-widest transition-colors">
            ¿QUERÉS VER UNA DEMO EN VIVO? →
          </a>
        </div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'

const benefits = [
  { tag: 'RETENCIÓN',     title: 'Reducís el tiempo de espera hasta un 40%',       desc: 'La espera digital elimina la percepción de cola. El cliente puede hacer otras cosas mientras aguarda su turno.' },
  { tag: 'AHORRO',        title: 'Sin hardware costoso',                             desc: 'Funciona en cualquier TV, tablet o monitor que ya tengas. No invertís en nada propietario.' },
  { tag: 'EXPERIENCIA',   title: 'Notificaciones push al celular',                  desc: '"Te faltan 2 turnos" — el cliente recibe un aviso y vuelve justo cuando lo necesitás.' },
  { tag: 'ANALYTICS',     title: 'Panel de métricas en tiempo real',                desc: 'Turnos atendidos, tiempo promedio, pico de demanda — todo visible al instante desde el admin.' },
  { tag: 'FLEXIBILIDAD',  title: 'Múltiples colas simultáneas',                     desc: 'Hasta 4 colas independientes (Caja, Consultas, VIP, Devoluciones) gestionadas en paralelo.' },
  { tag: 'VELOCIDAD',     title: 'Setup en menos de 5 minutos',                     desc: 'Creá tu cuenta, configurá las colas y empezá a atender. Sin IT, sin servidores, sin instalación.' },
  { tag: 'CONFIABILIDAD', title: '99.9% de disponibilidad garantizada',             desc: 'Infraestructura en la nube con alta disponibilidad y recuperación automática ante cualquier falla.' },
  { tag: 'INTEGRACIÓN',   title: 'API REST para integraciones',                     desc: 'Conectá Turnix con tu CRM, sistema de citas o base de datos de clientes mediante nuestra API.' },
]

export default function LandingBenefits() {
  return (
    <section className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24">

        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] mb-3">◆ Beneficios</p>
          <h2 className="font-black uppercase tracking-tight text-zinc-100 text-4xl lg:text-5xl">
            TODO LO QUE NECESITÁS.<br />
            <span className="text-zinc-600">NADA DE LO QUE NO.</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          {benefits.map((b, i) => (
            <motion.div
              key={b.tag}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.06 }}
              className="bg-zinc-950 p-6 flex flex-col gap-4 group hover:bg-zinc-900 transition-colors"
            >
              {/* Tag */}
              <span className="text-[9px] font-mono text-amber-400/70 uppercase tracking-widest border-b border-zinc-800 pb-3">
                {b.tag}
              </span>
              {/* Content */}
              <h3 className="font-black uppercase tracking-tight text-zinc-100 text-sm leading-tight group-hover:text-amber-400 transition-colors">
                {b.title}
              </h3>
              <p className="text-zinc-600 text-xs leading-relaxed mt-auto">
                {b.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'

const cases = [
  {
    icon: '🏥', sector: 'SALUD', title: 'Clínicas y consultorios',
    pain:    'Los pacientes llegan todos a la misma hora y se acumulan en la sala.',
    solution:'Con SHÜY4Y el paciente toma turno desde su celular y vuelve cuando es su momento.',
    metrics: ['–60% abandono de consultas', 'Sala organizada', 'Mejor percepción del servicio'],
  },
  {
    icon: '🏦', sector: 'FINANZAS', title: 'Bancos y cooperativas',
    pain:    'Las filas en cajas generan tensión y pérdida de clientes.',
    solution:'4 colas simultáneas con tiempo estimado visible para cada trámite.',
    metrics: ['Multi-cola (Caja, Créditos, Atención)', 'Display en sala', 'Métricas por horario'],
  },
  {
    icon: '🏛️', sector: 'GOBIERNO', title: 'Municipios y oficinas',
    pain:    'La fila desordenada genera conflictos y reclamos del ciudadano.',
    solution:'Ventanillas de trámites con display informativo y registro de atenciones.',
    metrics: ['Orden y transparencia', 'Registro por trámite', 'Reportes diarios'],
  },
  {
    icon: '💊', sector: 'COMERCIO', title: 'Farmacias y ópticas',
    pain:    'El asesoramiento personalizado lleva tiempo y la fila visible ahuyenta clientes.',
    solution:'Kiosco discreto en la entrada — los clientes esperan sin verse como una fila larga.',
    metrics: ['Más tiempo de asesoría', 'Ambiente sin presión', 'Más ventas'],
  },
  {
    icon: '🚗', sector: 'SERVICIOS', title: 'Concesionarias y talleres',
    pain:    'La recepción personalizada de vehículos requiere orden estricto.',
    solution:'Turnos por tipo (Recepción, Entrega, Ventas) con pantalla en sala VIP.',
    metrics: ['Por tipo de servicio', 'Sala de espera VIP', 'Integración con CRM'],
  },
  {
    icon: '🎓', sector: 'EDUCACIÓN', title: 'Universidades y colegios',
    pain:    'Inscripciones y secretarías colapsan con filas desorganizadas.',
    solution:'Gestión de turnos para secretaría, biblioteca y servicios estudiantiles.',
    metrics: ['Setup temporal o fijo', 'Multi-sede', 'Sin costo de hardware'],
  },
]

export default function LandingUseCases() {
  return (
    <section id="casos-de-uso" className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24">

        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] mb-3">◆ Casos de uso</p>
          <h2 className="font-black uppercase tracking-tight text-zinc-100 text-4xl lg:text-5xl">
            ¿TU NEGOCIO ATIENDE PERSONAS?<br />
            <span className="text-amber-400">SHÜY4Y ES PARA VOS.</span>
          </h2>
        </div>

        {/* Cases grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
          {cases.map((c, i) => (
            <motion.div
              key={c.sector}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (i % 3) * 0.08 }}
              className="bg-zinc-950 p-6 flex flex-col gap-5 group hover:bg-zinc-900 transition-colors"
            >
              {/* Icon + sector */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest border-b border-zinc-800 pb-0.5">
                  {c.sector}
                </span>
              </div>

              <h3 className="font-black uppercase tracking-tight text-zinc-100 text-base group-hover:text-amber-400 transition-colors">
                {c.title}
              </h3>

              {/* Pain */}
              <div className="border-l-2 border-zinc-800 pl-3">
                <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">EL PROBLEMA</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{c.pain}</p>
              </div>

              {/* Solution */}
              <div className="border-l-2 border-amber-400/30 pl-3">
                <p className="text-[9px] font-mono text-amber-400/60 uppercase tracking-widest mb-1">LA SOLUCIÓN</p>
                <p className="text-zinc-400 text-xs leading-relaxed">{c.solution}</p>
              </div>

              {/* Metrics */}
              <ul className="mt-auto space-y-1.5 border-t border-zinc-800 pt-4">
                {c.metrics.map(m => (
                  <li key={m} className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wide">
                    <span className="text-amber-400">◆</span>
                    {m}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

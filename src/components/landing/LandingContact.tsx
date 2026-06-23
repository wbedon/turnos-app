'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { submitDemoRequest } from '@/app/actions/submitDemo'

const industries = [
  'Salud (clínica, consultorio, laboratorio)',
  'Finanzas (banco, cooperativa, fintech)',
  'Gobierno (municipio, oficina pública)',
  'Comercio (farmacia, óptica, tienda)',
  'Servicios (taller, concesionaria)',
  'Educación (universidad, colegio)',
  'Otro',
]

const perks = [
  'Demo personalizada en menos de 24 hs',
  'Onboarding incluido sin costo extra',
  'Primer mes de setup gratuito',
  'Sin contrato de permanencia',
]

export default function LandingContact() {
  const [sent, setSent]               = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', industry: '', message: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    startTransition(async () => {
      const result = await submitDemoRequest(form)
      if (result.ok) setSent(true)
      else setServerError(result.error ?? 'Error inesperado. Intentá de nuevo.')
    })
  }

  return (
    <section id="demo" className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24">

        {/* Header */}
        <div className="mb-16">
          <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] mb-3">◆ Solicitar demostración</p>
          <h2 className="font-black uppercase tracking-tight text-zinc-100 text-4xl lg:text-5xl">
            EMPEZÁ GRATIS.<br />
            <span className="text-zinc-600">SIN TARJETA DE CRÉDITO.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">

          {/* Left — perks + testimonial */}
          <div className="lg:col-span-2 space-y-8">
            <ul className="space-y-4">
              {perks.map(p => (
                <li key={p} className="flex items-start gap-3 text-zinc-400 text-sm">
                  <span className="text-amber-400 font-mono mt-0.5">◆</span>
                  {p}
                </li>
              ))}
            </ul>

            {/* Testimonial / social proof */}
            <div className="border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex -space-x-2">
                  {['JL','MG','RP','SA'].map(i => (
                    <div key={i} className="w-8 h-8 border-2 border-zinc-900 bg-zinc-700 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-300">
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-zinc-100 text-sm font-black uppercase tracking-wide">200+ NEGOCIOS</div>
                  <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">YA USAN SHÜY4Y</div>
                </div>
              </div>
              <blockquote className="text-zinc-500 text-sm leading-relaxed italic border-l border-zinc-800 pl-3">
                "Implementamos SHÜY4Y en un día. Las quejas de espera bajaron a casi cero la primera semana."
              </blockquote>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-zinc-700 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-300">M</div>
                <div>
                  <p className="text-zinc-300 text-xs font-black uppercase tracking-wide">MARIANA G.</p>
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">DIRECTORA · CLÍNICA SAN MARTÍN</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-3">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-amber-400/30 bg-zinc-900 p-10 text-center"
              >
                <div className="w-12 h-12 border border-amber-400/30 bg-amber-400/10 flex items-center justify-center mx-auto mb-5">
                  <span className="text-amber-400 font-mono font-bold text-lg">✓</span>
                </div>
                <h3 className="font-black uppercase tracking-tight text-zinc-100 text-xl mb-2">¡LISTO!</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Recibimos tu solicitud. Un especialista de SHÜY4Y se contacta en menos de 24 horas para coordinar la demo.
                </p>
                <p className="mt-6 text-[10px] font-mono text-amber-400/60 uppercase tracking-widest">
                  ◆ MIENTRAS TANTO PODÉS EXPLORAR EL DEMO EN VIVO
                </p>
                <a href="https://turnos-app-lilac.vercel.app" target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-block border border-zinc-700 hover:border-zinc-500 bg-zinc-800 hover:bg-zinc-700 transition-colors px-6 py-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  VER DEMO →
                </a>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="border border-zinc-800 bg-zinc-900 p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    { name: 'name',    label: 'NOMBRE *',    type: 'text',  placeholder: 'Juan García',          required: true  },
                    { name: 'company', label: 'EMPRESA *',   type: 'text',  placeholder: 'Mi Empresa SA',        required: true  },
                    { name: 'email',   label: 'EMAIL *',     type: 'email', placeholder: 'juan@empresa.com',     required: true  },
                    { name: 'phone',   label: 'TELÉFONO',    type: 'tel',   placeholder: '+54 11 1234-5678',     required: false },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">{f.label}</label>
                      <input
                        type={f.type} name={f.name} required={f.required}
                        value={form[f.name as keyof typeof form]}
                        onChange={handleChange}
                        placeholder={f.placeholder}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400/50 px-4 py-3 text-zinc-100 text-sm font-mono placeholder-zinc-700 outline-none transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">TIPO DE NEGOCIO *</label>
                  <select
                    name="industry" required value={form.industry} onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400/50 px-4 py-3 text-sm font-mono outline-none transition-colors appearance-none cursor-pointer text-zinc-100"
                  >
                    <option value="" disabled className="bg-zinc-950 text-zinc-600">SELECCIONÁ TU INDUSTRIA</option>
                    {industries.map(i => (
                      <option key={i} value={i} className="bg-zinc-950">{i}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">COMENTARIOS (OPCIONAL)</label>
                  <textarea
                    name="message" rows={3} value={form.message} onChange={handleChange}
                    placeholder="Cantidad de ventanillas, volumen de clientes, integración con sistemas actuales..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400/50 px-4 py-3 text-zinc-100 text-sm font-mono placeholder-zinc-700 outline-none transition-colors resize-none"
                  />
                </div>

                {serverError && (
                  <p className="border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono px-4 py-3 text-center uppercase tracking-wider">
                    ERROR — {serverError}
                  </p>
                )}

                <button
                  type="submit" disabled={isPending}
                  className="w-full border-2 border-amber-400 bg-amber-400/10 hover:bg-amber-400/20 active:bg-amber-400/30 transition-colors px-6 py-4 font-black text-amber-400 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? '◆ ENVIANDO...' : 'QUIERO MI DEMO GRATUITA →'}
                </button>

                <p className="text-center text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
                  SIN SPAM · SIN COMPROMISO · CANCELÁ CUANDO QUIERAS
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

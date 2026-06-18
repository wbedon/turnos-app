'use client'

import Link from "next/link";
import { motion } from "framer-motion";

const spring = { type: "spring", stiffness: 400, damping: 28 } as const;

const screens = [
  { href: "/kiosk",   icon: "🖨️", label: "Kiosco",  desc: "Pantalla para tomar turno",        active: true  },
  { href: "/display", icon: "📺", label: "Display", desc: "Pantalla TV sala de espera",        active: true  },
  { href: "/admin",   icon: "⚙️", label: "Admin",   desc: "Panel del operador",               active: true  },
  { href: "#",        icon: "📱", label: "Móvil",   desc: "Acceso via QR del kiosco",         active: false },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8 bg-stone-50">

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <div className="text-5xl mb-4" aria-hidden="true">🏪</div>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Sistema de Turnos</h1>
        <p className="text-stone-500 mt-2 text-sm">Seleccioná la pantalla a usar</p>
      </motion.div>

      <nav aria-label="Pantallas del sistema" className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        {screens.map(({ href, icon, label, desc, active }, i) => {
          const content = (
            <>
              <span className="text-4xl" aria-hidden="true">{icon}</span>
              <span className="font-semibold text-stone-800 text-base">{label}</span>
              <span className="text-xs text-stone-400 text-center leading-snug">{desc}</span>
            </>
          );

          if (!active) return (
            <div
              key={label}
              aria-disabled="true"
              aria-label={`${label} — no disponible, accedé por QR del kiosco`}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl ring-1 ring-stone-200 opacity-40 cursor-not-allowed select-none"
            >
              {content}
            </div>
          );

          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={spring}>
                <Link
                  href={href}
                  aria-label={`${label} — ${desc}`}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl ring-1 ring-stone-200
                             hover:ring-orange-300 hover:shadow-md transition-shadow duration-200 block"
                >
                  {content}
                </Link>
              </motion.div>
            </motion.div>
          );
        })}
      </nav>
    </main>
  );
}

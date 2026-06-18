'use client'

import Link from "next/link";
import { motion } from "framer-motion";

const screens = [
  { href: "/kiosk",   label: "KIOSCO",   sub: "Sacar turno",          active: true  },
  { href: "/display", label: "DISPLAY",  sub: "Pantalla sala espera", active: true  },
  { href: "/admin",   label: "ADMIN",    sub: "Panel operador",       active: true  },
  { href: "#",        label: "MÓVIL",    sub: "Acceso por QR",        active: false },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-12 p-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] mb-3">
          ◆ Sistema de Turnos
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-zinc-100">
          Turnos
        </h1>
        <div className="mt-3 h-px w-16 bg-amber-400 mx-auto" />
      </motion.div>

      {/* Nav grid */}
      <nav aria-label="Pantallas del sistema" className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {screens.map(({ href, label, sub, active }, i) => {
            const base = "flex flex-col justify-end p-5 border border-zinc-800 aspect-square";

          if (!active) return (
            <div
              key={label}
              aria-disabled="true"
              aria-label={`${label} — no disponible`}
              className={`${base} opacity-20 cursor-not-allowed select-none`}
            >
              <p className="font-black text-sm uppercase tracking-wider text-zinc-600">{label}</p>
              <p className="text-xs text-zinc-700 mt-0.5">{sub}</p>
            </div>
          );

          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div whileHover={{ borderColor: "#fbbf24" }} whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                style={{ borderColor: "#27272a" }}
                className="border"
              >
                <Link
                  href={href}
                  aria-label={`${label} — ${sub}`}
                  className={`${base} group hover:bg-zinc-900 transition-colors duration-150 block`}
                >
                  <p className="font-black text-sm uppercase tracking-wider text-zinc-100">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                </Link>
              </motion.div>
            </motion.div>
          );
        })}
      </nav>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs font-mono text-zinc-700 tracking-widest"
      >
        SELECCIONÁ UN MÓDULO
      </motion.p>
    </main>
  );
}

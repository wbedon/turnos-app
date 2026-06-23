import Link from 'next/link'

export default function LandingFooter() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-3">
              <div className="w-px h-4 bg-amber-400" />
              <span className="font-black text-sm uppercase tracking-[0.2em] text-zinc-100">SHÜY4Y</span>
            </a>
            <p className="text-zinc-600 text-xs leading-relaxed font-mono">
              La plataforma de gestión de turnos que moderniza la atención al cliente. Sin filas, sin papel, sin complicaciones.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-4">PRODUCTO</p>
            <ul className="space-y-2.5">
              {[
                ['Cómo funciona', '#como-funciona'],
                ['El producto',   '#producto'      ],
                ['Casos de uso',  '#casos-de-uso'  ],
                ['Demo en vivo',  'https://turnos-app-lilac.vercel.app'],
              ].map(([label, href]) => (
                <li key={label}>
                  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                    className="text-xs font-mono text-zinc-500 hover:text-amber-400 uppercase tracking-widest transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-4">ACCESO</p>
            <ul className="space-y-2.5">
              {[
                ['Solicitar demo', '#demo'],
                ['Panel admin',    '/admin' ],
                ['Kiosco',         '/kiosk' ],
                ['Display TV',     '/display'],
                ['Dev panel',      '/dev'   ],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href}
                    className="text-xs font-mono text-zinc-500 hover:text-amber-400 uppercase tracking-widest transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
            © 2026 SHÜY4Y. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">99.9% UPTIME · SA-EAST-1</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

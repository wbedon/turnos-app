'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const links = [
  { label: 'CÓMO FUNCIONA', href: '#como-funciona' },
  { label: 'PRODUCTO',      href: '#producto'       },
  { label: 'CASOS DE USO',  href: '#casos-de-uso'   },
  { label: 'DEMO',          href: '#demo'            },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-px h-5 bg-amber-400" aria-hidden="true" />
            <span className="font-black text-sm uppercase tracking-[0.2em] text-zinc-100 group-hover:text-amber-400 transition-colors">
              TURNIX
            </span>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest hidden sm:block">
              ◆ SISTEMA DE TURNOS
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a key={l.href} href={l.href}
                className="text-[11px] font-mono text-zinc-500 hover:text-amber-400 uppercase tracking-widest transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dev"
              className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors">
              ACCEDER
            </Link>
            <a href="#demo"
              className="border border-amber-400 bg-amber-400/10 hover:bg-amber-400/20 transition-colors px-4 py-2 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
              SOLICITAR DEMO
            </a>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-zinc-400 hover:text-white p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open
                ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>
                : <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-800">
          <div className="px-6 py-4 space-y-3">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="block text-[11px] font-mono text-zinc-400 hover:text-amber-400 uppercase tracking-widest py-2 transition-colors">
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-zinc-800">
              <a href="#demo" onClick={() => setOpen(false)}
                className="block border border-amber-400 bg-amber-400/10 px-4 py-3 text-center text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                SOLICITAR DEMO
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
